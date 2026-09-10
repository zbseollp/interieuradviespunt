/**
 * Shared live-site crawl used by restore-live-blog and guard-deploy so both
 * see the same listing URLs.
 */
import { readFileSync, existsSync } from 'node:fs';

/** Blog indexes only — never the homepage (thousands of product URLs). */
export const BLOG_LISTING_CANDIDATES = [
  '/blog/',
  '/blogs/',
  '/category/blog/',
  '/artikelen/',
  '/laatste-berichten/',
  '/laatste-blogs/',
];

export const LISTING_CANDIDATES = [...BLOG_LISTING_CANDIDATES, '/'];

export function siteOrigin() {
  for (const f of ['astro.config.mjs', 'astro.config.ts']) {
    if (!existsSync(f)) continue;
    const m = readFileSync(f, 'utf8').match(/site:\s*['"](https?:\/\/[^'"]+)['"]/);
    if (m) return m[1].replace(/\/+$/, '');
  }
  return null;
}

export async function fetchText(url) {
  try {
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(25000) });
    return res.ok ? await res.text() : '';
  } catch {
    return '';
  }
}

function paginationHrefs(html) {
  const out = new Set();
  for (const re of [
    /href="(?:https?:\/\/[^/]+)?(\/[a-z0-9-]*\/(?:\d+)\/)"/gi,
    /href="(?:https?:\/\/[^/]+)?(\/(?:blog|blogs|category\/blog|artikelen)\/(?:\d+)\/)"/gi,
  ]) {
    for (const m of html.matchAll(re)) out.add(m[1]);
  }
  return out;
}

/**
 * Fetch every listing candidate (and their pagination) and concatenate HTML.
 * Union, not "longest page wins" — the homepage is huge and would otherwise
 * hide blog-only URLs, or vice versa.
 */
export async function crawlLiveListingHtml(origin, candidates = LISTING_CANDIDATES) {
  const pages = new Set();
  const bodies = [];

  for (const p of candidates) {
    const html = await fetchText(origin + p);
    if (!html) continue;
    pages.add(p);
    bodies.push(html);
    for (const href of paginationHrefs(html)) {
      if (pages.size < 40) pages.add(href);
    }
  }

  for (const p of pages) {
    if (candidates.includes(p)) continue;
    const html = await fetchText(origin + p);
    if (html) bodies.push(html);
  }

  return { pages: [...pages], html: bodies.join('\n') };
}

/** Single-segment article paths the listing regex can see (7+ char slugs). */
export function extractLiveArticlePaths(html) {
  const liveLinks = new Set();
  for (const m of html.matchAll(/href="(?:https?:\/\/[^/]+)?(\/[a-z0-9][a-z0-9-]{6,}\/)"/gi)) {
    liveLinks.add(m[1]);
  }
  return liveLinks;
}
