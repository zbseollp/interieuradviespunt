#!/usr/bin/env node
/**
 * Refuse to deploy a build that would take live posts offline.
 *
 *   node scripts/guard-deploy.mjs            check, exit non-zero if unsafe
 *   node scripts/guard-deploy.mjs --json     machine-readable report
 *
 * These tenants publish through Payload straight to the live site, and that
 * content does not always land back in git. `wrangler deploy` replaces the
 * whole site with ./dist, so any live URL the build does not contain becomes a
 * 404 — permanently, since the source only ever existed on the live site.
 * (That is exactly how 34 posts were lost on 2026-09-03.)
 *
 * This crawls the live blog listing, compares it against dist/, and fails when
 * the deploy would drop anything. Wire it in front of every deploy:
 *
 *   "deploy": "npm run build && node scripts/guard-deploy.mjs && wrangler deploy"
 *
 * Override deliberately with ALLOW_CONTENT_LOSS=1 once the missing posts have
 * been exported or re-imported — never as a reflex to get a deploy through.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { isCmsTestSlug } from './lib/cms-test-slug.mjs';
import { crawlLiveListingHtml, extractLiveArticlePaths, siteOrigin } from './lib/live-site.mjs';

const asJson = process.argv.includes('--json');
const allowLoss = process.env.ALLOW_CONTENT_LOSS === '1';

/**
 * Intentional drops: `.allow-url-drop`, CMS smoke-test slugs, and malware
 * takedowns still on disk as `draft: true` + `_spam:`.
 */
function allowUrlDropSet() {
  const file = '.allow-url-drop';
  if (!existsSync(file)) return new Set();
  return new Set(
    readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => (l.startsWith('/') ? l : `/${l}`))
      .map((l) => (l.endsWith('/') ? l : `${l}/`)),
  );
}

const ALLOW_DROPS = allowUrlDropSet();

function isIntentionalDrop(urlPath) {
  const normalized = urlPath.endsWith('/') ? urlPath : `${urlPath}/`;
  if (ALLOW_DROPS.has(normalized)) return true;
  if (isCmsTestSlug(normalized)) return true;

  const slug = urlPath.replace(/^\/+|\/+$/g, '').split('/').pop();
  if (!slug) return false;
  for (const ext of ['.mdx', '.md']) {
    const file = join('src/content/blog', `${slug}${ext}`);
    if (!existsSync(file)) continue;
    const raw = readFileSync(file, 'utf8');
    return /^draft:\s*true\b/m.test(raw) && /^_spam:/m.test(raw);
  }
  return false;
}

/** Every route dist/ actually generated. */
function builtRoutes(dir = 'dist', base = '') {
  const out = new Set();
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      for (const r of builtRoutes(join(dir, e.name), `${base}/${e.name}`)) out.add(r);
    } else if (e.name === 'index.html') {
      out.add(base === '' ? '/' : `${base}/`);
    }
  }
  return out;
}

const origin = siteOrigin();
if (!origin) {
  console.log('[guard-deploy] no `site` in astro.config — cannot compare against live, skipping');
  process.exit(0);
}

const built = builtRoutes();
if (built.size === 0) {
  console.error('[guard-deploy] dist/ is empty — build before deploying');
  process.exit(1);
}

const { html, pages } = await crawlLiveListingHtml(origin);
if (!html) {
  console.error(`[guard-deploy] could not reach ${origin} — refusing to deploy blind`);
  process.exit(1);
}

const liveLinks = extractLiveArticlePaths(html);

// A link on the listing is not proof the page exists — these sites carry dead
// internal links (…/instagram-likes-kopen/ and friends already 404). Only a URL
// that actually resolves can be lost by deploying, so confirm before blocking.
const candidates = [...liveLinks].filter((u) => !built.has(u)).sort();
const missing = [];
const alreadyDead = [];
const intentional = [];
for (const u of candidates) {
  if (isIntentionalDrop(u)) {
    intentional.push(u);
    continue;
  }
  let ok = false;
  try {
    const res = await fetch(origin + u, { redirect: 'follow', signal: AbortSignal.timeout(20000) });
    ok = res.ok;
  } catch {
    ok = false; // unreachable → treat as dead rather than blocking the deploy
  }
  (ok ? missing : alreadyDead).push(u);
}
if (intentional.length > 0) {
  console.log(
    `[guard-deploy] allowing ${intentional.length} intentional drop(s): ` +
      intentional.slice(0, 5).join(', ') +
      (intentional.length > 5 ? ' …' : ''),
  );
}
if (alreadyDead.length > 0) {
  console.log(
    `[guard-deploy] ignoring ${alreadyDead.length} listing link(s) that already 404 live: ` +
      alreadyDead.slice(0, 5).join(', ') +
      (alreadyDead.length > 5 ? ' …' : ''),
  );
}

if (asJson) {
  console.log(
    JSON.stringify(
      { origin, listing: pages, live: liveLinks.size, built: built.size, missing },
      null,
      2,
    ),
  );
}

if (missing.length === 0) {
  console.log(`[guard-deploy] OK — all ${liveLinks.size} live URL(s) exist in dist/ (${built.size} routes)`);
  process.exit(0);
}

console.error(`\n[guard-deploy] ${missing.length} live URL(s) are NOT in this build:`);
for (const u of missing.slice(0, 40)) console.error(`  · ${origin}${u}`);
if (missing.length > 40) console.error(`  … and ${missing.length - 40} more`);

if (allowLoss) {
  console.error('\nALLOW_CONTENT_LOSS=1 set — deploying anyway. Make sure these are exported.\n');
  process.exit(0);
}
console.error(
  '\nDeploying would 404 these pages and the content exists nowhere else.\n' +
    'Sync them into src/content/blog first, or export them and re-run with\n' +
    'ALLOW_CONTENT_LOSS=1 if the loss is intentional.\n',
);
process.exit(1);
