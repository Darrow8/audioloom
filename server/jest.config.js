// jest.config.js
export default {
  preset: 'ts-jest/presets/default-esm', // Use ESM presets
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  transformIgnorePatterns: [
    // Allow transformation of node-fetch and other ESM modules
    'node_modules/(?!(node-fetch)/)',
  ],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // Map module paths to avoid extension issues
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
