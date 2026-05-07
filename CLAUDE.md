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

1. Clone the repository
2. Install dependencies: `yarn install`
3. Install iOS dependencies: `cd ios && pod install` (iOS only)
4. Register the app on Reddit (https://www.reddit.com/prefs/apps)
5. Add your Reddit app credentials to environment variables or config file
6. Run on iOS: `yarn ios`
7. Run on Android: `yarn android`

## Contributing

- Follow the established code style
- Write tests for new features
- Update documentation as needed
- Use meaningful commit messages

## License

This project is licensed under the MIT License - see the LICENSE file for details.