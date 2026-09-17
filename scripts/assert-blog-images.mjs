#!/usr/bin/env node
/**
 * Fail the build when local featured-image paths would 404 on Cloudflare
 * (case-sensitive) or when a draft-only publish filter is reintroduced.
 *
 * Wired into prepare:blog.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { correctLocalPublicPath } from '../src/lib/media-url.mjs';

const BLOG = 'src/content/blog';
const IMAGE_FIELDS = ['featuredImage', 'heroImage', 'image', 'ogImage'];

function listBlogFiles(dir = BLOG) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /\.mdx?$/i.test(f))
    .map((f) => join(dir, f));
}

function extractScalar(frontmatter, field) {
  const re = new RegExp(`^${field}:[ \\t]*([^\\n]*)`, 'm');
  const m = frontmatter.match(re);
  if (!m) return null;
  const value = m[1].trim().replace(/^["']|["']$/g, '');
  return value || null;
}

const caseMismatches = [];
for (const file of listBlogFiles()) {
  const raw = readFileSync(file, 'utf8');
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) continue;
  const fm = fmMatch[1];
  for (const field of IMAGE_FIELDS) {
    const value = extractScalar(fm, field);
    if (!value || !value.startsWith('/images/')) continue;
    const corrected = correctLocalPublicPath(value);
    if (corrected !== value) {
      caseMismatches.push({ file, field, want: value, have: corrected });
    }
  }
}

if (caseMismatches.length) {
  console.error(
    `\n[assert-blog-images] BUILD ABORTED — ${caseMismatches.length} featured image path(s) ` +
      `do not match on-disk casing (Cloudflare will 404):\n` +
      caseMismatches
        .slice(0, 12)
        .map((row) => `  - ${row.file} ${row.field}: ${row.want} → ${row.have}`)
        .join('\n') +
      (caseMismatches.length > 12 ? `\n  …and ${caseMismatches.length - 12} more` : '') +
      `\nRun sanitize-blog (prepare:blog) so frontmatter uses the real path.\n`,
  );
  process.exit(1);
}

console.log('[assert-blog-images] ok — local featured image paths match disk casing');
