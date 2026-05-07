import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  FlatList,
  Image,
  Linking,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useTheme} from '../components/common/ThemeProvider';
import {CommentItem} from '../components/comments/CommentItem';
import {VoteButtons} from '../components/posts/VoteButtons';
import {LoadingSpinner} from '../components/common/LoadingSpinner';
import {ErrorView} from '../components/common/ErrorView';
import {EmptyState} from '../components/common/EmptyState';
import {usePostComments} from '../hooks/usePosts';
import {usePostsStore} from '../store/postsStore';
import {vote} from '../services/api';
import {formatRelativeTime, formatScore} from '../utils/time';
import {getPostThumbnail, getPostUrl, isImagePost} from '../utils/reddit';
import type {
  Comment,
  CommentSort,
  HomeStackParamList,
  VoteDirection,
} from '../types';

type PostDetailNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'PostDetail'
>;
type PostDetailRouteProp = RouteProp<HomeStackParamList, 'PostDetail'>;

interface PostDetailScreenProps {
  navigation: PostDetailNavigationProp;
  route: PostDetailRouteProp;
}

const COMMENT_SORT_OPTIONS: Array<{label: string; value: CommentSort}> = [
  {label: 'Best', value: 'best'},
  {label: 'Top', value: 'top'},
  {label: 'New', value: 'new'},
  {label: 'Controversial', value: 'controversial'},
];

export function PostDetailScreen({
  navigation,
  route,
}: PostDetailScreenProps): React.JSX.Element {
  const {postId, subredditName, post: routePost} = route.params;
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const markAsRead = usePostsStore(s => s.markAsRead);

  const [commentSort, setCommentSort] = useState<CommentSort>('best');

  const {data, isLoading, isError, refetch, isRefetching} = usePostComments(
    subredditName,
    postId,
    commentSort,
  );

  const post = data?.post ?? routePost;
  const comments = data?.comments ?? [];

  // Mark post as read when opened
  useEffect(() => {
    markAsRead(postId);
  }, [markAsRead, postId]);

  // Set navigation title
  useEffect(() => {
    if (post) {
      navigation.setOptions({title: `r/${subredditName}`});
    }
  }, [navigation, post, subredditName]);

  const voteMutation = useMutation({
    mutationFn: ({fullname, dir}: {fullname: string; dir: VoteDirection}) =>
      vote(fullname, dir),
    onError: () => {
      queryClient.invalidateQueries({queryKey: ['posts']});
    },
  });

  const handleVote = useCallback(
    (fullname: string, dir: VoteDirection) => {
      voteMutation.mutate({fullname, dir});
    },
    [voteMutation],
  );

  const handleShare = useCallback(async () => {
    if (!post) {
      return;
    }
    try {
      await Share.share({
        message: `${post.title} — ${getPostUrl(post.permalink)}`,
        url: getPostUrl(post.permalink),
        title: post.title,
      });
    } catch {
      // User cancelled or share failed
    }
  }, [post]);

  const handleOpenLink = useCallback(async () => {
    if (!post) {
      return;
    }
    const url = post.is_self ? getPostUrl(post.permalink) : post.url;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    }
  }, [post]);

  const renderComment = useCallback(
    ({item}: {item: Comment}) => (
      <CommentItem comment={item} onVote={handleVote} />
    ),
    [handleVote],
  );

  const keyExtractor = useCallback((item: Comment) => item.id, []);

  const thumbnail = post ? getPostThumbnail(post) : null;
  const showImage = post && isImagePost(post) && thumbnail;

  const ListHeader = useMemo(() => {
    if (!post) {
      return null;
    }
    return (
      <View>
        {/* Post content */}
        <View
          style={[
            styles.postContainer,
            {backgroundColor: colors.surface, borderBottomColor: colors.border},
          ]}>
          {/* Image */}
          {showImage && thumbnail && (
            <Image
              source={{uri: thumbnail}}
              style={[styles.postImage, {backgroundColor: colors.surfaceVariant}]}
              resizeMode="contain"
            />
          )}

          {/* Title */}
          <Text style={[styles.postTitle, {color: colors.text}]}>
            {post.title}
          </Text>

          {/* Selftext */}
          {post.is_self && post.selftext ? (
            <Text style={[styles.selftext, {color: colors.textSecondary}]}>
              {post.selftext}
            </Text>
          ) : null}

          {/* Link post */}
          {!post.is_self && (
            <TouchableOpacity
              style={[styles.linkRow, {borderColor: colors.border}]}
              onPress={handleOpenLink}
              activeOpacity={0.7}>
              <Text
                style={[styles.linkText, {color: colors.primary}]}
                numberOfLines={1}>
                {post.url}
              </Text>
              <Text style={[styles.linkIcon, {color: colors.primary}]}>
                {' '}↗
              </Text>
            </TouchableOpacity>
          )}

          {/* Meta */}
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, {color: colors.textSecondary}]}>
              r/{post.subreddit}
            </Text>
            <Text style={[styles.metaDot, {color: colors.textSecondary}]}>
              {' '}•{' '}
            </Text>
            <Text style={[styles.metaText, {color: colors.textSecondary}]}>
              u/{post.author}
            </Text>
            <Text style={[styles.metaDot, {color: colors.textSecondary}]}>
              {' '}•{' '}
            </Text>
            <Text style={[styles.metaText, {color: colors.textSecondary}]}>
              {formatRelativeTime(post.created_utc)}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <VoteButtons
              score={post.score}
              likes={post.likes}
              fullname={`t3_${post.id}`}
              onVote={handleVote}
              upvoteRatio={post.upvote_ratio}
            />

            <View style={styles.actionButtons}>
              <View style={styles.commentsBadge}>
                <Text
                  style={[styles.commentsIcon, {color: colors.textSecondary}]}>
                  💬
                </Text>
                <Text
                  style={[styles.commentsCount, {color: colors.textSecondary}]}>
                  {formatScore(post.numComments)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShare}
                activeOpacity={0.7}>
                <Text
                  style={[styles.shareText, {color: colors.textSecondary}]}>
                  Share
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Comment sort */}
        <View
          style={[
            styles.sortRow,
            {backgroundColor: colors.surface, borderBottomColor: colors.border},
          ]}>
          {COMMENT_SORT_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortTab,
                commentSort === option.value && {
                  borderBottomColor: colors.primary,
                  borderBottomWidth: 2,
                },
              ]}
              onPress={() => setCommentSort(option.value)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.sortTabText,
                  {
                    color:
                      commentSort === option.value
                        ? colors.primary
                        : colors.textSecondary,
                    fontWeight: commentSort === option.value ? '700' : '400',
                  },
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }, [
    post,
    showImage,
    thumbnail,
    commentSort,
    colors,
    handleOpenLink,
    handleVote,
    handleShare,
  ]);

  if (isLoading && !routePost) {
    return <LoadingSpinner />;
  }

  if (isError && !routePost) {
    return (
      <ErrorView
        message="Could not load post. Check your connection."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.commentsLoading}>
              <LoadingSpinner fullScreen={false} size="small" />
            </View>
          ) : (
            <EmptyState title="No comments" message="Be the first to comment!" />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{paddingBottom: insets.bottom + 16}}
        showsVerticalScrollIndicator={false}
        style={[styles.list, {backgroundColor: colors.background}]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  postContainer: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    marginBottom: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: 8,
  },
  selftext: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
  },
  linkIcon: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
  },
  metaDot: {
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  commentsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentsIcon: {
    fontSize: 16,
  },
  commentsCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    padding: 4,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  sortTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sortTabText: {
    fontSize: 13,
  },
  commentsLoading: {
    padding: 32,
  },
});
