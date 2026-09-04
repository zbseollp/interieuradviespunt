#!/usr/bin/env node
/**
 * Flag hard-spam posts (injected scripts, casino SEO, SMM/affiliate) as drafts,
 * and REPORT off-topic gossip filler without touching it. Nothing is ever
 * deleted: the files stay on disk and the loader filters drafts out of the build.
 *
 *   node scripts/remove-spam-blog.mjs                 mark hard spam as draft, report off-topic
 *   node scripts/remove-spam-blog.mjs --dry-run       report only, delete nothing
 *   node scripts/remove-spam-blog.mjs --apply-offtopic also mark the reported off-topic posts
 *
 * Off-topic removal is opt-in because "is this on topic" is an editorial call:
 * auto-deleting it would 404 live, indexed URLs.
 */
import { writeFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { BLOG_DIR, exists, listBlogFiles, readField, readPost } from './lib/blog-files.mjs';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const applyOffTopic = args.has('--apply-offtopic');

const INJECTION_PATTERNS = [
  /document\s*\.\s*write\s*\(/i,
  /\beval\s*\(\s*atob\s*\(/i,
  /\bunescape\s*\(\s*["']%(?:3C|64)/i,
  /window\s*\.\s*location\s*(?:\.\s*(?:href|replace)\s*[=(]|\s*=)/i,
  /<meta[^>]+http-equiv=["']?refresh["']?[^>]*url=/i,
];

const CASINO_PATTERNS = [
  /(?:^|-)(?:online-)?casinos?(?:-|$)/i,
  /(?:^|-)(?:luxecasino|crypto-casino|casino-bonus|gokspellen|goksites|gokken)(?:-|$)/i,
  /\b(?:casino'?s?|online\s+casino|crypto\s+casino|luxecasino|gokken|free\s*spins)\b/i,
];

const SMM_PATTERNS = [
  /(?:^|-)(?:youtube-(?:views|abonnees)|instagram-volgers|snapchat-views|tiktok-(?:views|volgers)|live-kijkers-voor-tiktok)(?:-|$)/i,
  /(?:^|-)(?:koop(?:-je)?-(?:live-)?(?:volgers|kijkers|views|likes)|volgers-kopen|views-kopen)(?:-|$)/i,
  /\b(?:youtube[- ]?(?:views|abonnees)\s+kopen|instagram\s+volgers\s+(?:kopen|regelen)|snapchat[- ]?views\s+kopen|tiktok[- ]?(?:views|volgers|live\s+kijkers)\s+kopen)\b/i,
  /\b(?:het\s+kopen\s+van\s+youtube|hoe\s+koop\s+je\s+live\s+kijkers)\b/i,
];

const AFFILIATE_HOST_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:followfactory\.nl|likefabriek\.nl|socialvolgerskopen\.nl|volgersparadijs\.nl|likesgenerator\.nl|likeskopenanoniem\.nl|snellevolgers\.nl|99likes\.nl)\b/i;

const OFF_TOPIC_TITLE_PATTERNS = [
  /\bvriendin\b/i,
  /\bvriend van\b/i,
  /\bgetrouwd\b/i,
  /\brelatiestatus\b/i,
  /\bex-partner\b/i,
  /\bzwanger\b/i,
  /\b(?:vermogen|lengte|leeftijd) van\b/i,
];

function hardSpamReason(slug, title, body) {
  const haystack = `${slug}\n${title}\n${body}`;
  if (INJECTION_PATTERNS.some((p) => p.test(haystack))) {
    return 'injected script/redirect payload';
  }
  if (CASINO_PATTERNS.some((p) => p.test(`${slug}\n${title}`))) {
    return 'casino/gambling SEO spam';
  }
  if (SMM_PATTERNS.some((p) => p.test(`${slug}\n${title}`))) {
    return 'SMM buy-followers/views spam';
  }
  if (AFFILIATE_HOST_RE.test(body)) {
    return 'SMM/affiliate cloaking host in body';
  }
  return null;
}

if (!exists(BLOG_DIR)) {
  console.log(`[remove-spam-blog] no ${BLOG_DIR}/ — nothing to do`);
  process.exit(0);
}

const spam = [];
const offTopic = [];

for (const path of listBlogFiles()) {
  const post = readPost(path);
  const title = readField(post.frontmatter, 'title') ?? '';
  const reason = hardSpamReason(post.slug, title, post.body);

  if (reason) {
    spam.push({ path, title, reason });
    continue;
  }
  if (OFF_TOPIC_TITLE_PATTERNS.some((p) => p.test(`${post.slug.replace(/-/g, ' ')} ${title}`))) {
    offTopic.push({ path, title });
  }
}

/**
 * Mark, never delete. A build that removes source files can silently shrink the
 * blog and there is no way back from a deploy — so spam is flagged in
 * frontmatter (`draft: true`, `_spam:` reason) and the shared loader hides it.
 * The file stays on disk and stays in git.
 */
function markDraft(entry) {
  const raw = readFileSync(entry.path, 'utf8');
  if (/^_spam:/m.test(raw)) return false;
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return false;
  let fm = m[1].replace(/^draft:.*$/m, '').replace(/\n{2,}/g, '\n').trim();
  fm += `\ndraft: true\n_spam: ${JSON.stringify(entry.reason)}`;
  writeFileSync(entry.path, raw.replace(m[0], `---\n${fm}\n---`));
  return true;
}

for (const entry of spam) {
  if (dryRun) console.log(`[remove-spam-blog] would mark ${entry.path} (${entry.reason})`);
  else if (markDraft(entry)) console.log(`[remove-spam-blog] marked draft: ${entry.path} (${entry.reason})`);
}

if (offTopic.length > 0) {
  console.log(
    `[remove-spam-blog] ${offTopic.length} off-topic candidate(s) — review, then rerun with --apply-offtopic to mark as draft:`,
  );
  for (const entry of offTopic) console.log(`  · ${entry.path} — ${entry.title}`);
  if (applyOffTopic && !dryRun) {
    for (const entry of offTopic) {
      if (markDraft({ ...entry, reason: 'off-topic' })) {
        console.log(`[remove-spam-blog] marked draft: ${entry.path} (off-topic)`);
      }
    }
  }
}

console.log(
  `[remove-spam-blog] ${spam.length} hard spam, ${offTopic.length} off-topic candidate(s)${dryRun ? ' (dry run)' : ''}`,
);
