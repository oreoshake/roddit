import React, {useCallback, useState} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useQuery} from '@tanstack/react-query';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme} from '../components/common/ThemeProvider';
import {LoadingSpinner} from '../components/common/LoadingSpinner';
import {ErrorView} from '../components/common/ErrorView';
import {getPopularSubreddits, searchSubreddits} from '../services/api';
import {formatSubscribers} from '../utils/time';
import type {ExploreStackParamList, Subreddit} from '../types';

type ExploreScreenNavigationProp = NativeStackNavigationProp<
  ExploreStackParamList,
  'Explore'
>;

interface ExploreScreenProps {
  navigation: ExploreScreenNavigationProp;
}

export function ExploreScreen({
  navigation,
}: ExploreScreenProps): React.JSX.Element {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const debounceTimer = React.useRef<ReturnType<typeof setTimeout>>();

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => setDebouncedQuery(text), 400);
  }, []);

  const {data: popularSubreddits, isLoading: loadingPopular, isError: popularError, refetch} = useQuery({
    queryKey: ['popular-subreddits'],
    queryFn: () => getPopularSubreddits(),
    staleTime: 1000 * 60 * 10,
    enabled: debouncedQuery.length === 0,
  });

  const {data: searchResults, isLoading: loadingSearch} = useQuery({
    queryKey: ['search-subreddits', debouncedQuery],
    queryFn: () => searchSubreddits(debouncedQuery, 20),
    enabled: debouncedQuery.length > 1,
    staleTime: 1000 * 60 * 5,
  });

  const subreddits =
    debouncedQuery.length > 1
      ? (searchResults ?? [])
      : (popularSubreddits?.subreddits ?? []);

  const isLoading =
    debouncedQuery.length > 1 ? loadingSearch : loadingPopular;

  const handleSubredditPress = useCallback(
    (subredditName: string) => {
      navigation.navigate('Subreddit', {subredditName});
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({item}: {item: Subreddit}) => (
      <TouchableOpacity
        style={[
          styles.subredditRow,
          {backgroundColor: colors.surface, borderBottomColor: colors.border},
        ]}
        onPress={() => handleSubredditPress(item.displayName)}
        activeOpacity={0.7}>
        <View
          style={[
            styles.subredditAvatar,
            {backgroundColor: item.primaryColor ?? colors.primary},
          ]}>
          <Text style={styles.avatarText}>
            {item.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.subredditInfo}>
          <Text style={[styles.subredditName, {color: colors.text}]}>
            r/{item.displayName}
          </Text>
          <Text style={[styles.subscribers, {color: colors.textSecondary}]}>
            {formatSubscribers(item.subscribers)} members
          </Text>
        </View>
        <Text style={[styles.chevron, {color: colors.textSecondary}]}>›</Text>
      </TouchableOpacity>
    ),
    [colors, handleSubredditPress],
  );

  const keyExtractor = useCallback((item: Subreddit) => item.id, []);

  if (popularError && debouncedQuery.length === 0) {
    return (
      <ErrorView
        message="Could not load subreddits."
        onRetry={refetch}
      />
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Search bar */}
      <View
        style={[
          styles.searchBarWrapper,
          {backgroundColor: colors.surface, borderBottomColor: colors.border},
        ]}>
        <View
          style={[styles.searchBar, {backgroundColor: colors.surfaceVariant}]}>
          <Text style={[styles.searchIcon, {color: colors.textSecondary}]}>
            🔍
          </Text>
          <TextInput
            style={[styles.searchInput, {color: colors.text}]}
            placeholder="Search subreddits..."
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={handleQueryChange}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setDebouncedQuery('');
              }}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Text style={[styles.clearIcon, {color: colors.textSecondary}]}>
                ✕
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <FlatList
          data={subreddits}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListHeaderComponent={
            <Text style={[styles.sectionHeader, {color: colors.textSecondary}]}>
              {debouncedQuery.length > 1 ? 'Search Results' : 'Popular Subreddits'}
            </Text>
          }
          contentContainerStyle={{paddingBottom: insets.bottom + 16}}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchBarWrapper: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  clearIcon: {
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  subredditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  subredditAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  subredditInfo: {
    flex: 1,
  },
  subredditName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  subscribers: {
    fontSize: 13,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '300',
  },
});
