const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const {
    resolver: { sourceExts, assetExts },
  } = config;

  config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  };

  config.resolver = {
    ...config.resolver,
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
    blockList: [
      /backend\/.*/,
      /node_modules\/.*\/backend\/.*/,
    ],
  };

  // Exclude backend from watch folders
  config.watchFolders = config.watchFolders || [];

  return config;
})();

