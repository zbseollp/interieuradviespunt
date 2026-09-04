#!/usr/bin/env node
/**
 * Fail the build early on frontmatter that would drop a post from the
 * collection (missing title) instead of letting Astro report it as an opaque
 * schema error mid-build.
 *
 * Odd / missing dates are warnings only — looseDateField + a Date(0) fallback
 * keep those posts in the build so they still come online.
 *
 * Skip draft spam (_spam) for soft warnings — they never ship live.
 */
import { BLOG_DIR, exists, listBlogFiles, readField, readPost } from './lib/blog-files.mjs';

if (!exists(BLOG_DIR)) {
  console.log(`[validate-blog] no ${BLOG_DIR}/ — nothing to validate`);
  process.exit(0);
}

const errors = [];
const warnings = [];
const files = listBlogFiles();

for (const path of files) {
  const post = readPost(path);
  if (!post.hasFrontmatter) {
    errors.push(`${path}: no frontmatter block`);
    continue;
  }

  const title = readField(post.frontmatter, 'title');
  if (!title || title === '|' || title === '>') {
    errors.push(`${path}: missing title`);
  }

  const isSpamDraft =
    /^draft:\s*true\b/m.test(post.frontmatter) && /^_spam:/m.test(post.frontmatter);

  const rawDate = readField(post.frontmatter, 'pubDate') ?? readField(post.frontmatter, 'date');
  if (!rawDate) {
    if (!isSpamDraft) warnings.push(`${path}: missing pubDate/date (will fall back)`);
  } else if (rawDate !== '|' && rawDate !== '>' && Number.isNaN(new Date(rawDate).valueOf())) {
    const looseOk = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(rawDate);
    if (!looseOk && !isSpamDraft) {
      warnings.push(`${path}: odd date "${rawDate}" (will try loose parse)`);
    }
  }

  const description =
    readField(post.frontmatter, 'description') ??
    readField(post.frontmatter, 'excerpt') ??
    readField(post.frontmatter, 'metaDescription');
  if (!description && !isSpamDraft) warnings.push(`${path}: no description/excerpt`);

  if (!post.body.trim() && !isSpamDraft) warnings.push(`${path}: empty body`);
}

for (const warning of warnings) console.warn(`[validate-blog] warn  ${warning}`);
for (const error of errors) console.error(`[validate-blog] ERROR ${error}`);

if (errors.length > 0) {
  console.error(`[validate-blog] ${errors.length} error(s) across ${files.length} post(s)`);
  process.exit(1);
}
console.log(`[validate-blog] ${files.length} post(s) OK (${warnings.length} warning(s))`);
