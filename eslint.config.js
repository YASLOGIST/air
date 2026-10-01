import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage', 'eslint.config.js'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Test files: describe/it/expect are imported from vitest, jsdom globals
    // are provided by the environment.
    files: ['**/*.test.{ts,tsx}', 'src/test/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        vi: 'readonly',
      },
    },
    rules: {
      'no-empty-pattern': 'off',
    },
  },
  {
    // Build scripts run under Node.
    files: ['scripts/**/*.mjs', 'vite.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    // i18n.tsx / theme.tsx are provider+hook+dictionary modules by design:
    // splitting the 900-line dictionary out would cost more than Fast
    // Refresh buys for two leaf files. Scoped, documented exemption.
    files: ['src/lib/i18n.tsx', 'src/lib/theme.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
);
