import type { APIRoute } from 'astro';
import { getBlogPosts, postHref } from '../lib/blog';

const SITE = 'https://interieuradviespunt.nl';

/** Built at deploy time from the same getBlogPosts() the pages use. */
export const GET: APIRoute = async () => {
  const posts = await getBlogPosts();
  const paths = new Set(['/', '/blog/', '/category/blog/', '/contact/']);
  for (const post of posts) paths.add(postHref(post));

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...paths].map(
      (p) => `  <url><loc>${SITE}${p}</loc><changefreq>weekly</changefreq></url>`,
    ),
    '</urlset>',
    '',
  ].join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
