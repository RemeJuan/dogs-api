import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  root: __dirname,
  plugins: [tsconfigPaths()],
  test: {
    name: 'web',
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    coverage: {
      reportsDirectory: '../../coverage/apps/web',
      include: ['src/**/*.{ts,tsx,js,jsx}'],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.spec.{ts,tsx,js,jsx}',
        'src/**/*.d.ts',
        'src/**/assets/**',
        'src/main.*',
        'src/app/**',
        'src/components/**',
        'src/pages/**',
        'src/theme/**',
      ],
    },
  },
});
