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

const INDENT_WIDTH = 10;

export function CommentItem({
  comment,
  onVote,
}: CommentItemProps): React.JSX.Element {
  const {colors} = useTheme();
  const [collapsed, setCollapsed] = useState(comment.collapsed);

  const toggleCollapsed = useCallback(() => setCollapsed(c => !c), []);

  const depthColor =
    DEPTH_COLORS[comment.depth % DEPTH_COLORS.length] ?? colors.border;

  return (
    <View style={styles.wrapper}>
      {/* Indent bar — tapping it toggles collapse */}
      {comment.depth > 0 && (
        <TouchableOpacity
          style={[styles.depthBar, {backgroundColor: depthColor}]}
          onPress={toggleCollapsed}
          activeOpacity={0.5}
          hitSlop={{left: 6, right: 6, top: 0, bottom: 0}}
        />
      )}

      {/* Comment body + children stacked vertically */}
      <View style={styles.body}>
        {/* Header row — tap to collapse */}
        <TouchableOpacity
          style={styles.header}
          onPress={toggleCollapsed}
          activeOpacity={0.7}>
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
          <Text style={[styles.meta, {color: colors.textSecondary}]}>
            {'  '}
            {formatScore(comment.score)} pts
            {'  ·  '}
            {formatRelativeTime(comment.created_utc)}
          </Text>
          <Text style={[styles.collapseIcon, {color: colors.textSecondary}]}>
            {'  '}{collapsed ? '[+]' : '[–]'}
          </Text>
        </TouchableOpacity>

        {collapsed ? (
          comment.replies.length > 0 ? (
            <Text style={[styles.collapsedHint, {color: colors.textSecondary}]}>
              {comment.replies.length}{' '}
              {comment.replies.length === 1 ? 'reply' : 'replies'} hidden
            </Text>
          ) : null
        ) : (
          <>
            <Text style={[styles.commentBody, {color: colors.text}]}>
              {comment.body}
            </Text>

            <View style={styles.voteRow}>
              <VoteButtons
                score={comment.score}
                likes={comment.likes}
                fullname={`t1_${comment.id}`}
                onVote={onVote}
                compact
              />
            </View>

            {comment.replies.length > 0 && (
              <View style={[styles.replies, {marginLeft: INDENT_WIDTH}]}>
                {comment.replies.map(reply => (
                  <CommentItem key={reply.id} comment={reply} onVote={onVote} />
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    paddingTop: 10,
  },
  depthBar: {
    width: 2,
    borderRadius: 1,
    marginRight: 8,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  author: {
    fontSize: 13,
    fontWeight: '600',
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
  },
  collapseIcon: {
    fontSize: 12,
  },
  collapsedHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 6,
  },
  commentBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replies: {
    marginTop: 4,
  },
});
