import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import {USE_MOCK} from '../config';
import {
  delay,
  getMockComments,
  getMockPost,
  getMockSubreddit,
  getMockSubredditPosts,
  MOCK_SUBREDDITS,
  MOCK_USER,
} from './mockData';
import {useAuthStore} from '../store/authStore';
import type {
  Comment,
  Post,
  Subreddit,
  User,
  RedditListing,
  RedditApiPost,
  RedditApiComment,
  RedditApiSubreddit,
  RedditApiUser,
  SortOption,
  CommentSort,
  VoteDirection,
} from '../types';

// ─── Axios instance ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: 'https://oauth.reddit.com',
  headers: {
    'User-Agent': 'Roddit/1.0.0 (React Native)',
  },
  timeout: 15_000,
});

// ─── Request interceptor: attach Bearer token ─────────────────────────────────

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const {accessToken, isTokenExpired, refreshAccessToken} =
      useAuthStore.getState();

    if (isTokenExpired()) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }
    }

    const currentToken = useAuthStore.getState().accessToken;
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response interceptor: handle 401 with token refresh + retry ──────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: Error | null, token: string | null = null) {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({resolve, reject});
      })
        .then(token => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${String(token)}`;
          }
          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshed = await useAuthStore.getState().refreshAccessToken();
      if (!refreshed) {
        processQueue(new Error('Token refresh failed'), null);
        return Promise.reject(new Error('Session expired'));
      }

      const newToken = useAuthStore.getState().accessToken;
      processQueue(null, newToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as Error, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapPost(apiPost: RedditApiPost, isRead = false): Post {
  const thumb =
    apiPost.thumbnail &&
    apiPost.thumbnail !== 'self' &&
    apiPost.thumbnail !== 'default' &&
    apiPost.thumbnail !== 'nsfw' &&
    apiPost.thumbnail !== 'spoiler' &&
    apiPost.thumbnail !== ''
      ? apiPost.thumbnail
      : null;

  return {
    id: apiPost.id,
    title: apiPost.title,
    author: apiPost.author,
    subreddit: apiPost.subreddit,
    subreddit_name_prefixed: apiPost.subreddit_name_prefixed,
    score: apiPost.score,
    numComments: apiPost.num_comments,
    url: apiPost.url,
    thumbnail: thumb,
    selftext: apiPost.selftext,
    isRead,
    created_utc: apiPost.created_utc,
    post_hint: apiPost.post_hint,
    permalink: apiPost.permalink,
    is_self: apiPost.is_self,
    over_18: apiPost.over_18,
    stickied: apiPost.stickied,
    upvote_ratio: apiPost.upvote_ratio,
    likes: apiPost.likes,
    preview: apiPost.preview,
    media: apiPost.media,
  };
}

function mapComment(apiComment: RedditApiComment): Comment {
  const replies: Comment[] =
    typeof apiComment.replies === 'object' &&
    apiComment.replies?.data?.children
      ? apiComment.replies.data.children
          .filter(c => c.kind === 't1')
          .map(c => mapComment(c.data))
      : [];

  return {
    id: apiComment.id,
    author: apiComment.author,
    body: apiComment.body,
    body_html: apiComment.body_html,
    score: apiComment.score,
    replies,
    depth: apiComment.depth,
    created_utc: apiComment.created_utc,
    likes: apiComment.likes,
    is_submitter: apiComment.is_submitter,
    distinguished: apiComment.distinguished,
    stickied: apiComment.stickied,
    collapsed: apiComment.collapsed ?? false,
  };
}

function mapSubreddit(apiSub: RedditApiSubreddit): Subreddit {
  return {
    id: apiSub.id,
    name: apiSub.name,
    displayName: apiSub.display_name,
    title: apiSub.title,
    description: apiSub.description,
    subscribers: apiSub.subscribers,
    iconImg:
      apiSub.icon_img && apiSub.icon_img !== '' ? apiSub.icon_img : null,
    bannerImg:
      apiSub.banner_img && apiSub.banner_img !== '' ? apiSub.banner_img : null,
    primaryColor:
      apiSub.primary_color && apiSub.primary_color !== ''
        ? apiSub.primary_color
        : null,
    isSubscribed: apiSub.user_is_subscriber ?? false,
    over18: apiSub.over18,
    created_utc: apiSub.created_utc,
    public_description: apiSub.public_description,
    url: apiSub.url,
  };
}

function mapUser(apiUser: RedditApiUser): User {
  return {
    id: apiUser.id,
    name: apiUser.name,
    iconImg:
      apiUser.icon_img && apiUser.icon_img !== '' ? apiUser.icon_img : null,
    karma: apiUser.total_karma,
    commentKarma: apiUser.comment_karma,
    linkKarma: apiUser.link_karma,
    created: apiUser.created_utc,
    isGold: apiUser.is_gold,
    isMod: apiUser.is_mod,
  };
}

// ─── API functions ────────────────────────────────────────────────────────────

export interface PostsPage {
  posts: Post[];
  after: string | null;
}

export async function getPopularSubreddits(
  _after?: string,
): Promise<{subreddits: Subreddit[]; after: string | null}> {
  if (USE_MOCK) {
    await delay();
    return {subreddits: MOCK_SUBREDDITS, after: null};
  }
  const after = _after;
  const params: Record<string, string> = {limit: '25'};
  if (after) {
    params.after = after;
  }
  const response = await api.get<RedditListing<RedditApiSubreddit>>(
    '/subreddits/popular',
    {params},
  );
  const listing = response.data;
  return {
    subreddits: listing.data.children.map(c => mapSubreddit(c.data)),
    after: listing.data.after,
  };
}

export async function getSubscribedSubreddits(): Promise<Subreddit[]> {
  if (USE_MOCK) {
    await delay();
    return MOCK_SUBREDDITS.filter(s => s.isSubscribed);
  }
  const subreddits: Subreddit[] = [];
  let after: string | null = null;

  do {
    const params: Record<string, string> = {limit: '100'};
    if (after) {
      params.after = after;
    }
    const response = await api.get<RedditListing<RedditApiSubreddit>>(
      '/subreddits/mine/subscriber',
      {params},
    );
    const listing = response.data;
    subreddits.push(...listing.data.children.map(c => mapSubreddit(c.data)));
    after = listing.data.after;
  } while (after);

  return subreddits;
}

export async function getSubredditPosts(
  subreddit: string,
  sort: SortOption = 'hot',
  after?: string,
): Promise<PostsPage> {
  if (USE_MOCK) {
    await delay();
    const page = after ? parseInt(after.replace('page', ''), 10) : 0;
    return getMockSubredditPosts(subreddit, page);
  }
  const readIds = new Set(
    (await import('../store/postsStore')).usePostsStore.getState().readPostIds,
  );

  const params: Record<string, string> = {limit: '25'};
  if (after) {
    params.after = after;
  }

  const endpoint =
    subreddit === 'popular' || subreddit === 'all'
      ? `/${subreddit}/${sort}`
      : `/r/${subreddit}/${sort}`;

  const response = await api.get<RedditListing<RedditApiPost>>(endpoint, {
    params,
  });
  const listing = response.data;

  return {
    posts: listing.data.children.map(c =>
      mapPost(c.data, readIds.has(c.data.id)),
    ),
    after: listing.data.after,
  };
}

export async function getPostComments(
  _subredditName: string,
  postId: string,
  _sort: CommentSort = 'best',
): Promise<{post: Post; comments: Comment[]}> {
  if (USE_MOCK) {
    await delay();
    const post = getMockPost(postId);
    if (!post) {
      throw new Error(`Mock post not found: ${postId}`);
    }
    return {post, comments: getMockComments(postId)};
  }
  const subredditName = _subredditName;
  const sort = _sort;
  const readIds = new Set(
    (await import('../store/postsStore')).usePostsStore.getState().readPostIds,
  );

  const response = await api.get<
    [RedditListing<RedditApiPost>, RedditListing<RedditApiComment>]
  >(`/r/${subredditName}/comments/${postId}`, {
    params: {sort, limit: 200},
  });

  const [postListing, commentListing] = response.data;
  const apiPost = postListing.data.children[0]?.data;
  const post = mapPost(apiPost, readIds.has(apiPost.id));

  const comments = commentListing.data.children
    .filter(c => c.kind === 't1')
    .map(c => mapComment(c.data));

  return {post, comments};
}

export async function vote(_fullname: string, _dir: VoteDirection): Promise<void> {
  if (USE_MOCK) {
    await delay(100);
    return;
  }
  const fullname = _fullname;
  const dir = _dir;
  await api.post(
    '/api/vote',
    new URLSearchParams({id: fullname, dir: String(dir)}),
    {headers: {'Content-Type': 'application/x-www-form-urlencoded'}},
  );
}

export async function subscribe(
  _subredditName: string,
  _action: 'sub' | 'unsub',
): Promise<void> {
  if (USE_MOCK) {
    await delay(100);
    return;
  }
  const subredditName = _subredditName;
  const action = _action;
  await api.post(
    '/api/subscribe',
    new URLSearchParams({sr_name: subredditName, action}),
    {headers: {'Content-Type': 'application/x-www-form-urlencoded'}},
  );
}

export async function searchSubreddits(
  query: string,
  _limit = 10,
): Promise<Subreddit[]> {
  if (USE_MOCK) {
    await delay();
    const q = query.toLowerCase();
    return MOCK_SUBREDDITS.filter(
      s =>
        s.displayName.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q),
    );
  }
  const limit = _limit;
  const response = await api.get<RedditListing<RedditApiSubreddit>>(
    '/subreddits/search',
    {params: {q: query, limit}},
  );
  return response.data.data.children.map(c => mapSubreddit(c.data));
}

export async function getCurrentUser(): Promise<User> {
  if (USE_MOCK) {
    await delay(200);
    return MOCK_USER;
  }
  const response = await api.get<RedditApiUser>('/api/v1/me');
  return mapUser(response.data);
}

export async function getSubredditInfo(
  subredditName: string,
): Promise<Subreddit> {
  if (USE_MOCK) {
    await delay(200);
    const sub = getMockSubreddit(subredditName);
    if (!sub) {
      throw new Error(`Mock subreddit not found: ${subredditName}`);
    }
    return sub;
  }
  const response = await api.get<{kind: string; data: RedditApiSubreddit}>(
    `/r/${subredditName}/about`,
  );
  return mapSubreddit(response.data.data);
}

export default api;
