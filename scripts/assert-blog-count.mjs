#!/usr/bin/env node
/**
 * Fail the build if the blog folder shrank — or fell below the committed floor.
 *
 *   node scripts/assert-blog-count.mjs --snapshot   before prepare:blog
 *   node scripts/assert-blog-count.mjs --verify     after prepare:blog
 *
 * A build that quietly removes source files is unrecoverable once deployed, so
 * the count is a hard gate rather than a warning. Growth is fine; any drop
 * stops the build and names the missing files.
 *
 * `.blog-count-floor` (committed integer) catches a Payload clean-sync that
 * wiped most of the catalog before prepare:blog even runs. Lower it only when
 * an intentional content reduction has been reviewed.
 */
import { readdirSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BLOG = 'src/content/blog';
const STAMP = join('node_modules', '.cache', 'blog-count.json');
const FLOOR_FILE = '.blog-count-floor';
const mode = process.argv.includes('--verify') ? 'verify' : 'snapshot';

if (!existsSync(BLOG)) {
  console.log(`[assert-blog-count] no ${BLOG}/ — nothing to guard`);
  process.exit(0);
}

const files = readdirSync(BLOG).filter((f) => /\.mdx?$/.test(f)).sort();

function readFloor() {
  if (!existsSync(FLOOR_FILE)) return 0;
  const n = Number(String(readFileSync(FLOOR_FILE, 'utf8')).trim());
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

const floor = readFloor();
if (floor > 0 && files.length < floor) {
  console.error(
    `\n[assert-blog-count] BUILD ABORTED — only ${files.length} blog file(s) on disk, ` +
      `below floor ${floor} (from ${FLOOR_FILE}).\n` +
      `Payload clean sync may have wiped posts that never came back. Fix the CMS ` +
      `catalog or lower the floor deliberately after review.\n`,
  );
  process.exit(1);
}

if (mode === 'snapshot') {
  mkdirSync(join('node_modules', '.cache'), { recursive: true });
  writeFileSync(STAMP, JSON.stringify({ count: files.length, files }));
  console.log(
    `[assert-blog-count] ${files.length} file(s) on disk before prepare:blog` +
      (floor > 0 ? ` (floor ${floor})` : ''),
  );
  process.exit(0);
}

if (!existsSync(STAMP)) {
  console.log('[assert-blog-count] no snapshot to compare against — skipping');
  process.exit(0);
}

const before = JSON.parse(readFileSync(STAMP, 'utf8'));
const now = new Set(files);
const missing = before.files.filter((f) => !now.has(f));

if (missing.length > 0) {
  console.error(
    `\n[assert-blog-count] BUILD ABORTED — ${missing.length} blog file(s) disappeared ` +
      `during prepare:blog (${before.count} → ${files.length}).`,
  );
  for (const f of missing.slice(0, 20)) console.error(`  · ${f}`);
  if (missing.length > 20) console.error(`  … and ${missing.length - 20} more`);
  console.error('Posts are hidden by filtering in the loader, never by removing files.\n');
  process.exit(1);
}

console.log(
  `[assert-blog-count] ${files.length} file(s) on disk after prepare:blog — none lost` +
    (files.length > before.count ? ` (+${files.length - before.count})` : ''),
);
