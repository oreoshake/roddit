import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  getSubredditPosts,
  getPostComments,
  type PostsPage,
} from '../services/api';
import type {Comment, Post, SortOption, CommentSort} from '../types';

export const postKeys = {
  all: ['posts'] as const,
  subreddit: (sub: string, sort: SortOption) =>
    [...postKeys.all, 'subreddit', sub, sort] as const,
  comments: (sub: string, postId: string, sort: CommentSort) =>
    [...postKeys.all, 'comments', sub, postId, sort] as const,
};

export function useSubredditPosts(subreddit: string, sort: SortOption = 'hot') {
  return useInfiniteQuery<PostsPage, Error>({
    queryKey: postKeys.subreddit(subreddit, sort),
    queryFn: ({pageParam}: {pageParam?: string}) =>
      getSubredditPosts(subreddit, sort, pageParam),
    getNextPageParam: (lastPage: PostsPage) => lastPage.after ?? undefined,
    staleTime: 1000 * 60 * 5,
  });
}

interface PostCommentsResult {
  post: Post;
  comments: Comment[];
}

export function usePostComments(
  subredditName: string,
  postId: string,
  sort: CommentSort = 'best',
) {
  return useQuery<PostCommentsResult, Error>({
    queryKey: postKeys.comments(subredditName, postId, sort),
    queryFn: () => getPostComments(subredditName, postId, sort),
    staleTime: 1000 * 60 * 2,
  });
}

export function usePrefetchPost(subredditName: string, postId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.prefetchQuery(
      postKeys.comments(subredditName, postId, 'best'),
      () => getPostComments(subredditName, postId, 'best'),
      {staleTime: 1000 * 60 * 2},
    );
  };
}
