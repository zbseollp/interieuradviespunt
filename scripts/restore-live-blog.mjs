#!/usr/bin/env node
/**
 * After Payload clean-sync + git restore, pull live-only articles that exist
 * on the public site but have no src/content/blog/<slug>.mdx.
 *
 * Those posts were published from Payload, then deleted/unpublished in the CMS
 * (or never written back to git). guard-deploy would abort the deploy rather
 * than 404 them — this writes the live HTML back to MDX so they stay online.
 *
 * CMS smoke-test slugs (test-test, asdf, …) are skipped; guard-deploy is
 * allowed to drop those so a junk post cannot fail production.
 *
 *   node scripts/restore-live-blog.mjs
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BLOG_DIR } from './lib/blog-files.mjs';
import { isCmsTestSlug } from './lib/cms-test-slug.mjs';
import {
  BLOG_LISTING_CANDIDATES,
  crawlLiveListingHtml,
  extractLiveArticlePaths,
  fetchText,
  siteOrigin,
} from './lib/live-site.mjs';
import { sanitizeMdxBody } from './lib/mdx-sanitize.mjs';

const FALLBACK_IMAGE = '/images/2023/05/wanddecoratie.jpg';
const SKIP_SLUGS = new Set([
  'blog',
  'blogs',
  'contact',
  'home',
  'beste-lightbox',
  'category',
  'artikelen',
  'architectenbureaus',
]);

function yamlQuote(value) {
  const s = String(value ?? '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function firstMatch(html, re) {
  const m = html.match(re);
  return m ? m[1] : '';
}

function htmlToMarkdown(html) {
  let text = html.replace(/\s+data-astro-cid-[a-z0-9]+=""/gi, '');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<h([1-6])[^>]*>/gi, (_, n) => `\n${'#'.repeat(Number(n))} `);
  text = text.replace(/<\/h[1-6]>/gi, '\n\n');
  text = text.replace(/<\/p>/gi, '\n\n');
  text = text.replace(/<p[^>]*>/gi, '');
  text = text.replace(/<(?:strong|b)[^>]*>/gi, '**');
  text = text.replace(/<\/(?:strong|b)>/gi, '**');
  text = text.replace(/<(?:em|i)[^>]*>/gi, '_');
  text = text.replace(/<\/(?:em|i)>/gi, '_');
  text = text.replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
    const name = stripTags(label) || href;
    return `[${name}](${href})`;
  });
  text = text.replace(/<li[^>]*>/gi, '- ');
  text = text.replace(/<\/li>/gi, '\n');
  text = text.replace(/<\/?(?:ul|ol|div|span|section|article)[^>]*>/gi, '\n');
  text = text.replace(/<img[^>]*src="([^"]+)"[^>]*>/gi, (_, src) => `![](${src})`);
  text = text.replace(/<[^>]+>/g, '');
  text = decodeEntities(text);
  return `${text.replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

function parseArticle(html) {
  if (!/article-hero__title|article-prose/.test(html)) return null;

  const title = stripTags(firstMatch(html, /<h1[^>]*class="[^"]*article-hero__title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i));
  const description = stripTags(firstMatch(html, /<p[^>]*class="[^"]*article-hero__lead[^"]*"[^>]*>([\s\S]*?)<\/p>/i));
  const pubDate = firstMatch(html, /<time[^>]*datetime="([^"]+)"/i);
  const image = firstMatch(html, /<div[^>]*class="[^"]*article-figure[^"]*"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/i);
  const prose = firstMatch(html, /<div[^>]*class="[^"]*article-prose[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  if (!title) return null;
  const body = htmlToMarkdown(prose || description);
  if (!body.trim()) return null;

  return {
    title,
    description: description || title,
    pubDate: pubDate || new Date().toISOString(),
    image: image && !image.includes('wanddecoratie') && image !== FALLBACK_IMAGE ? image : '',
    body,
  };
}

function toMdx(parsed) {
  const lines = [
    '---',
    `title: ${yamlQuote(parsed.title)}`,
    `description: ${yamlQuote(parsed.description)}`,
    `pubDate: ${yamlQuote(parsed.pubDate)}`,
    'categories:',
    '  - "Blog"',
  ];
  if (parsed.image) lines.push(`featuredImage: ${parsed.image}`);
  lines.push('---', '', sanitizeMdxBody(parsed.body));
  return `${lines.join('\n').trimEnd()}\n`;
}

const origin = siteOrigin();
if (!origin) {
  console.log('[restore-live-blog] no `site` in astro.config — skipping');
  process.exit(0);
}

const { html, pages } = await crawlLiveListingHtml(origin, BLOG_LISTING_CANDIDATES);
if (!html) {
  console.log('[restore-live-blog] could not reach live listings — skipping (guard-deploy will refuse if unsafe)');
  process.exit(0);
}

mkdirSync(BLOG_DIR, { recursive: true });

const livePaths = [...extractLiveArticlePaths(html)].sort();
const restored = [];
const skippedTest = [];

for (const urlPath of livePaths) {
  const slug = urlPath.replace(/^\/+|\/+$/g, '');
  if (!slug || slug.includes('/') || SKIP_SLUGS.has(slug)) continue;
  if (isCmsTestSlug(slug)) {
    skippedTest.push(urlPath);
    continue;
  }

  const dest = join(BLOG_DIR, `${slug}.mdx`);
  if (existsSync(dest) || existsSync(join(BLOG_DIR, `${slug}.md`))) continue;

  const pageHtml = await fetchText(origin + urlPath);
  if (!pageHtml) continue;
  const parsed = parseArticle(pageHtml);
  if (!parsed) continue;

  writeFileSync(dest, toMdx(parsed));
  restored.push(dest);
}

if (skippedTest.length > 0) {
  console.log(
    `[restore-live-blog] skipping ${skippedTest.length} CMS test slug(s) (guard will allow drop): ` +
      skippedTest.slice(0, 8).join(', ') +
      (skippedTest.length > 8 ? ' …' : ''),
  );
}

if (restored.length === 0) {
  console.log(
    `[restore-live-blog] no live-only articles to restore (${livePaths.length} listing URL(s) from ${pages.length} page(s))`,
  );
  process.exit(0);
}

console.log(`[restore-live-blog] restored ${restored.length} live-only article(s):`);
for (const f of restored.slice(0, 20)) console.log(`  · ${f}`);
if (restored.length > 20) console.log(`  … and ${restored.length - 20} more`);
