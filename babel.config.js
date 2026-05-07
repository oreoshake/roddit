module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@store': './src/store',
          '@services': './src/services',
          '@navigation': './src/navigation',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@types': './src/types',
        },
      },
    ],
  ],
};
