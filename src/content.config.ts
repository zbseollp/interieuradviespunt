import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  draftField,
  imageField,
  looseDateField,
  statusField,
  stringListField,
} from './lib/blog-schema';

/**
 * Payload-synced posts: title is the only hard requirement. Everything else
 * has a fallback, because a Zod rejection here drops the post from the
 * collection entirely — the article simply never comes online.
 */
const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z
    .object({
      title: z.string(),
      description: z.string().optional(),
      excerpt: z.string().optional(),
      metaDescription: z.string().optional(),
      pubDate: looseDateField,
      date: looseDateField,
      updatedDate: looseDateField,
      author: z.string().optional(),
      categories: stringListField,
      tags: stringListField,
      featuredImage: imageField,
      heroImage: imageField,
      image: imageField,
      ogImage: imageField,
      featuredImageAlt: z.string().optional(),
      heroImageAlt: z.string().optional(),
      imageAlt: z.string().optional(),
      slug: z.string().optional(),
      permalink: z.string().optional(),
      legacySlug: z.string().optional(),
      seoTitle: z.string().optional(),
      draft: draftField,
      _status: statusField,
      publishStatus: statusField,
    })
    .passthrough()
    .transform((data) => ({
      ...data,
      description: data.description || data.excerpt || data.metaDescription || '',
      pubDate: data.pubDate ?? data.date ?? new Date(0),
    })),
});

const pages = defineCollection({
  loader: glob({
    base: './src/content/pages',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date().optional(),
    updatedDate: z.coerce.date().optional(),
    featuredImage: z.string().optional(),
    pageType: z.enum(['product']).optional(),
    updatedLabel: z.string().optional(),
    publishedLabel: z.string().optional(),
  }),
});

export const collections = { blog, pages };
