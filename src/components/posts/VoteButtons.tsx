import React, {useCallback, useRef} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from '../common/ThemeProvider';
import {formatScore} from '../../utils/time';
import type {VoteDirection} from '../../types';

interface VoteButtonsProps {
  score: number;
  likes: boolean | null;
  fullname: string;
  onVote: (fullname: string, dir: VoteDirection) => void;
  compact?: boolean;
  upvoteRatio?: number;
}

function estimateUps(score: number, ratio: number): number | null {
  const denom = 2 * ratio - 1;
  if (Math.abs(denom) < 0.05) {
    return null; // ratio too close to 0.5 — result is unreliable
  }
  return Math.round((score * ratio) / denom);
}

export function VoteButtons({
  score,
  likes,
  fullname,
  onVote,
  compact = false,
  upvoteRatio,
}: VoteButtonsProps): React.JSX.Element {
  const {colors} = useTheme();

  const upScale = useRef(new Animated.Value(1)).current;
  const downScale = useRef(new Animated.Value(1)).current;

  const animateTap = useCallback(
    (scaleAnim: Animated.Value) => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.4,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
      ]).start();
    },
    [],
  );

  const handleUpvote = useCallback(() => {
    animateTap(upScale);
    // Toggle: if already upvoted, remove vote; otherwise upvote
    const dir: VoteDirection = likes === true ? 0 : 1;
    onVote(fullname, dir);
  }, [animateTap, upScale, likes, onVote, fullname]);

  const handleDownvote = useCallback(() => {
    animateTap(downScale);
    const dir: VoteDirection = likes === false ? 0 : -1;
    onVote(fullname, dir);
  }, [animateTap, downScale, likes, onVote, fullname]);

  const upvoteColor = likes === true ? colors.upvote : colors.textSecondary;
  const downvoteColor = likes === false ? colors.downvote : colors.textSecondary;
  const scoreColor =
    likes === true
      ? colors.upvote
      : likes === false
      ? colors.downvote
      : colors.text;

  const estimatedUps =
    upvoteRatio !== undefined ? estimateUps(score, upvoteRatio) : null;

  const size = compact ? 18 : 22;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleUpvote} hitSlop={HIT_SLOP} activeOpacity={0.7}>
        <Animated.Text
          style={[
            styles.arrow,
            {color: upvoteColor, fontSize: size, transform: [{scale: upScale}]},
          ]}>
          ▲
        </Animated.Text>
      </TouchableOpacity>

      <View style={styles.scoreColumn}>
        {estimatedUps !== null ? (
          <>
            <Text style={[styles.estimatedUps, {color: scoreColor, fontSize: compact ? 12 : 14}]}>
              ≈{formatScore(estimatedUps)}
            </Text>
            <Text style={[styles.netScore, {color: colors.textSecondary, fontSize: compact ? 10 : 11}]}>
              {formatScore(score)} pts
            </Text>
          </>
        ) : (
          <Text style={[styles.estimatedUps, {color: scoreColor, fontSize: compact ? 12 : 14}]}>
            {formatScore(score)}
          </Text>
        )}
      </View>

      <TouchableOpacity onPress={handleDownvote} hitSlop={HIT_SLOP} activeOpacity={0.7}>
        <Animated.Text
          style={[
            styles.arrow,
            {
              color: downvoteColor,
              fontSize: size,
              transform: [{scale: downScale}],
            },
          ]}>
          ▼
        </Animated.Text>
      </TouchableOpacity>
    </View>
  );
}

const HIT_SLOP = {top: 8, bottom: 8, left: 8, right: 8};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrow: {
    fontWeight: '700',
  },
  scoreColumn: {
    alignItems: 'center',
    minWidth: 36,
  },
  estimatedUps: {
    fontWeight: '700',
    textAlign: 'center',
  },
  netScore: {
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 1,
  },
});
