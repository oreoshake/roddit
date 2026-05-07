import React from 'react';
import {Text} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useTheme} from '../components/common/ThemeProvider';
import {useAuthStore} from '../store/authStore';

import {LoginScreen} from '../screens/LoginScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {SubredditScreen} from '../screens/SubredditScreen';
import {PostDetailScreen} from '../screens/PostDetailScreen';
import {ExploreScreen} from '../screens/ExploreScreen';
import {ProfileScreen} from '../screens/ProfileScreen';

import type {
  RootStackParamList,
  HomeStackParamList,
  ExploreStackParamList,
  ProfileStackParamList,
  MainTabParamList,
} from '../types';

// ─── Stack navigators ─────────────────────────────────────────────────────────

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ExploreStack = createNativeStackNavigator<ExploreStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// ─── Home Stack ───────────────────────────────────────────────────────────────

function HomeStackNavigator(): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: colors.surface},
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerBackTitleVisible: false,
      }}>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{title: 'Roddit'}}
      />
      <HomeStack.Screen
        name="Subreddit"
        component={SubredditScreen}
        options={({route}) => ({title: `r/${route.params.subredditName}`})}
      />
      <HomeStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{title: 'Post'}}
      />
    </HomeStack.Navigator>
  );
}

// ─── Explore Stack ────────────────────────────────────────────────────────────

function ExploreStackNavigator(): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <ExploreStack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: colors.surface},
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerBackTitleVisible: false,
      }}>
      <ExploreStack.Screen
        name="Explore"
        component={ExploreScreen}
        options={{title: 'Explore'}}
      />
      <ExploreStack.Screen
        name="Subreddit"
        component={SubredditScreen as React.ComponentType<object>}
        options={({route}) => ({
          title: `r/${(route.params as {subredditName: string}).subredditName}`,
        })}
      />
      <ExploreStack.Screen
        name="PostDetail"
        component={PostDetailScreen as React.ComponentType<object>}
        options={{title: 'Post'}}
      />
    </ExploreStack.Navigator>
  );
}

// ─── Profile Stack ────────────────────────────────────────────────────────────

function ProfileStackNavigator(): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: colors.surface},
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}>
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{title: 'Profile'}}
      />
    </ProfileStack.Navigator>
  );
}

// ─── Tab icon helper ──────────────────────────────────────────────────────────

function TabIcon({
  focused,
  color,
  label,
}: {
  focused: boolean;
  color: string;
  label: string;
}): React.JSX.Element {
  const icons: Record<string, {active: string; inactive: string}> = {
    Home: {active: '🏠', inactive: '🏡'},
    Explore: {active: '🧭', inactive: '🔍'},
    Profile: {active: '👤', inactive: '👤'},
  };
  const icon = icons[label] ?? {active: '●', inactive: '○'};
  return (
    <Text style={{fontSize: 22, color}}>{focused ? icon.active : icon.inactive}</Text>
  );
}

// ─── Main Tab Navigator ───────────────────────────────────────────────────────

function MainNavigator(): React.JSX.Element {
  const {colors} = useTheme();

  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {fontSize: 11, fontWeight: '500'},
      }}>
      <MainTab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: props => <TabIcon {...props} label="Home" />,
        }}
      />
      <MainTab.Screen
        name="ExploreTab"
        component={ExploreStackNavigator}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: props => <TabIcon {...props} label="Explore" />,
        }}
      />
      <MainTab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: props => <TabIcon {...props} label="Profile" />,
        }}
      />
    </MainTab.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────

export function RootNavigator(): React.JSX.Element {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const {colors} = useTheme();

  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.background},
      }}>
      {isAuthenticated ? (
        <RootStack.Screen name="Main" component={MainNavigator} />
      ) : (
        <RootStack.Screen name="Login" component={LoginScreen} />
      )}
    </RootStack.Navigator>
  );
}

// StyleSheet import needed for the hairlineWidth reference above
import {StyleSheet} from 'react-native';
