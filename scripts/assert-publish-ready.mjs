#!/usr/bin/env node
/**
 * Hard gates so "articles do not come online" cannot silently return.
 *
 * Fails the build when:
 *   - githubRepo is not the zbseollp client repo (wrong-repo sync/deploy)
 *   - wrangler config contains custom-domain `routes` (Jenkins-breaking mistake)
 *   - blog file / published floors are missing or breached
 *   - every live (non-draft, not far-future) post is missing from dist/ after build
 *
 * Wired into `npm run build` (Jenkins runs build, then wrangler — never `npm run deploy`).
 *
 *   node scripts/assert-publish-ready.mjs           pre-build config checks
 *   node scripts/assert-publish-ready.mjs --dist    post-build route checks
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const EXPECTED_REPO = 'zbseollp/interieuradviespunt';
const BLOG = 'src/content/blog';
const FLOOR_FILE = '.blog-count-floor';
const PUBLISHED_FLOOR_FILE = '.blog-published-floor';
/** Must match src/lib/blog.ts FUTURE_SLACK_MS */
const FUTURE_SLACK_MS = 48 * 60 * 60 * 1000;
const distMode = process.argv.includes('--dist');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readFloor(path) {
  if (!existsSync(path)) return null;
  const n = Number.parseInt(readFileSync(path, 'utf8').trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function wranglerFiles() {
  return ['wrangler.json', 'wrangler.jsonc', 'wrangler.toml'].filter((f) => existsSync(f));
}

function assertNoWranglerRoutes() {
  for (const file of wranglerFiles()) {
    const raw = readFileSync(file, 'utf8');
    if (/"routes"\s*:/.test(raw) || /^\s*routes\s*=/m.test(raw)) {
      console.error(
        `\n[assert-publish-ready] BUILD ABORTED — ${file} contains custom-domain routes.\n` +
          `Domains stay in the Cloudflare dashboard only; routes in wrangler break Jenkins.\n`,
      );
      process.exit(1);
    }
  }
}

function assertGithubRepo() {
  if (!existsSync('astropayload.config.json')) {
    console.error('[assert-publish-ready] missing astropayload.config.json');
    process.exit(1);
  }
  const cfg = readJson('astropayload.config.json');
  const repo = String(cfg.githubRepo || '').trim();
  if (repo !== EXPECTED_REPO) {
    console.error(
      `\n[assert-publish-ready] BUILD ABORTED — githubRepo is ${JSON.stringify(repo) || '(missing)'}, ` +
        `expected ${JSON.stringify(EXPECTED_REPO)}.\n` +
        `Wrong-repo config is how Payload publishes never land on the live site.\n` +
        `Also set the same value on the Tenant in Payload Admin.\n`,
    );
    process.exit(1);
  }
}

function assertFloorPresent() {
  if (!existsSync(FLOOR_FILE)) {
    console.error(
      `\n[assert-publish-ready] BUILD ABORTED — missing ${FLOOR_FILE}.\n` +
        `Without a floor, a Payload clean sync can wipe the blog and still deploy.\n`,
    );
    process.exit(1);
  }
  if (!existsSync(PUBLISHED_FLOOR_FILE)) {
    console.error(
      `\n[assert-publish-ready] BUILD ABORTED — missing ${PUBLISHED_FLOOR_FILE}.\n` +
        `Without a published floor, spam-drafting or a bad sync can ship an empty blog.\n`,
    );
    process.exit(1);
  }
}

/** Loose CMS dates — same shapes as src/lib/blog-schema.ts parseLooseDate. */
function parseLooseDate(raw) {
  if (!raw || raw === '|' || raw === '>') return null;
  const direct = Date.parse(raw);
  if (!Number.isNaN(direct)) return direct;
  const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    return new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
      Number(m[6] || 0),
    ).valueOf();
  }
  return null;
}

function readField(frontmatter, field) {
  const match = frontmatter.match(new RegExp(`^${field}:\\s*(.*)$`, 'm'));
  if (!match) return null;
  return match[1].trim().replace(/^["']|["']$/g, '') || null;
}

/**
 * Slugs that getBlogPosts / getStaticPaths will publish — draft out, far-future out.
 * Missing dates count as live (schema falls back to epoch).
 */
function liveSlugs() {
  if (!existsSync(BLOG)) return [];
  const now = Date.now();
  const out = [];
  for (const name of readdirSync(BLOG)) {
    if (!/\.mdx?$/.test(name)) continue;
    const raw = readFileSync(join(BLOG, name), 'utf8');
    if (/^draft:\s*true\b/m.test(raw)) continue;
    if (/^_spam:/m.test(raw)) continue;
    const publishStatus = raw.match(/^publishStatus:\s*["']?(\w+)/m)?.[1];
    const wpStatus = raw.match(/^_status:\s*["']?(\w+)/m)?.[1];
    const status = publishStatus || wpStatus || 'published';
    if (!/^publish/i.test(status)) continue;

    const fm = (raw.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || '';
    const dateRaw = readField(fm, 'pubDate') ?? readField(fm, 'date');
    const t = dateRaw ? parseLooseDate(dateRaw) : 0;
    if (t !== null && t > now + FUTURE_SLACK_MS) continue;

    out.push(name.replace(/\.mdx?$/, ''));
  }
  return out.sort();
}

function assertPublishedFloor() {
  const floor = readFloor(PUBLISHED_FLOOR_FILE);
  const slugs = liveSlugs();
  if (floor !== null && slugs.length < floor) {
    console.error(
      `\n[assert-publish-ready] BUILD ABORTED — only ${slugs.length} live post(s), ` +
        `below published floor ${floor}.\n` +
        `Articles would barely show (or not at all). Restore content or lower ` +
        `${PUBLISHED_FLOOR_FILE} only after a reviewed cut.\n`,
    );
    process.exit(1);
  }
  console.log(
    `[assert-publish-ready] ${slugs.length} live post(s)` +
      (floor !== null ? ` (floor ${floor})` : ''),
  );
}

function assertDistHasPublishedPosts() {
  if (!existsSync('dist')) {
    console.error('[assert-publish-ready] dist/ missing — run astro build first');
    process.exit(1);
  }
  const slugs = liveSlugs();
  if (slugs.length === 0) {
    console.error('\n[assert-publish-ready] BUILD ABORTED — no live blog posts on disk.\n');
    process.exit(1);
  }
  const missing = slugs.filter((slug) => !existsSync(join('dist', slug, 'index.html')));
  if (missing.length > 0) {
    console.error(
      `\n[assert-publish-ready] BUILD ABORTED — ${missing.length} live post(s) missing from dist/:\n`,
    );
    for (const slug of missing.slice(0, 30)) console.error(`  · /${slug}/`);
    if (missing.length > 30) console.error(`  · and ${missing.length - 30} more`);
    console.error(
      '\nThese articles would not come online. Fix getStaticPaths / schema / draft filters before deploy.\n',
    );
    process.exit(1);
  }
  console.log(
    `[assert-publish-ready] dist OK — ${slugs.length} live post(s) have routes`,
  );
}

assertNoWranglerRoutes();
assertGithubRepo();
assertFloorPresent();
assertPublishedFloor();

if (distMode) {
  assertDistHasPublishedPosts();
} else {
  console.log(
    `[assert-publish-ready] OK — repo ${EXPECTED_REPO}, no wrangler routes, floors present`,
  );
}
