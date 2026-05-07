import {useCallback, useRef} from 'react';
import {Linking, Platform} from 'react-native';
import {useAuthStore} from '../store/authStore';
import {getCurrentUser} from '../services/api';
import {
  buildOAuthUrl,
  generateState,
  parseCallbackUrl,
  REDDIT_SCOPES,
} from '../utils/reddit';

// Replace with your actual Reddit app credentials (from environment or config)
const CLIENT_ID = process.env.REDDIT_CLIENT_ID ?? 'YOUR_CLIENT_ID';
const REDIRECT_URI =
  Platform.OS === 'ios'
    ? 'roddit://oauth/callback'
    : 'roddit://oauth/callback';

export interface RedditAuthHook {
  initiateOAuth: () => Promise<void>;
  handleCallback: (url: string) => Promise<boolean>;
  exchangeCodeForTokens: (code: string) => Promise<boolean>;
}

export function useRedditAuth(): RedditAuthHook {
  const {setTokens, setUser} = useAuthStore();
  const pendingState = useRef<string | null>(null);

  const initiateOAuth = useCallback(async () => {
    const state = generateState();
    pendingState.current = state;

    const authUrl = buildOAuthUrl(CLIENT_ID, REDIRECT_URI, REDDIT_SCOPES, state);
    const canOpen = await Linking.canOpenURL(authUrl);
    if (canOpen) {
      await Linking.openURL(authUrl);
    } else {
      throw new Error('Cannot open Reddit OAuth URL');
    }
  }, []);

  const exchangeCodeForTokens = useCallback(
    async (code: string): Promise<boolean> => {
      try {
        const params = new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
        });

        const response = await fetch(
          'https://www.reddit.com/api/v1/access_token',
          {
            method: 'POST',
            headers: {
              Authorization: 'Basic ' + btoa(`${CLIENT_ID}:`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
          },
        );

        if (!response.ok) {
          return false;
        }

        const data = (await response.json()) as {
          access_token: string;
          refresh_token: string;
          expires_in: number;
          token_type: string;
          scope: string;
        };

        const expiresAt = Date.now() + data.expires_in * 1000;
        setTokens(data.access_token, data.refresh_token, expiresAt);

        // Fetch and store user profile
        try {
          const user = await getCurrentUser();
          setUser(user);
        } catch {
          // Non-fatal: user info can be fetched later
        }

        return true;
      } catch {
        return false;
      }
    },
    [setTokens, setUser],
  );

  const handleCallback = useCallback(
    async (url: string): Promise<boolean> => {
      const parsed = parseCallbackUrl(url);
      if (!parsed) {
        return false;
      }

      // CSRF check: state must match what we sent
      if (pendingState.current && parsed.state !== pendingState.current) {
        console.warn('[Auth] OAuth state mismatch — possible CSRF');
        return false;
      }

      pendingState.current = null;
      return exchangeCodeForTokens(parsed.code);
    },
    [exchangeCodeForTokens],
  );

  return {initiateOAuth, handleCallback, exchangeCodeForTokens};
}
