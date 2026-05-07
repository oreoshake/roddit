import React, {useCallback, useLayoutEffect, useMemo} from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme} from '../components/common/ThemeProvider';
import {PostCard} from '../components/posts/PostCard';
import {LoadingSpinner} from '../components/common/LoadingSpinner';
import {ErrorView} from '../components/common/ErrorView';
import {EmptyState} from '../components/common/EmptyState';
import {useSubredditPosts} from '../hooks/usePosts';
import {usePostsStore} from '../store/postsStore';
import {getSubscribedSubreddits, vote} from '../services/api';
import type {HomeStackParamList, Post, Subreddit, VoteDirection} from '../types';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  HomeStackParamList,
  'Home'
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export function HomeScreen({navigation}: HomeScreenProps): React.JSX.Element {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const markAsRead = usePostsStore(s => s.markAsRead);
  const hideRead = usePostsStore(s => s.hideRead);
  const toggleHideRead = usePostsStore(s => s.toggleHideRead);
  const readPostIds = usePostsStore(s => s.readPostIds);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useSubredditPosts('popular', 'hot');

  const {data: subscribedSubs} = useQuery<Subreddit[]>({
    queryKey: ['subscribed-subreddits'],
    queryFn: getSubscribedSubreddits,
    staleTime: 1000 * 60 * 10,
  });

  const voteMutation = useMutation({
    mutationFn: ({fullname, dir}: {fullname: string; dir: VoteDirection}) =>
      vote(fullname, dir),
    onError: () => {
      // Invalidate to refetch correct vote state
      queryClient.invalidateQueries({queryKey: ['posts']});
    },
  });

  const readSet = useMemo(() => new Set(readPostIds), [readPostIds]);

  const posts = useMemo<Post[]>(() => {
    const all = data?.pages.flatMap(p => p.posts) ?? [];
    return hideRead ? all.filter(p => !readSet.has(p.id)) : all;
  }, [data, hideRead, readSet]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={toggleHideRead}
          activeOpacity={0.7}
          style={{marginRight: 4, paddingHorizontal: 8, paddingVertical: 4}}>
          <Text style={{fontSize: 13, fontWeight: '600', color: hideRead ? colors.primary : colors.textSecondary}}>
            {hideRead ? 'Show All' : 'Hide Read'}
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, hideRead, toggleHideRead, colors]);

  const handlePostPress = useCallback(
    (post: Post) => {
      markAsRead(post.id);
      navigation.navigate('PostDetail', {
        postId: post.id,
        subredditName: post.subreddit,
        post,
      });
    },
    [markAsRead, navigation],
  );

  const handleSubredditPress = useCallback(
    (subredditName: string) => {
      navigation.navigate('Subreddit', {subredditName});
    },
    [navigation],
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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <ErrorView
        message="Could not load posts. Check your connection."
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Subscribed subreddits horizontal strip */}
      {subscribedSubs && subscribedSubs.length > 0 && (
        <View
          style={[
            styles.subList,
            {backgroundColor: colors.surface, borderBottomColor: colors.border},
          ]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subListContent}>
            {subscribedSubs.map(sub => (
              <TouchableOpacity
                key={sub.id}
                style={[styles.subChip, {backgroundColor: colors.surfaceVariant}]}
                onPress={() => handleSubredditPress(sub.displayName)}
                activeOpacity={0.7}>
                <Text style={[styles.subChipText, {color: colors.text}]}>
                  r/{sub.displayName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <EmptyState title="No posts" message="Nothing to show right now." />
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
  subList: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subListContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  subChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
});
