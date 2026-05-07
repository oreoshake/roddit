import React, {useCallback} from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from '../common/ThemeProvider';
import {VoteButtons} from './VoteButtons';
import {formatRelativeTime, formatScore} from '../../utils/time';
import {getPostThumbnail} from '../../utils/reddit';
import type {Post, VoteDirection} from '../../types';

interface PostCardProps {
  post: Post;
  onPress: (post: Post) => void;
  onVote: (fullname: string, dir: VoteDirection) => void;
  onSubredditPress: (subredditName: string) => void;
}

export const PostCard = React.memo(function PostCard({
  post,
  onPress,
  onVote,
  onSubredditPress,
}: PostCardProps): React.JSX.Element {
  const {colors} = useTheme();
  const thumbnail = getPostThumbnail(post);

  const handlePress = useCallback(() => onPress(post), [onPress, post]);
  const handleSubredditPress = useCallback(
    () => onSubredditPress(post.subreddit),
    [onSubredditPress, post.subreddit],
  );

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: post.isRead ? 0.55 : 1,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.85}>
      {/* Thumbnail */}
      {thumbnail && (
        <Image
          source={{uri: thumbnail}}
          style={[styles.thumbnail, {backgroundColor: colors.surfaceVariant}]}
          resizeMode="cover"
        />
      )}

      <View style={styles.content}>
        {/* Title */}
        <Text
          style={[
            styles.title,
            {color: post.isRead ? colors.read : colors.text},
          ]}
          numberOfLines={3}>
          {post.title}
        </Text>

        {/* Metadata row */}
        <View style={styles.meta}>
          <TouchableOpacity onPress={handleSubredditPress}>
            <Text style={[styles.subreddit, {color: colors.primary}]}>
              {post.subreddit_name_prefixed}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.separator, {color: colors.textSecondary}]}>
            {' '}
            •{' '}
          </Text>
          <Text style={[styles.author, {color: colors.textSecondary}]}>
            u/{post.author}
          </Text>
          <Text style={[styles.separator, {color: colors.textSecondary}]}>
            {' '}
            •{' '}
          </Text>
          <Text style={[styles.time, {color: colors.textSecondary}]}>
            {formatRelativeTime(post.created_utc)}
          </Text>
        </View>

        {/* Action row */}
        <View style={styles.actions}>
          <VoteButtons
            score={post.score}
            likes={post.likes}
            fullname={`t3_${post.id}`}
            onVote={onVote}
            upvoteRatio={post.upvote_ratio}
            compact
          />

          <View style={styles.comments}>
            <Text style={[styles.commentIcon, {color: colors.textSecondary}]}>
              💬
            </Text>
            <Text style={[styles.commentCount, {color: colors.textSecondary}]}>
              {formatScore(post.numComments)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginHorizontal: 0,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 90,
    height: 90,
    alignSelf: 'center',
    margin: 12,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    padding: 12,
    paddingLeft: 0,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  subreddit: {
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    fontSize: 12,
  },
  author: {
    fontSize: 12,
  },
  time: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  comments: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentIcon: {
    fontSize: 13,
  },
  commentCount: {
    fontSize: 12,
    fontWeight: '600',
  },
});
