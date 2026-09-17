import { getCollection, type CollectionEntry } from 'astro:content';
import { isSpamBlogPost } from './spam-blog';

/** Posts per page on the blog archive. */
export const BLOG_PAGE_SIZE = 12;

/**
 * CMS clocks / scheduled publish can sit a few hours ahead of the build host.
 * Dropping those posts would make Payload edits "not appear" on the live site.
 * Must match scripts/assert-publish-ready.mjs FUTURE_SLACK_MS.
 */
export const FUTURE_SLACK_MS = 48 * 60 * 60 * 1000;

type Post = CollectionEntry<'blog'>;

/**
 * Publication time used for ordering. pubDate/date first, updatedDate only as a
 * fallback when neither exists — sorting by updatedDate would push an old post
 * above a newer one while the card still shows its original pubDate.
 */
function timestamp(post: Post): number {
  const candidates = [post.data.pubDate, (post.data as { date?: Date }).date, post.data.updatedDate];
  for (const value of candidates) {
    if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.valueOf();
  }
  return 0;
}

const STUB_SLUGS = new Set(['hello-world', 'blog-template']);
const UNPUBLISHED = new Set(['draft', 'unpublished', 'private', 'trash', 'archived']);
const PUBLISHED = new Set(['published', 'publish', 'live']);

function statusOf(data: Post['data']): string {
  const rec = data as { publishStatus?: string; _status?: string; status?: string };
  const raw = rec.publishStatus || rec._status || rec.status || '';
  return String(raw).trim().toLowerCase();
}

/**
 * Single source of truth for "is this post live?".
 * Every listing and every getStaticPaths must go through getBlogPosts(), so a
 * post can never be listed in one place and 404 in another.
 *
 * Leftover Payload `draft: true` is NOT unpublished — CMS publishStatus /
 * _status (and WordPress publish) are source of truth. Hide only stubs,
 * explicit unpublished/`_unpublished`, or `_spam`.
 */
export function isPublished(post: Post): boolean {
  const slug = post.id.toLowerCase().replace(/\.mdx?$/i, '');
  if (STUB_SLUGS.has(slug) || slug.startsWith('blog-template') || slug.startsWith('_')) {
    return false;
  }
  if (slug.includes('_unpublished') || slug.includes('_spam')) return false;
  if ((post.data as { _spam?: unknown })._spam) return false;

  const status = statusOf(post.data);
  if (PUBLISHED.has(status)) {
    /* published wins over leftover draft */
  } else if (UNPUBLISHED.has(status)) {
    return false;
  }

  if (isSpamBlogPost(post.id, post.body ?? '', post.data.title ?? '')) return false;

  const t = timestamp(post);
  if (t > Date.now() + FUTURE_SLACK_MS) return false;
  return true;
}

/** Newest-first published posts from the local collection (filled by Payload sync). */
export async function getBlogPosts(): Promise<Post[]> {
  const posts = await getCollection('blog');
  return posts.filter(isPublished).sort((a, b) => timestamp(b) - timestamp(a));
}

/** Latest N published posts, for homepage and related-post blocks. */
export async function getRecentBlogPosts(limit = 6): Promise<Post[]> {
  return (await getBlogPosts()).slice(0, limit);
}

/** Collection id — same value getStaticPaths uses for `/{slug}/`. */
export function postSlug(post: Post): string {
  return post.id;
}

export function postHref(post: Post): string {
  return `/${postSlug(post)}/`;
}

/**
 * Extra URL slugs Payload may set in frontmatter. The file id is always the
 * canonical route; these aliases stop a CMS slug rename from 404ing.
 */
export function extraRouteSlugs(post: Post): string[] {
  const extras: string[] = [];
  const raw = [post.data.slug, post.data.legacySlug];
  for (const value of raw) {
    if (typeof value !== 'string') continue;
    const slug = value
      .trim()
      .replace(/^\/+|\/+$/g, '')
      .split('/')
      .pop();
    if (!slug || slug === post.id) continue;
    if (/^(blog|contact|home|category)$/i.test(slug)) continue;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug)) continue;
    extras.push(slug);
  }
  return extras;
}

/**
 * WordPress `/category/<name>/` matching.
 * `/category/blog/` is the full article index — Payload posts often have no
 * category, so requiring "Blog" would hide every new CMS article there.
 */
export function matchesCategory(post: Post, categoryName: string): boolean {
  const name = categoryName.trim().toLowerCase().replace(/\s+/g, '-');
  if (!name) return false;
  if (name === 'blog') return true;
  const cats = (post.data.categories ?? []).map((cat) =>
    String(cat).trim().toLowerCase().replace(/\s+/g, '-'),
  );
  if (cats.length === 0) return false;
  return cats.includes(name);
}

/**
 * Teaser for a card. Uses the post's own description when it has one, else the
 * opening prose — a description-less Payload post must not render a blank card.
 */
export function postExcerpt(post: Post, limit = 160): string {
  const given = post.data.description?.trim();
  if (given) return given.length > limit ? `${given.slice(0, limit).trimEnd()}…` : given;

  const plain = (post.body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+.*$/gm, ' ')
    .replace(/[*_`>|#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= limit) return plain;
  return `${plain.slice(0, limit).trimEnd()}…`;
}
