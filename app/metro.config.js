const path = require('path');
const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getSentryExpoConfig(projectRoot);

// Add shared directory to watchFolders
config.watchFolders = [
  ...(config.watchFolders || []),
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