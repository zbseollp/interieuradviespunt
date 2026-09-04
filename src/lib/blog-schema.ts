/**
 * Shared frontmatter shapes for Payload-synced blog posts.
 *
 * Payload is loose about what it writes: images arrive as a plain path, an
 * absolute URL or a media object; draft can be a boolean or the string "true";
 * categories/tags sometimes come through as numbers (years). Anything Zod
 * rejects here drops the post from the collection entirely, so every one of
 * those shapes is accepted and normalised instead.
 */
import { z } from 'astro:content';

/**
 * Parse CMS dates without dropping the post.
 * Accepts ISO, `YYYY-MM-DD HH:mm:ss` (WordPress), and Date objects.
 */
export function parseLooseDate(value: unknown): Date | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (value instanceof Date) {
    return Number.isNaN(value.valueOf()) ? undefined : value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const d = new Date(value);
    return Number.isNaN(d.valueOf()) ? undefined : d;
  }
  const raw = String(value).trim();
  if (!raw) return undefined;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.valueOf())) return direct;

  // WordPress / MySQL: "2022-05-26 06:57:42" — treat as UTC-ish local parse
  const m = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  if (m) {
    const d = new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
      Number(m[6] || 0),
    );
    if (!Number.isNaN(d.valueOf())) return d;
  }

  const dateOnly = raw.match(/^(\d{4})[./-](\d{2})[./-](\d{2})$/);
  if (dateOnly) {
    const d = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
    if (!Number.isNaN(d.valueOf())) return d;
  }

  return undefined;
}

export const looseDateField = z.preprocess((value) => {
  const parsed = parseLooseDate(value);
  return parsed ?? undefined;
}, z.date().optional());

/** `/media/x.jpg`, `https://…`, or `{ url, filename, alt }`. */
export const imageField = z
  .union([
    z.string(),
    z
      .object({
        url: z.string().optional(),
        alt: z.string().optional(),
        filename: z.string().optional(),
        prefix: z.string().optional(),
      })
      .passthrough(),
  ])
  .optional();

/** Payload writes booleans, WordPress exports write "true"/"false". */
export const draftField = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((value) => value === true || value === 'true');

/** Present only on some tenants; anything but "published" is unpublished. */
export const statusField = z.string().optional();

/** Payload can emit years as numbers — coerce every entry to a string. */
export const stringListField = z
  .union([z.array(z.union([z.string(), z.number()])), z.string(), z.number()])
  .nullish()
  .transform((value) => {
    if (value === null || value === undefined) return [] as string[];
    const list = Array.isArray(value) ? value : [value];
    return list.map((item) => String(item).trim()).filter(Boolean);
  });
