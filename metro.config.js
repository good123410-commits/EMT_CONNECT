const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);
const originalBlockList = config.resolver.blockList;

// Reduce Metro crawl/watch pressure on Windows (editor caches, sibling web app, etc.).
const ignorePatterns = [
  /\.cursor[\\/].*/,
  /[\\/]web[\\/]node_modules[\\/].*/,
  /[\\/]web[\\/]\.next[\\/].*/,
  /[\\/]web[\\/]dist[\\/].*/,
  /[\\/]agent-tools[\\/].*/,
  /[\\/]agent-transcripts[\\/].*/,
];

const blockPatterns = [
  ...(originalBlockList instanceof RegExp ? [originalBlockList] : []),
  ...ignorePatterns,
];

config.resolver = {
  ...config.resolver,
  blockList: new RegExp(
    blockPatterns.map((pattern) => `(?:${pattern.source})`).join('|'),
  ),
};

// Worklets/Reanimated need inlineRequires on web — eager imports break JSI init.
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = wrapWithReanimatedMetroConfig(
  withNativeWind(config, { input: './src/global.css' }),
);
