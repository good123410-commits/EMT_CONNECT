const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

const projectRoot = __dirname;
const reanimatedWebShim = path.resolve(projectRoot, 'src/shims/react-native-reanimated.web.ts');
const nativeSourcePattern = /\.native\.(tsx|ts|jsx|js)$/;
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

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver = {
  ...config.resolver,
  blockList: new RegExp(
    blockPatterns.map((pattern) => `(?:${pattern.source})`).join('|'),
  ),
  resolveRequest: (context, moduleName, platform) => {
    if (platform === 'web') {
      if (
        moduleName === 'react-native-reanimated' ||
        moduleName.startsWith('react-native-reanimated/')
      ) {
        return {
          filePath: reanimatedWebShim,
          type: 'sourceFile',
        };
      }
    }

    const resolved =
      typeof defaultResolveRequest === 'function'
        ? defaultResolveRequest(context, moduleName, platform)
        : context.resolveRequest(context, moduleName, platform);

    if (platform === 'web' && resolved?.type === 'sourceFile' && resolved.filePath) {
      const normalized = resolved.filePath.replace(/\\/g, '/');
      if (nativeSourcePattern.test(normalized)) {
        return { type: 'empty' };
      }
    }

    return resolved;
  },
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
