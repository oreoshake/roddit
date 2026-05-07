// ─── Post ────────────────────────────────────────────────────────────────────

export type PostHint =
  | 'image'
  | 'link'
  | 'self'
  | 'video'
  | 'rich:video'
  | 'hosted:video';

export interface Post {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  subreddit_name_prefixed: string;
  score: number;
  numComments: number;
  url: string;
  thumbnail: string | null;
  selftext: string;
  isRead: boolean;
  created_utc: number;
  post_hint?: PostHint;
  permalink: string;
  is_self: boolean;
  over_18: boolean;
  stickied: boolean;
  upvote_ratio: number;
  likes: boolean | null; // true = upvoted, false = downvoted, null = no vote
  preview?: {
    images: Array<{
      source: {url: string; width: number; height: number};
      resolutions: Array<{url: string; width: number; height: number}>;
    }>;
  };
  media?: {
    reddit_video?: {
      fallback_url: string;
      height: number;
      width: number;
    };
  };
}

// ─── Comment ─────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  author: string;
  body: string;
  body_html?: string;
  score: number;
  upvote_ratio?: number;
  replies: Comment[];
  depth: number;
  created_utc: number;
  likes: boolean | null;
  is_submitter: boolean;
  distinguished: 'moderator' | 'admin' | null;
  stickied: boolean;
  collapsed: boolean;
}

// ─── Subreddit ───────────────────────────────────────────────────────────────

export interface Subreddit {
  id: string;
  name: string; // t5_xxxxx
  displayName: string; // e.g. "worldnews"
  title: string; // full display title
  description: string;
  subscribers: number;
  iconImg: string | null;
  bannerImg: string | null;
  primaryColor: string | null;
  isSubscribed: boolean;
  over18: boolean;
  created_utc: number;
  public_description: string;
  url: string; // e.g. "/r/worldnews/"
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  iconImg: string | null;
  karma: number;
  commentKarma: number;
  linkKarma: number;
  created: number;
  isGold: boolean;
  isMod: boolean;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: User | null;
}

// ─── Theme ───────────────────────────────────────────────────────────────────

export type AppTheme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryVariant: string;
  border: string;
  upvote: string;
  downvote: string;
  read: string;
  error: string;
  success: string;
  overlay: string;
}

// ─── Navigation param lists ───────────────────────────────────────────────────

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Subreddit: {subredditName: string};
  PostDetail: {postId: string; subredditName: string; post?: Post};
};

export type ExploreStackParamList = {
  Explore: undefined;
  Subreddit: {subredditName: string};
  PostDetail: {postId: string; subredditName: string; post?: Post};
};

export type ProfileStackParamList = {
  Profile: undefined;
  Subreddit: {subredditName: string};
  PostDetail: {postId: string; subredditName: string; post?: Post};
};

export type MainTabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  ProfileTab: undefined;
};

// ─── API response wrappers ────────────────────────────────────────────────────

export interface RedditListingChild<T> {
  kind: string;
  data: T;
}

export interface RedditListing<T> {
  kind: 'Listing';
  data: {
    after: string | null;
    before: string | null;
    children: Array<RedditListingChild<T>>;
    dist: number;
  };
}

export interface RedditApiPost {
  id: string;
  name: string; // t3_xxxxx
  title: string;
  author: string;
  subreddit: string;
  subreddit_name_prefixed: string;
  score: number;
  num_comments: number;
  url: string;
  thumbnail: string;
  selftext: string;
  created_utc: number;
  post_hint?: PostHint;
  permalink: string;
  is_self: boolean;
  over_18: boolean;
  stickied: boolean;
  upvote_ratio: number;
  likes: boolean | null;
  preview?: Post['preview'];
  media?: Post['media'];
}

export interface RedditApiComment {
  id: string;
  name: string; // t1_xxxxx
  author: string;
  body: string;
  body_html: string;
  score: number;
  replies: RedditListing<RedditApiComment> | '';
  depth: number;
  created_utc: number;
  likes: boolean | null;
  is_submitter: boolean;
  distinguished: 'moderator' | 'admin' | null;
  stickied: boolean;
  collapsed: boolean;
}

export interface RedditApiSubreddit {
  id: string;
  name: string;
  display_name: string;
  title: string;
  public_description: string;
  description: string;
  subscribers: number;
  icon_img: string;
  banner_img: string;
  primary_color: string;
  user_is_subscriber: boolean;
  over18: boolean;
  created_utc: number;
  url: string;
}

export interface RedditApiUser {
  id: string;
  name: string;
  icon_img: string;
  total_karma: number;
  comment_karma: number;
  link_karma: number;
  created_utc: number;
  is_gold: boolean;
  is_mod: boolean;
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export type SortOption = 'hot' | 'new' | 'top' | 'rising' | 'controversial';
export type CommentSort = 'best' | 'top' | 'new' | 'controversial' | 'old';
export type VoteDirection = 1 | 0 | -1;

export interface DraftPost {
  subreddit: string;
  title: string;
  body: string;
  url: string;
  savedAt: number;
}
