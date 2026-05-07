import React, {useCallback, useEffect} from 'react';
import {
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from '../components/common/ThemeProvider';
import {useRedditAuth} from '../hooks/useRedditAuth';

export function LoginScreen(): React.JSX.Element {
  const {colors} = useTheme();
  const {initiateOAuth, handleCallback} = useRedditAuth();

  // Listen for the OAuth redirect deep-link
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({url}) => {
      if (url.startsWith('roddit://oauth')) {
        handleCallback(url).catch(console.error);
      }
    });

    // Handle case where the app was launched from the deep-link
    Linking.getInitialURL().then(url => {
      if (url && url.startsWith('roddit://oauth')) {
        handleCallback(url).catch(console.error);
      }
    });

    return () => subscription.remove();
  }, [handleCallback]);

  const handleLogin = useCallback(async () => {
    try {
      await initiateOAuth();
    } catch (err) {
      console.error('[Login] OAuth initiation failed:', err);
    }
  }, [initiateOAuth]);

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Logo / Branding */}
      <View style={styles.brandSection}>
        <View
          style={[styles.logoCircle, {backgroundColor: colors.primary}]}>
          <Text style={styles.logoText}>R</Text>
        </View>
        <Text style={[styles.appName, {color: colors.text}]}>Roddit</Text>
        <Text style={[styles.tagline, {color: colors.textSecondary}]}>
          The front page of the internet
        </Text>
      </View>

      {/* Login */}
      <View style={styles.loginSection}>
        <TouchableOpacity
          style={[styles.loginButton, {backgroundColor: colors.primary}]}
          onPress={handleLogin}
          activeOpacity={0.85}>
          <Text style={styles.loginButtonText}>Continue with Reddit</Text>
        </TouchableOpacity>

        <Text style={[styles.disclaimer, {color: colors.textSecondary}]}>
          By continuing, you agree to Reddit's{' '}
          <Text
            style={{color: colors.primary}}
            onPress={() =>
              Linking.openURL('https://www.reddit.com/help/useragreement')
            }>
            User Agreement
          </Text>{' '}
          and{' '}
          <Text
            style={{color: colors.primary}}
            onPress={() =>
              Linking.openURL('https://www.reddit.com/help/privacypolicy')
            }>
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  brandSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    textAlign: 'center',
  },
  loginSection: {
    gap: 16,
  },
  loginButton: {
    paddingVertical: 16,
    borderRadius: 32,
    alignItems: 'center',
    shadowColor: '#FF4500',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
