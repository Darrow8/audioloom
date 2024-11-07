// // Learn more https://docs.expo.io/guides/customizing-metro
// const { getDefaultConfig } = require('expo/metro-config');

// /** @type {import('expo/metro-config').MetroConfig} */
// const config = getDefaultConfig(__dirname);

// module.exports = config;


const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Add shared directory to watchFolders
config.watchFolders = [
  ...config.watchFolders || [],
  path.resolve(workspaceRoot, 'shared')
];

// Add shared directory to resolver
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Add custom resolver for @shared alias
config.resolver.extraNodeModules = {
  '@shared': path.resolve(workspaceRoot, 'shared/src'),
};

module.exports = config;