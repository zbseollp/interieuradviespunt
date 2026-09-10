/**
 * Throwaway CMS smoke tests (title "test", slug "test-test") must not
 * resurrect via live restore or fail a production deploy.
 *
 * Matches `test`, `test-test`, `asdf-1` — not real articles whose slug
 * merely contains the word "test" later on.
 */
export function isCmsTestSlug(slugOrPath) {
  const slug = String(slugOrPath || '')
    .replace(/^\/+|\/+$/g, '')
    .split('/')
    .pop();
  if (!slug) return false;
  return /^(?:test|asdf|lorem|foobar|foo-bar)(?:-[a-z0-9]+)?$/i.test(slug);
}
