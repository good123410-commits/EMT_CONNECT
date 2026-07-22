module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [require.resolve('babel-preset-expo'), { jsxImportSource: 'nativewind' }],
      require.resolve('nativewind/babel'),
    ],
    plugins: [
      [
        require.resolve('babel-plugin-module-resolver'),
        {
          root: ['.'],
          alias: {
            '@': './src',
          },
        },
      ],
      // Reanimated 4 delegates to worklets — must remain the final Babel plugin.
      require.resolve('react-native-worklets/plugin'),
    ],
  };
};
