import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RouteProp} from '@react-navigation/native';
import {useTheme} from '../components/common/ThemeProvider';
import {PostCard} from '../components/posts/PostCard';
import {LoadingSpinner} from '../components/common/LoadingSpinner';
import {ErrorView} from '../components/common/ErrorView';
import {EmptyState} from '../components/common/EmptyState';
import {useSubredditPosts} from '../hooks/usePosts';
import {usePostsStore} from '../store/postsStore';
import {getSubredditInfo, subscribe, vote} from '../services/api';
import {formatSubscribers} from '../utils/time';
import type {
  HomeStackParamList,
  Post,
  SortOption,
  VoteDirection,
} from '../types';

type SubredditScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'Subreddit'
>;
type SubredditScreenRouteProp = RouteProp<HomeStackParamList, 'Subreddit'>;

interface SubredditScreenProps {
  navigation: SubredditScreenNavigationProp;
  route: SubredditScreenRouteProp;
}

const SORT_OPTIONS: Array<{label: string; value: SortOption}> = [
  {label: 'Hot', value: 'hot'},
  {label: 'New', value: 'new'},
  {label: 'Top', value: 'top'},
  {label: 'Rising', value: 'rising'},
];

export function SubredditScreen({
  navigation,
  route,
}: SubredditScreenProps): React.JSX.Element {
  const {subredditName} = route.params;
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const markAsRead = usePostsStore(s => s.markAsRead);

  const [sort, setSort] = useState<SortOption>('hot');

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useSubredditPosts(subredditName, sort);

  const {data: subredditInfo} = useQuery({
    queryKey: ['subreddit-info', subredditName],
    queryFn: () => getSubredditInfo(subredditName),
    staleTime: 1000 * 60 * 10,
  });

  const subscribeMutation = useMutation({
    mutationFn: (action: 'sub' | 'unsub') =>
      subscribe(subredditName, action),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['subreddit-info', subredditName],
      });
      queryClient.invalidateQueries({queryKey: ['subscribed-subreddits']});
    },
  });

  const voteMutation = useMutation({
    mutationFn: ({fullname, dir}: {fullname: string; dir: VoteDirection}) =>
      vote(fullname, dir),
  });

  const posts = useMemo<Post[]>(
    () => data?.pages.flatMap(p => p.posts) ?? [],
    [data],
  );

  const handlePostPress = useCallback(
    (post: Post) => {
      markAsRead(post.id);
      navigation.navigate('PostDetail', {
        postId: post.id,
        subredditName,
        post,
      });
    },
    [markAsRead, navigation, subredditName],
  );

  const handleSubredditPress = useCallback(
    (name: string) => {
      if (name !== subredditName) {
        navigation.navigate('Subreddit', {subredditName: name});
      }
    },
    [navigation, subredditName],
  );

  const handleVote = useCallback(
    (fullname: string, dir: VoteDirection) => {
      voteMutation.mutate({fullname, dir});
    },
    [voteMutation],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const renderPost = useCallback(
    ({item}: {item: Post}) => (
      <PostCard
        post={item}
        onPress={handlePostPress}
        onVote={handleVote}
        onSubredditPress={handleSubredditPress}
      />
    ),
    [handlePostPress, handleVote, handleSubredditPress],
  );

  const keyExtractor = useCallback((item: Post) => item.id, []);

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) {
      return null;
    }
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }, [isFetchingNextPage, colors.primary]);

  const ListHeader = useMemo(
    () => (
      <View>
        {/* Subreddit header */}
        <View
          style={[
            styles.subredditHeader,
            {backgroundColor: colors.surface, borderBottomColor: colors.border},
          ]}>
          <View style={styles.subredditInfo}>
            <Text style={[styles.subredditName, {color: colors.text}]}>
              r/{subredditName}
            </Text>
            {subredditInfo && (
              <Text style={[styles.subscribers, {color: colors.textSecondary}]}>
                {formatSubscribers(subredditInfo.subscribers)} members
              </Text>
            )}
            {subredditInfo?.public_description ? (
              <Text
                style={[styles.description, {color: colors.textSecondary}]}
                numberOfLines={2}>
                {subredditInfo.public_description}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[
              styles.subscribeButton,
              {
                backgroundColor: subredditInfo?.isSubscribed
                  ? colors.surfaceVariant
                  : colors.primary,
                borderColor: colors.primary,
              },
            ]}
            onPress={() => {
              if (subredditInfo) {
                subscribeMutation.mutate(
                  subredditInfo.isSubscribed ? 'unsub' : 'sub',
                );
              }
            }}
            disabled={subscribeMutation.isPending}
            activeOpacity={0.8}>
            <Text
              style={[
                styles.subscribeButtonText,
                {
                  color: subredditInfo?.isSubscribed
                    ? colors.primary
                    : '#FFFFFF',
                },
              ]}>
              {subredditInfo?.isSubscribed ? 'Joined' : 'Join'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sort tabs */}
        <View
          style={[
            styles.sortRow,
            {backgroundColor: colors.surface, borderBottomColor: colors.border},
          ]}>
          {SORT_OPTIONS.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortTab,
                sort === option.value && {
                  borderBottomColor: colors.primary,
                  borderBottomWidth: 2,
                },
              ]}
              onPress={() => setSort(option.value)}
              activeOpacity={0.7}>
              <Text
                style={[
                  styles.sortTabText,
                  {
                    color:
                      sort === option.value
                        ? colors.primary
                        : colors.textSecondary,
                    fontWeight: sort === option.value ? '700' : '400',
                  },
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ),
    [
      subredditName,
      subredditInfo,
      subscribeMutation,
      sort,
      colors,
    ],
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <ErrorView
        message={`Could not load r/${subredditName}. Check your connection.`}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <EmptyState
            title="No posts"
            message={`r/${subredditName} has no posts in this category.`}
          />
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subredditHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subredditInfo: {
    flex: 1,
    marginRight: 12,
  },
  subredditName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subscribers: {
    fontSize: 13,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  subscribeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  subscribeButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sortRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sortTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sortTabText: {
    fontSize: 14,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
});
