module.exports = function(api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: ["nativewind/babel",
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': '.',
            '@shared': '../shared/src',
          },
        },
      ],
      ["module:react-native-dotenv", {
        "envName": "APP_ENV",
        "moduleName": "@env",
        "path": ".env",
        "safe": false,
        "allowUndefined": true,
      }]
    ],
  };
};