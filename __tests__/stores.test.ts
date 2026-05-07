/**
 * Store unit tests — run without native modules by mocking AsyncStorage.
 */

// Mock AsyncStorage before importing stores
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
  getAllKeys: jest.fn().mockResolvedValue([]),
}));

// ─── postsStore ───────────────────────────────────────────────────────────────

describe('postsStore', () => {
  let usePostsStore: typeof import('../src/store/postsStore').usePostsStore;

  beforeEach(async () => {
    jest.resetModules();
    ({usePostsStore} = await import('../src/store/postsStore'));
    // Reset store state for each test
    usePostsStore.setState({readPostIds: [], hiddenPostIds: []});
  });

  it('marks a post as read', () => {
    usePostsStore.getState().markAsRead('abc');
    expect(usePostsStore.getState().isRead('abc')).toBe(true);
  });

  it('marks a post as unread', () => {
    usePostsStore.getState().markAsRead('abc');
    usePostsStore.getState().markAsUnread('abc');
    expect(usePostsStore.getState().isRead('abc')).toBe(false);
  });

  it('does not duplicate read ids', () => {
    usePostsStore.getState().markAsRead('abc');
    usePostsStore.getState().markAsRead('abc');
    const ids = usePostsStore.getState().readPostIds;
    expect(ids.filter(id => id === 'abc')).toHaveLength(1);
  });

  it('hides a post', () => {
    usePostsStore.getState().hidePost('xyz');
    expect(usePostsStore.getState().isHidden('xyz')).toBe(true);
  });

  it('unhides a post', () => {
    usePostsStore.getState().hidePost('xyz');
    usePostsStore.getState().unhidePost('xyz');
    expect(usePostsStore.getState().isHidden('xyz')).toBe(false);
  });

  it('clears read history', () => {
    usePostsStore.getState().markAsRead('a');
    usePostsStore.getState().markAsRead('b');
    usePostsStore.getState().clearReadHistory();
    expect(usePostsStore.getState().readPostIds).toHaveLength(0);
  });
});

// ─── authStore ────────────────────────────────────────────────────────────────

describe('authStore', () => {
  let useAuthStore: typeof import('../src/store/authStore').useAuthStore;

  beforeEach(async () => {
    jest.resetModules();
    ({useAuthStore} = await import('../src/store/authStore'));
    useAuthStore.getState().logout();
  });

  it('starts unauthenticated', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('sets tokens and marks authenticated', () => {
    const expiresAt = Date.now() + 3_600_000;
    useAuthStore
      .getState()
      .setTokens('access_token_abc', 'refresh_token_xyz', expiresAt);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe('access_token_abc');
  });

  it('logs out by clearing all state', () => {
    const expiresAt = Date.now() + 3_600_000;
    useAuthStore
      .getState()
      .setTokens('access_token_abc', 'refresh_token_xyz', expiresAt);
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('detects expired token', () => {
    useAuthStore
      .getState()
      .setTokens('token', 'refresh', Date.now() - 1000);
    expect(useAuthStore.getState().isTokenExpired()).toBe(true);
  });

  it('detects non-expired token', () => {
    useAuthStore
      .getState()
      .setTokens('token', 'refresh', Date.now() + 3_600_000);
    expect(useAuthStore.getState().isTokenExpired()).toBe(false);
  });
});
