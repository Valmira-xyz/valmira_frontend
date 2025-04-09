import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import eslintPluginUnusedImports from 'eslint-plugin-unused-imports';
import eslintPluginPrettier from 'eslint-plugin-prettier';

// Common TypeScript rules
const commonTsRules = {
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      vars: 'all',
      varsIgnorePattern: '^_',
      args: 'after-used',
      argsIgnorePattern: '^_',
    },
  ],
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/no-explicit-any': 'off',
  '@typescript-eslint/no-non-null-assertion': 'off',
};

// React hooks rules
const reactHooksRules = {
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
};

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'dist',
      'node_modules',
      'coverage',
      '.husky',
      'cdk.out',
      'src/web-ui-kit/',
    ],
  },

  // Base configuration
  {
    extends: [js.configs.recommended, prettier],
  },

  // JavaScript files
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended, prettier],
    ignores: ['infra/jest.config.js'],
  },

  // TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended, prettier],
    plugins: {
      react: eslintPluginReact,
      'simple-import-sort': eslintPluginSimpleImportSort,
      'unused-imports': eslintPluginUnusedImports,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...commonTsRules,
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^react'],
            ['^\\u0000'], // Side effects
            ['^[^@]', '^@?\\w'], // External packages
            ['^(@|components)(/.*|$)'], // Internal packages
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'], // Parent imports
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'], // Other relative imports
            ['^.+\\.?(css)$'], // Style imports
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'jsx-a11y/anchor-has-content': 'off',
    },
  },

  // Application code with type-checking
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.test.{ts,tsx}', 'src/test/**/*'],
    extends: [...tseslint.configs.recommendedTypeChecked, prettier],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json'],
        tsconfigRootDir: '.',
      },
    },
    plugins: {
      react: eslintPluginReact,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'simple-import-sort': eslintPluginSimpleImportSort,
      'unused-imports': eslintPluginUnusedImports,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...commonTsRules,
      ...reactHooksRules,
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^react'],
            ['^\\u0000'],
            ['^[^@]', '^@?\\w'],
            ['^(@|components)(/.*|$)'],
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            ['^.+\\.?(css)$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      'no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'jsx-a11y/anchor-has-content': 'off',
    },
  },

  // Infrastructure TypeScript files without type-checking
  {
    files: ['infra/**/*.ts'],
    ignores: ['infra/test/**/*'],
    extends: [...tseslint.configs.recommended, prettier],
    rules: commonTsRules,
  },

  // Test files
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**/*.ts', 'infra/test/**/*.ts'],
    extends: [prettier],
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.jest,
      },
    },
    rules: {
      ...commonTsRules,
      ...reactHooksRules,
    },
  },

  // Config files
  {
    files: ['*.config.ts', '.storybook/**/*.ts', 'vitest.config.ts'],
    extends: [prettier],
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      ...commonTsRules,
      ...reactHooksRules,
    },
  },

  // Stories files override
  {
    files: ['*.stories.tsx'],
    rules: {
      'no-console': 'off',
    },
  }
);
