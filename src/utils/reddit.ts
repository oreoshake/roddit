import type {Post} from '../types';

/**
 * Builds the Reddit OAuth authorization URL.
 */
export function buildOAuthUrl(
  clientId: string,
  redirectUri: string,
  scopes: string[],
  state?: string,
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    state: state ?? generateState(),
    redirect_uri: redirectUri,
    duration: 'permanent',
    scope: scopes.join(' '),
  });

  return `https://www.reddit.com/api/v1/authorize.compact?${params.toString()}`;
}

/**
 * Generates a random state string for OAuth CSRF protection.
 */
export function generateState(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Parses the OAuth callback URL and extracts code and state.
 * Returns null if the URL doesn't contain valid OAuth parameters or if
 * the user denied access (error param present).
 */
export function parseCallbackUrl(
  url: string,
): {code: string; state: string} | null {
  try {
    const parsed = new URL(url);
    const error = parsed.searchParams.get('error');
    if (error) {
      return null;
    }
    const code = parsed.searchParams.get('code');
    const state = parsed.searchParams.get('state');
    if (!code || !state) {
      return null;
    }
    return {code, state};
  } catch {
    return null;
  }
}

/**
 * Returns a usable thumbnail URL from a post, or null if none is available.
 * Handles HTML-encoded URLs that Reddit sometimes returns.
 */
export function getPostThumbnail(post: Post): string | null {
  // Prefer preview image (higher quality) if available
  if (post.preview?.images?.[0]) {
    const image = post.preview.images[0];
    // Pick a medium-size resolution if available
    const resolutions = image.resolutions;
    if (resolutions && resolutions.length > 0) {
      // Find a resolution around 320px wide
      const medium =
        resolutions.find(r => r.width >= 320) ?? resolutions[resolutions.length - 1];
      // Reddit HTML-encodes preview URLs
      return decodeHtmlEntities(medium.url);
    }
    return decodeHtmlEntities(image.source.url);
  }

  // Fall back to thumbnail
  if (post.thumbnail) {
    return post.thumbnail;
  }

  return null;
}

/**
 * Decodes HTML entities in a URL string (Reddit encodes & as &amp; etc.)
 */
export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Returns the full Reddit URL for a post's permalink.
 */
export function getPostUrl(permalink: string): string {
  return `https://www.reddit.com${permalink}`;
}

/**
 * Determines if a post contains an image that can be displayed inline.
 */
export function isImagePost(post: Post): boolean {
  if (post.post_hint === 'image') {
    return true;
  }
  if (post.url) {
    const lower = post.url.toLowerCase();
    return (
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.gif') ||
      lower.endsWith('.webp')
    );
  }
  return false;
}

/**
 * Determines if a post contains a video that can be displayed inline.
 */
export function isVideoPost(post: Post): boolean {
  return (
    post.post_hint === 'hosted:video' ||
    post.post_hint === 'rich:video' ||
    Boolean(post.media?.reddit_video)
  );
}

/**
 * Reddit OAuth scopes required by the app.
 */
export const REDDIT_SCOPES = [
  'identity',
  'read',
  'vote',
  'subscribe',
  'history',
  'mysubreddits',
  'save',
];
