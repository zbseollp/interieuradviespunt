import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  draftField,
  imageField,
  looseDateField,
  looseStringField,
  statusField,
  stringListField,
} from './lib/blog-schema';

/**
 * Payload-synced posts: nothing in frontmatter is a hard drop besides a
 * missing --- block. Title/dates/images all have fallbacks, because a Zod
 * rejection here removes the post from the collection — it never comes online.
 */
const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z
    .object({
      title: looseStringField,
      description: looseStringField,
      excerpt: looseStringField,
      metaDescription: looseStringField,
      pubDate: looseDateField,
      date: looseDateField,
      updatedDate: looseDateField,
      author: looseStringField,
      categories: stringListField,
      tags: stringListField,
      featuredImage: imageField,
      heroImage: imageField,
      image: imageField,
      ogImage: imageField,
      featuredImageAlt: z.string().optional(),
      heroImageAlt: z.string().optional(),
      imageAlt: z.string().optional(),
      slug: looseStringField,
      permalink: looseStringField,
      legacySlug: looseStringField,
      seoTitle: looseStringField,
      draft: draftField,
      _status: statusField,
      publishStatus: statusField,
    })
    .passthrough()
    .transform((data) => ({
      ...data,
      title: data.title || data.seoTitle || 'Artikel',
      description: data.description || data.excerpt || data.metaDescription || '',
      pubDate: data.pubDate ?? data.date ?? new Date(0),
      // Uncategorized Payload posts still belong on /category/blog/.
      categories: data.categories?.length ? data.categories : ['Blog'],
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
