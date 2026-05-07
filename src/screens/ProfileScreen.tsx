import React, {useCallback} from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme} from '../components/common/ThemeProvider';
import {LoadingSpinner} from '../components/common/LoadingSpinner';
import {useAuthStore} from '../store/authStore';
import {usePostsStore} from '../store/postsStore';
import {getSubscribedSubreddits} from '../services/api';
import {formatScore, formatRelativeTime} from '../utils/time';
import type {Subreddit, ProfileStackParamList} from '../types';

type ProfileNavProp = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

export function ProfileScreen(): React.JSX.Element {
  const {colors, theme, toggleTheme} = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<ProfileNavProp>();
  const {user, logout} = useAuthStore();
  const {readPostIds, clearReadHistory} = usePostsStore();

  const {data: subscribedSubs, isLoading: loadingSubs} = useQuery<Subreddit[]>({
    queryKey: ['subscribed-subreddits'],
    queryFn: getSubscribedSubreddits,
    staleTime: 1000 * 60 * 10,
  });

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of Roddit?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ],
    );
  }, [logout]);

  const handleClearReadHistory = useCallback(() => {
    Alert.alert(
      'Clear Read History',
      `This will mark all ${readPostIds.length} read posts as unread.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearReadHistory,
        },
      ],
    );
  }, [clearReadHistory, readPostIds.length]);

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: colors.background}]}
      contentContainerStyle={{paddingBottom: insets.bottom + 24}}>

      {/* User Card */}
      <View style={[styles.userCard, {backgroundColor: colors.surface}]}>
        {user?.iconImg ? (
          <Image
            source={{uri: user.iconImg}}
            style={styles.avatar}
          />
        ) : (
          <View
            style={[styles.avatarPlaceholder, {backgroundColor: colors.primary}]}>
            <Text style={styles.avatarLetter}>
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={[styles.userName, {color: colors.text}]}>
            u/{user?.name ?? 'Unknown'}
          </Text>
          {user && (
            <>
              <Text style={[styles.karma, {color: colors.textSecondary}]}>
                {formatScore(user.karma)} karma
              </Text>
              <Text style={[styles.joined, {color: colors.textSecondary}]}>
                Joined {formatRelativeTime(user.created)}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Karma breakdown */}
      {user && (
        <View
          style={[
            styles.karmaCard,
            {backgroundColor: colors.surface, borderColor: colors.border},
          ]}>
          <View style={styles.karmaItem}>
            <Text style={[styles.karmaValue, {color: colors.text}]}>
              {formatScore(user.linkKarma)}
            </Text>
            <Text style={[styles.karmaLabel, {color: colors.textSecondary}]}>
              Post Karma
            </Text>
          </View>
          <View
            style={[styles.karmaDivider, {backgroundColor: colors.border}]}
          />
          <View style={styles.karmaItem}>
            <Text style={[styles.karmaValue, {color: colors.text}]}>
              {formatScore(user.commentKarma)}
            </Text>
            <Text style={[styles.karmaLabel, {color: colors.textSecondary}]}>
              Comment Karma
            </Text>
          </View>
        </View>
      )}

      {/* Settings */}
      <Text style={[styles.sectionHeader, {color: colors.textSecondary}]}>
        Settings
      </Text>
      <View style={[styles.section, {backgroundColor: colors.surface}]}>
        <View
          style={[styles.settingRow, {borderBottomColor: colors.border}]}>
          <Text style={[styles.settingLabel, {color: colors.text}]}>
            Dark Mode
          </Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{false: colors.border, true: colors.primary}}
            thumbColor="#FFFFFF"
          />
        </View>

        <TouchableOpacity
          style={[styles.settingRow, {borderBottomColor: colors.border}]}
          onPress={handleClearReadHistory}
          activeOpacity={0.7}>
          <View>
            <Text style={[styles.settingLabel, {color: colors.text}]}>
              Clear Read History
            </Text>
            <Text style={[styles.settingSubtitle, {color: colors.textSecondary}]}>
              {readPostIds.length} posts marked as read
            </Text>
          </View>
          <Text style={[styles.chevron, {color: colors.textSecondary}]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Subscribed Subreddits */}
      <Text style={[styles.sectionHeader, {color: colors.textSecondary}]}>
        Subscribed Subreddits
      </Text>
      <View style={[styles.section, {backgroundColor: colors.surface}]}>
        {loadingSubs ? (
          <LoadingSpinner size="small" fullScreen={false} />
        ) : subscribedSubs && subscribedSubs.length > 0 ? (
          subscribedSubs.map((sub, index) => (
            <TouchableOpacity
              key={sub.id}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Subreddit', {subredditName: sub.displayName})}
              style={[
                styles.subRow,
                index < subscribedSubs.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}>
              <View
                style={[
                  styles.subAvatar,
                  {backgroundColor: sub.primaryColor ?? colors.primary},
                ]}>
                <Text style={styles.subAvatarText}>
                  {sub.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.subInfo}>
                <Text style={[styles.subName, {color: colors.text}]}>
                  r/{sub.displayName}
                </Text>
                <Text style={[styles.subMembers, {color: colors.textSecondary}]}>
                  {formatScore(sub.subscribers)} members
                </Text>
              </View>
              <Text style={[styles.chevron, {color: colors.textSecondary}]}>›</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={[styles.emptyText, {color: colors.textSecondary}]}>
            Not subscribed to any subreddits yet.
          </Text>
        )}
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutButton, {borderColor: colors.error}]}
        onPress={handleLogout}
        activeOpacity={0.8}>
        <Text style={[styles.logoutText, {color: colors.error}]}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 8,
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  karma: {
    fontSize: 14,
    marginBottom: 2,
  },
  joined: {
    fontSize: 13,
  },
  karmaCard: {
    flexDirection: 'row',
    marginHorizontal: 0,
    marginBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  karmaItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  karmaValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  karmaLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  karmaDivider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  subAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  subInfo: {
    flex: 1,
  },
  subName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  subMembers: {
    fontSize: 12,
  },
  emptyText: {
    padding: 16,
    fontSize: 14,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
