#!/usr/bin/env node
/**
 * After Payload clean sync, restore tracked blog files that were wiped because
 * they are not (yet) in the CMS. Without this, git-only posts 404 on the next
 * deploy and guard-deploy aborts — "articles do not come online" in reverse.
 *
 * Payload-written files are left alone. Only paths that exist in HEAD but are
 * missing on disk are checked out again.
 *
 *   node scripts/restore-git-blog.mjs
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { BLOG_DIR } from './lib/blog-files.mjs';

if (!existsSync(BLOG_DIR)) {
  console.log(`[restore-git-blog] no ${BLOG_DIR}/ — nothing to restore`);
  process.exit(0);
}

if (!existsSync('.git')) {
  console.log('[restore-git-blog] not a git checkout — skipping');
  process.exit(0);
}

const listed = spawnSync('git', ['ls-files', '--', BLOG_DIR], { encoding: 'utf8' });
if (listed.status !== 0) {
  console.log('[restore-git-blog] git ls-files failed — skipping');
  process.exit(0);
}

const missing = (listed.stdout || '')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line && /\.mdx?$/i.test(line) && !existsSync(line));

if (missing.length === 0) {
  console.log('[restore-git-blog] all tracked blog files present on disk');
  process.exit(0);
}

const restored = spawnSync('git', ['checkout', 'HEAD', '--', ...missing], {
  encoding: 'utf8',
});
if (restored.status !== 0) {
  console.error('[restore-git-blog] failed to restore missing blog files');
  console.error(restored.stderr || restored.stdout || 'git checkout failed');
  process.exit(1);
}

console.log(
  `[restore-git-blog] restored ${missing.length} git-only blog file(s) wiped by clean sync:`,
);
for (const f of missing.slice(0, 20)) console.log(`  · ${f}`);
if (missing.length > 20) console.log(`  … and ${missing.length - 20} more`);
