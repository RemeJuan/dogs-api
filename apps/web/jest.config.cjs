const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  displayName: 'web',
  rootDir: '../../',
  roots: ['<rootDir>/apps/web'],
  testMatch: ['<rootDir>/apps/web/**/__tests__/**/*.spec.[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mts', 'mjs', 'cts', 'cjs', 'html'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [require.resolve('ts-jest'), { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  }
};
