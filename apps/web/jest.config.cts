const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  displayName: 'web',
  rootDir: '../../',
  roots: ['<rootDir>/apps/web'],
  testMatch: ['<rootDir>/apps/web/**/__tests__/**/*.spec.[jt]s?(x)'],
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'mts',
    'mjs',
    'cts',
    'cjs',
    'html',
  ],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [
      require.resolve('ts-jest'),
      { tsconfig: '<rootDir>/tsconfig.spec.json' },
    ],
  },
  // Coverage settings
  collectCoverage: true,
  collectCoverageFrom: [
    '<rootDir>/apps/web/src/**/*.{ts,tsx,js,jsx}',
    '!<rootDir>/apps/web/src/**/__tests__/**',
    '!<rootDir>/apps/web/src/**/*.spec.{ts,tsx,js,jsx}',
    '!<rootDir>/apps/web/src/**/*.d.ts',
    '!<rootDir>/apps/web/src/**/assets/**',
    // Exclude top-level app and page UI code until we add component tests
    '!<rootDir>/apps/web/src/main.*',
    '!<rootDir>/apps/web/src/app/**',
    '!<rootDir>/apps/web/src/components/**',
    '!<rootDir>/apps/web/src/pages/**',
    '!<rootDir>/apps/web/src/theme/**',
  ],
  coverageDirectory: '../../coverage/apps/web',
  coverageReporters: ['text', 'lcov', 'html'],
};
