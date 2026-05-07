# Roddit - Cross-Platform Reddit Client

## Project Overview

Roddit is a cross-platform mobile application built with React Native that provides a modern, intuitive interface for browsing Reddit. The app allows users to explore subreddits, view posts, read comments, and interact with the Reddit community from both iOS and Android devices.

## Tech Stack

- **Framework**: React Native 0.72+
- **Language**: JavaScript/TypeScript
- **State Management**: Zustand with custom hooks
- **Navigation**: React Navigation
- **Networking**: Axios with React Query
- **Data Persistence**: AsyncStorage for offline caching
- **Dependency Management**: yarn
- **Minimum Versions**: iOS 11.0+, Android API 21+

## Key Features

### Core Functionality
- Browse and search subreddits
- View posts in various formats (text, images, links, videos)
- Read comments
- Upvote/downvote posts and comments
- Subscribe/unsubscribe to subreddits
- User authentication via Reddit OAuth
- Personalized feed with subscribed subreddits

### Advanced Features
- Offline reading capabilities
- Push notifications for new posts/comments
- Dark mode support
- Customizable themes
- Image and video preview
- Link sharing
- Search within subreddits
- User profile management
- Read status tracking for posts (mark as read/unread, filter read posts)
- Comment sorting (best, controversial, etc.)

## Architecture

### Zustand State Management
- **Stores**: Feature-based Zustand stores for different domains
- **API Layer**: React Query for API calls and caching
- **Components**: Functional components with Zustand hooks

### Service Layer
- **RedditAPIService**: Handles all Reddit API interactions with React Query
- **AuthenticationService**: Manages OAuth flow and user sessions
- **CacheService**: Manages offline data storage and read status tracking

### Key Components
- **NavigationContainer**: App navigation structure
- **ImageLoader**: Asynchronous image loading and caching
- **ThemeProvider**: Dark/light mode and theming support

## Reddit API Integration

### Authentication
- OAuth 2.0 flow using Reddit's API
- Token refresh handling
- User session management

### Endpoints Used
- `/subreddits/popular` - Popular subreddits
- `/r/{subreddit}/hot` - Hot posts in a subreddit
- `/r/{subreddit}/new` - New posts in a subreddit
- `/comments/{post_id}` - Comments for a post
- `/api/vote` - Voting on posts/comments
- `/api/subscribe` - Subscribe/unsubscribe to subreddits

### Rate Limiting
- Respect Reddit's API rate limits (600 requests per 10 minutes for userless, 600 per minute for authenticated)
- Implement exponential backoff for retries

## Development Guidelines

### Code Style
- Follow JavaScript/TypeScript best practices and ESLint rules
- Use meaningful variable and function names
- Prefer const over let, avoid var
- Use TypeScript interfaces and types for type safety
- Follow React Native component naming conventions

### Error Handling
- Use try/catch for async operations
- Implement proper error boundaries for React components
- Provide user-friendly error messages and loading states
- Handle network errors gracefully with retry mechanisms

### Testing
- Unit tests for hooks, utilities, and services
- Component tests for critical UI components
- Integration tests for API calls
- Mock services and AsyncStorage for testing

### Performance
- Optimize image loading and caching with react-native-fast-image
- Implement pagination and virtualization for large lists
- Use React.memo and useMemo for expensive computations
- Profile memory usage and avoid memory leaks

## Project Structure

```
Roddit/
├── android/                    # Android native code
├── ios/                        # iOS native code
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── common/            # Shared components
│   │   ├── posts/             # Post-related components
│   │   └── comments/          # Comment components
│   ├── screens/               # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── SubredditScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── store/                 # Zustand stores
│   │   ├── authStore.ts       # Authentication state
│   │   ├── postsStore.ts      # Posts and read status state
│   │   └── index.ts
│   ├── services/              # API and utility services
│   │   ├── api.ts
│   │   └── storage.ts
│   ├── navigation/            # Navigation configuration
│   ├── hooks/                 # Custom React hooks
│   ├── utils/                 # Utility functions
│   └── types/                 # TypeScript type definitions
├── assets/                    # Images, fonts, etc.
├── App.tsx                    # Main app component
├── index.js                   # Entry point
└── package.json
```

## Third-Party Dependencies

- **zustand**: Lightweight state management
- **zustand/middleware**: Zustand middleware for persistence
- **@react-navigation/native**: Navigation framework
- **@react-native-async-storage/async-storage**: Local storage
- **axios**: HTTP client
- **react-query**: Data fetching and caching
- **react-native-vector-icons**: Icons
- **react-native-fast-image**: Optimized image loading

## Security Considerations

- Store OAuth tokens securely using Keychain (iOS) and Keystore (Android)
- Implement certificate pinning for API calls
- Validate all user inputs
- Handle sensitive data appropriately
- Use secure storage for user credentials

## Future Enhancements

- iPad support with split-view interface
- Widget support for home screen
- Siri integration for voice commands
- Advanced moderation tools
- Cross-platform support (macOS, watchOS)

## Getting Started

The `ios/` and `android/` native directories are not committed. Generate them once with the React Native CLI before running the app.

1. Install the React Native CLI: `npm install -g @react-native-community/cli`
2. Generate native projects: `npx react-native init RodditNative --skip-install`, then copy the generated `ios/` and `android/` folders into this repo (or run `npx react-native build-ios` / `build-android` after wiring up the bundle entry)
   — **Shortcut**: `npx create-react-native-app` can scaffold native dirs in-place if you have Xcode / Android Studio set up.
3. Install JS dependencies: `yarn install`
4. Install iOS CocoaPods: `cd ios && pod install` (requires Xcode + CocoaPods)
5. To develop with mock data (no Reddit credentials needed): `src/config.ts` already has `USE_MOCK = true`
6. To use real Reddit data: register an app at https://www.reddit.com/prefs/apps, then set `USE_MOCK = false` in `src/config.ts` and add your `CLIENT_ID` to `src/hooks/useRedditAuth.ts`
7. Run on iOS: `yarn ios`
8. Run on Android: `yarn android`

## Contributing

- Follow the established code style
- Write tests for new features
- Update documentation as needed
- Use meaningful commit messages

## License

This project is licensed under the MIT License - see the LICENSE file for details.