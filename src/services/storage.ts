import AsyncStorage from '@react-native-async-storage/async-storage';
import type {AuthState, DraftPost, Post} from '../types';

// ─── Keys ─────────────────────────────────────────────────────────────────────

const KEYS = {
  AUTH_TOKENS: 'roddit:auth_tokens',
  DRAFT_POST: 'roddit:draft_post',
  CACHED_POSTS_PREFIX: 'roddit:posts:',
  THEME: 'roddit:theme',
} as const;

// ─── Auth Tokens ──────────────────────────────────────────────────────────────

export type StoredAuthTokens = Pick<
  AuthState,
  'accessToken' | 'refreshToken' | 'expiresAt'
>;

export async function saveAuthTokens(
  tokens: StoredAuthTokens,
): Promise<void> {
  await AsyncStorage.setItem(KEYS.AUTH_TOKENS, JSON.stringify(tokens));
}

export async function getAuthTokens(): Promise<StoredAuthTokens | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.AUTH_TOKENS);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredAuthTokens;
  } catch {
    return null;
  }
}

export async function clearAuthTokens(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.AUTH_TOKENS);
}

// ─── Draft Post ───────────────────────────────────────────────────────────────

export async function saveDraftPost(draft: DraftPost): Promise<void> {
  await AsyncStorage.setItem(KEYS.DRAFT_POST, JSON.stringify(draft));
}

export async function getDraftPost(): Promise<DraftPost | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.DRAFT_POST);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as DraftPost;
  } catch {
    return null;
  }
}

export async function clearDraftPost(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.DRAFT_POST);
}

// ─── Post Cache ───────────────────────────────────────────────────────────────

const POST_CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

interface CachedPosts {
  posts: Post[];
  cachedAt: number;
}

export async function cachePosts(
  subreddit: string,
  posts: Post[],
): Promise<void> {
  const key = `${KEYS.CACHED_POSTS_PREFIX}${subreddit}`;
  const payload: CachedPosts = {posts, cachedAt: Date.now()};
  await AsyncStorage.setItem(key, JSON.stringify(payload));
}

export async function getCachedPosts(subreddit: string): Promise<Post[] | null> {
  try {
    const key = `${KEYS.CACHED_POSTS_PREFIX}${subreddit}`;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const cached = JSON.parse(raw) as CachedPosts;
    const isExpired = Date.now() - cached.cachedAt > POST_CACHE_TTL_MS;
    if (isExpired) {
      await AsyncStorage.removeItem(key);
      return null;
    }
    return cached.posts;
  } catch {
    return null;
  }
}

export async function clearCachedPosts(subreddit?: string): Promise<void> {
  if (subreddit) {
    await AsyncStorage.removeItem(`${KEYS.CACHED_POSTS_PREFIX}${subreddit}`);
    return;
  }
  // Clear all post caches
  const keys = await AsyncStorage.getAllKeys();
  const postKeys = keys.filter(k => k.startsWith(KEYS.CACHED_POSTS_PREFIX));
  if (postKeys.length > 0) {
    await AsyncStorage.multiRemove(postKeys);
  }
}

// ─── Theme Preference ─────────────────────────────────────────────────────────

export async function saveThemePreference(
  theme: 'light' | 'dark' | 'system',
): Promise<void> {
  await AsyncStorage.setItem(KEYS.THEME, theme);
}

export async function getThemePreference(): Promise<
  'light' | 'dark' | 'system'
> {
  try {
    const value = await AsyncStorage.getItem(KEYS.THEME);
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value;
    }
    return 'system';
  } catch {
    return 'system';
  }
}
