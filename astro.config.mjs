// @ts-check
import { defineConfig } from 'astro/config';
import rehypeRepairMediaUrls from './src/lib/rehype-repair-media-urls.mjs';
import mdx from '@astrojs/mdx';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default defineConfig({
  site: 'https://interieuradviespunt.nl',
  trailingSlash: 'always',
  compressHTML: true,
  integrations: [mdx()],
  // Rewrites /media/... and bare-R2 <img> sources in post bodies to the
  // tenant's public R2 URL.
  markdown: { rehypePlugins: [rehypeRepairMediaUrls] },
  vite: { envPrefix: ['PUBLIC_', 'R2_', 'TENANT', 'PAYLOAD_'] },
});
