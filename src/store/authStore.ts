import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {USE_MOCK} from '../config';
import {MOCK_USER} from '../services/mockData';
import type {User} from '../types';

interface AuthStoreState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthStoreActions {
  setTokens: (
    accessToken: string,
    refreshToken: string,
    expiresAt: number,
  ) => void;
  setUser: (user: User) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  isTokenExpired: () => boolean;
}

type AuthStore = AuthStoreState & AuthStoreActions;

const INITIAL_STATE: AuthStoreState = USE_MOCK
  ? {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 365, // 1 year
      user: MOCK_USER,
      isAuthenticated: true,
    }
  : {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      isAuthenticated: false,
    };

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setTokens: (
        accessToken: string,
        refreshToken: string,
        expiresAt: number,
      ) => {
        set({
          accessToken,
          refreshToken,
          expiresAt,
          isAuthenticated: true,
        });
      },

      setUser: (user: User) => {
        set({user});
      },

      logout: () => {
        set({...INITIAL_STATE});
      },

      isTokenExpired: () => {
        if (USE_MOCK) {
          return false;
        }
        const {expiresAt} = get();
        if (!expiresAt) {
          return true;
        }
        return Date.now() >= expiresAt - 60_000;
      },

      refreshAccessToken: async () => {
        const {refreshToken} = get();
        if (!refreshToken) {
          get().logout();
          return false;
        }

        try {
          const params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          });

          const response = await fetch(
            'https://www.reddit.com/api/v1/access_token',
            {
              method: 'POST',
              headers: {
                Authorization:
                  'Basic ' +
                  btoa(
                    `${process.env.REDDIT_CLIENT_ID ?? 'YOUR_CLIENT_ID'}:`,
                  ),
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: params.toString(),
            },
          );

          if (!response.ok) {
            get().logout();
            return false;
          }

          const data = (await response.json()) as {
            access_token: string;
            expires_in: number;
            refresh_token?: string;
          };

          const expiresAt = Date.now() + data.expires_in * 1000;
          set({
            accessToken: data.access_token,
            // Some flows return a new refresh token
            refreshToken: data.refresh_token ?? refreshToken,
            expiresAt,
            isAuthenticated: true,
          });

          return true;
        } catch {
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'roddit-auth',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist token data; isAuthenticated is derived on rehydration
      partialize: state => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => state => {
        if (state) {
          // Re-derive isAuthenticated based on persisted token data
          const hasToken = Boolean(state.accessToken);
          const notExpired =
            state.expiresAt != null && Date.now() < state.expiresAt;
          state.isAuthenticated = hasToken && notExpired;
        }
      },
    },
  ),
);
