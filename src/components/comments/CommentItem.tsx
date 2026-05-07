import React, {useCallback, useRef, useState} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
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
const UPVOTE_BG = '#FF4500';
const DOWNVOTE_BG = '#7193FF';

export function CommentItem({
  comment,
  onVote,
}: CommentItemProps): React.JSX.Element {
  const {colors} = useTheme();
  const [collapsed, setCollapsed] = useState(comment.collapsed);
  const swipeableRef = useRef<Swipeable>(null);

  const toggleCollapsed = useCallback(() => setCollapsed(c => !c), []);

  const depthColor =
    DEPTH_COLORS[comment.depth % DEPTH_COLORS.length] ?? colors.border;

  const handleVoteSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const fullname = `t1_${comment.id}`;
      if (direction === 'right') {
        const dir: VoteDirection = comment.likes === true ? 0 : 1;
        onVote(fullname, dir);
      } else {
        const dir: VoteDirection = comment.likes === false ? 0 : -1;
        onVote(fullname, dir);
      }
      swipeableRef.current?.close();
    },
    [comment.id, comment.likes, onVote],
  );

  const renderLeftActions = useCallback(
    (progress: Animated.AnimatedInterpolation<number>) => {
      const scale = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.6, 1],
        extrapolate: 'clamp',
      });
      // Already upvoted → slightly darker to signal "undo"
      const bg = comment.likes === true ? '#CC3700' : UPVOTE_BG;
      return (
        <View style={[styles.swipeAction, {backgroundColor: bg}]}>
          <Animated.Text style={[styles.swipeIcon, {transform: [{scale}]}]}>
            ▲
          </Animated.Text>
        </View>
      );
    },
    [comment.likes],
  );

  const renderRightActions = useCallback(
    (progress: Animated.AnimatedInterpolation<number>) => {
      const scale = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.6, 1],
        extrapolate: 'clamp',
      });
      const bg = comment.likes === false ? '#4A6FCC' : DOWNVOTE_BG;
      return (
        <View style={[styles.swipeAction, {backgroundColor: bg}]}>
          <Animated.Text style={[styles.swipeIcon, {transform: [{scale}]}]}>
            ▼
          </Animated.Text>
        </View>
      );
    },
    [comment.likes],
  );

  return (
    <View style={styles.wrapper}>
      {/* Indent bar — tap to toggle collapse */}
      {comment.depth > 0 && (
        <TouchableOpacity
          style={[styles.depthBar, {backgroundColor: depthColor}]}
          onPress={toggleCollapsed}
          activeOpacity={0.5}
          hitSlop={{left: 6, right: 6, top: 0, bottom: 0}}
        />
      )}

      <View style={styles.body}>
        {/* Only the comment's own content is swipeable — replies nest independently */}
        <Swipeable
          ref={swipeableRef}
          renderLeftActions={renderLeftActions}
          renderRightActions={renderRightActions}
          onSwipeableOpen={handleVoteSwipe}
          friction={2}
          overshootLeft={false}
          overshootRight={false}>
          <TouchableOpacity
            style={[styles.commentContent, {backgroundColor: colors.background}]}
            onPress={toggleCollapsed}
            activeOpacity={0.7}>
            <View style={styles.header}>
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
            </View>

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
                    upvoteRatio={comment.upvote_ratio}
                    compact
                  />
                </View>
              </>
            )}
          </TouchableOpacity>
        </Swipeable>

        {/* Replies live outside the Swipeable so each level is independently swipeable */}
        {!collapsed && comment.replies.length > 0 && (
          <View style={[styles.replies, {marginLeft: INDENT_WIDTH}]}>
            {comment.replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} onVote={onVote} />
            ))}
          </View>
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
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
  },
  swipeIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  commentContent: {
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
