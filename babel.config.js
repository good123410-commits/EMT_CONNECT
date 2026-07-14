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
      require.resolve('react-native-reanimated/plugin'),
    ],
  };
};
