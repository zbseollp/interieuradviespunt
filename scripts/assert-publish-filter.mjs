#!/usr/bin/env node
/**
 * Refuse leftover-Payload draft-only listing filters.
 * Cryptoclan / geldkwesties regression: filtering `draft !== true` alone made
 * articles disappear and reappear between deploys.
 */
import { readFileSync } from 'node:fs';

const targets = ['src/lib/blog.ts', 'src/lib/posts.ts', 'src/content.config.ts'];
const banned = [
  /getCollection\(\s*['"]blog['"]\s*,\s*\(?\s*\{\s*data\s*\}\s*\)?\s*=>\s*!?\s*data\.draft/,
  /\.filter\(\s*\(?\s*(?:post|entry|p|e)?\.?data\.draft\s*\)?\s*=>/,
  /if\s*\(\s*(?:data|post\.data|entry\.data)\.draft\s*\)\s*return\s+false/,
  /draft\s*!==\s*true/,
  /!data\.draft/,
];

let failed = false;
for (const file of targets) {
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const pattern of banned) {
    if (pattern.test(raw)) {
      console.error(
        `[assert-publish-filter] BUILD ABORTED — ${file} still filters listings on leftover draft.\n` +
          `Use publishStatus/_status/_spam stubs instead (see tenant-blog-listings rule).\n` +
          `Matched: ${pattern}`,
      );
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('[assert-publish-filter] ok — no draft-only listing filter');
