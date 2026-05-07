import React, {useCallback, useState} from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from '../common/ThemeProvider';
import {VoteButtons} from '../posts/VoteButtons';
import {formatRelativeTime, formatScore} from '../../utils/time';
import type {Comment, VoteDirection} from '../../types';

interface CommentItemProps {
  comment: Comment;
  onVote: (fullname: string, dir: VoteDirection) => void;
}

const DEPTH_COLORS = [
  '#FF4500',
  '#7193FF',
  '#46D160',
  '#FFCA00',
  '#FF585B',
  '#00D2FF',
  '#FF6534',
];

export function CommentItem({
  comment,
  onVote,
}: CommentItemProps): React.JSX.Element {
  const {colors} = useTheme();
  const [collapsed, setCollapsed] = useState(comment.collapsed);

  const toggleCollapsed = useCallback(() => setCollapsed(c => !c), []);

  const depthColor =
    DEPTH_COLORS[comment.depth % DEPTH_COLORS.length] ?? colors.border;

  const indentWidth = comment.depth * 12;

  return (
    <View style={[styles.wrapper, {marginLeft: indentWidth}]}>
      {/* Left depth indicator */}
      {comment.depth > 0 && (
        <TouchableOpacity
          style={[styles.depthBar, {backgroundColor: depthColor}]}
          onPress={toggleCollapsed}
          activeOpacity={0.6}
        />
      )}

      <View style={[styles.content, {borderColor: colors.border}]}>
        {/* Header */}
        <TouchableOpacity
          style={styles.header}
          onPress={toggleCollapsed}
          activeOpacity={0.8}>
          <Text style={[styles.author, {color: colors.primary}]}>
            {comment.is_submitter ? (
              <Text style={{color: colors.upvote}}>{comment.author} [OP]</Text>
            ) : (
              comment.author
            )}
          </Text>
          {comment.distinguished === 'moderator' && (
            <Text style={[styles.badge, {color: colors.success}]}> MOD</Text>
          )}
          {comment.distinguished === 'admin' && (
            <Text style={[styles.badge, {color: colors.error}]}> ADMIN</Text>
          )}
          <Text style={[styles.dot, {color: colors.textSecondary}]}> • </Text>
          <Text style={[styles.score, {color: colors.textSecondary}]}>
            {formatScore(comment.score)} pts
          </Text>
          <Text style={[styles.dot, {color: colors.textSecondary}]}> • </Text>
          <Text style={[styles.time, {color: colors.textSecondary}]}>
            {formatRelativeTime(comment.created_utc)}
          </Text>
          <Text style={[styles.collapseIcon, {color: colors.textSecondary}]}>
            {collapsed ? ' [+]' : ' [–]'}
          </Text>
        </TouchableOpacity>

        {!collapsed && (
          <>
            {/* Body */}
            <Text style={[styles.body, {color: colors.text}]}>
              {comment.body}
            </Text>

            {/* Vote row */}
            <View style={styles.voteRow}>
              <VoteButtons
                score={comment.score}
                likes={comment.likes}
                fullname={`t1_${comment.id}`}
                onVote={onVote}
                compact
              />
            </View>
          </>
        )}
      </View>

      {/* Nested replies */}
      {!collapsed && comment.replies.length > 0 && (
        <View style={styles.replies}>
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} onVote={onVote} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
  },
  depthBar: {
    width: 2,
    marginRight: 8,
    borderRadius: 1,
  },
  content: {
    flex: 1,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  author: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
  },
  dot: {
    fontSize: 13,
  },
  score: {
    fontSize: 12,
  },
  time: {
    fontSize: 12,
  },
  collapseIcon: {
    fontSize: 12,
    marginLeft: 4,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replies: {
    flex: 1,
  },
});
