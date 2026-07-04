export default {
  name: '万古长夜',
  slug: 'wangu-game-3d',
  version: '1.0.0',
  orientation: 'landscape',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  scheme: 'wangu-game',
  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
    backgroundColor: '#0A0A0F',
  },
  plugins: [
    'expo-router',
  ],
  experiments: {
    typedRoutes: true,
  },
};
