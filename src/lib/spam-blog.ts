/**
 * Shared spam detector for synced blog content.
 *
 * Two tiers, deliberately separated:
 *
 * - isSpamBlogPost()      hard signals — page-hijack payloads, casino SEO,
 *                         and SMM/affiliate "buy followers/views" spam.
 *                         Safe to filter / draft automatically.
 * - isOffTopicBlogPost()  soft signal — celebrity/gossip filler. Reported by
 *                         scripts/remove-spam-blog.mjs for review; never
 *                         auto-deleted (editorial call).
 *
 * Deliberately NOT spam signals:
 *  - <iframe> and <script src=...> embeds (YouTube, social widgets).
 *  - Images on a third-party CDN.
 */

/** Payloads that hijack the page and must never reach the built HTML. */
const INJECTION_PATTERNS: RegExp[] = [
  /document\s*\.\s*write\s*\(/i,
  /\beval\s*\(\s*atob\s*\(/i,
  /\bunescape\s*\(\s*["']%(?:3C|64)/i,
  /window\s*\.\s*location\s*(?:\.\s*(?:href|replace)\s*[=(]|\s*=)/i,
  /<meta[^>]+http-equiv=["']?refresh["']?[^>]*url=/i,
];

/** Casino / gambling SEO spam (slug or title). */
const CASINO_PATTERNS: RegExp[] = [
  /(?:^|-)(?:online-)?casinos?(?:-|$)/i,
  /(?:^|-)(?:luxecasino|crypto-casino|casino-bonus|gokspellen|goksites|gokken)(?:-|$)/i,
  /\b(?:casino'?s?|online\s+casino|crypto\s+casino|luxecasino|gokken|free\s*spins)\b/i,
];

/** Buy-followers / views / streams SMM spam (slug or title). */
const SMM_PATTERNS: RegExp[] = [
  /(?:^|-)(?:youtube-(?:views|abonnees)|instagram-volgers|snapchat-views|tiktok-(?:views|volgers)|live-kijkers-voor-tiktok)(?:-|$)/i,
  /(?:^|-)(?:koop(?:-je)?-(?:live-)?(?:volgers|kijkers|views|likes)|volgers-kopen|views-kopen)(?:-|$)/i,
  /\b(?:youtube[- ]?(?:views|abonnees)\s+kopen|instagram\s+volgers\s+(?:kopen|regelen)|snapchat[- ]?views\s+kopen|tiktok[- ]?(?:views|volgers|live\s+kijkers)\s+kopen)\b/i,
  /\b(?:het\s+kopen\s+van\s+youtube|hoe\s+koop\s+je\s+live\s+kijkers)\b/i,
];

/** Known Dutch SMM/affiliate cloaking hosts — body match = hard spam. */
const AFFILIATE_HOST_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:followfactory\.nl|likefabriek\.nl|socialvolgerskopen\.nl|volgersparadijs\.nl|likesgenerator\.nl|likeskopenanoniem\.nl|snellevolgers\.nl|99likes\.nl)\b/i;

/** Gossip-filler title shapes (Dutch), used for reporting only. */
const OFF_TOPIC_TITLE_PATTERNS: RegExp[] = [
  /\bvriendin\b/i,
  /\bvriend van\b/i,
  /\bgetrouwd\b/i,
  /\brelatiestatus\b/i,
  /\bex-partner\b/i,
  /\bzwanger\b/i,
  /\b(?:vermogen|lengte|leeftijd) van\b/i,
];

export function hasInjectedPayload(body: string): boolean {
  return INJECTION_PATTERNS.some((pattern) => pattern.test(body));
}

function hasCasinoSpam(haystack: string): boolean {
  return CASINO_PATTERNS.some((pattern) => pattern.test(haystack));
}

function hasSmmSpam(haystack: string): boolean {
  return SMM_PATTERNS.some((pattern) => pattern.test(haystack));
}

function hasAffiliateHost(body: string): boolean {
  return AFFILIATE_HOST_RE.test(body);
}

/**
 * Hard spam — filtered out of every listing and route.
 * Checks slug, title and body so title-only spam is caught too.
 */
export function isSpamBlogPost(id: string, body = '', title = ''): boolean {
  const haystack = `${id}\n${title}\n${body}`;
  if (hasInjectedPayload(haystack)) return true;
  if (hasCasinoSpam(`${id}\n${title}`)) return true;
  if (hasSmmSpam(`${id}\n${title}`)) return true;
  if (hasAffiliateHost(body)) return true;
  return false;
}

/** Soft signal — off-topic gossip filler. Reported, never auto-removed. */
export function isOffTopicBlogPost(id: string, title = ''): boolean {
  const haystack = `${id.replace(/-/g, ' ')} ${title}`;
  return OFF_TOPIC_TITLE_PATTERNS.some((pattern) => pattern.test(haystack));
}

export const SPAM_INJECTION_PATTERNS = INJECTION_PATTERNS;
