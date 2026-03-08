/* eslint-disable import/order */
const js = require('@eslint/js');
const globals = require('globals');
const importPlugin = require('eslint-plugin-import');
const jsxA11yPlugin = require('eslint-plugin-jsx-a11y');
const prettierConfig = require('eslint-config-prettier');
const promisePlugin = require('eslint-plugin-promise');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const securityPlugin = require('eslint-plugin-security');

module.exports = [
  // 1. Global ignores
  {
    ignores: [
      'node_modules/**',
      '.webpack/**',
      'out/**',
      'dist/**',
      'build/**',
      '**/*.min.js',
      'src/renderer/dist/**',
      '**/dist/**',
      'package-lock.json',
    ],
  },

  // 2. Base configuration with modern standards
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.commonjs,
        ...globals.es2021,
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      import: importPlugin,
      promise: promisePlugin,
      security: securityPlugin,
    },
    rules: {
      // --- CORE JS RULES (Enhanced) ---
      ...js.configs.recommended.rules,
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-console': 'off',
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'curly': ['error', 'all'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-wrappers': 'error',

      // --- REACT RULES ---
      ...reactPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'warn',
      'react/self-closing-comp': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/no-unescaped-entities': 'off',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-fragments': ['error', 'syntax'],

      // --- REACT HOOKS ---
      ...reactHooksPlugin.configs.recommended.rules,

      // --- ACCESSIBILITY (A11y) ---
      ...jsxA11yPlugin.configs.recommended.rules,

      // --- PROMISES ---
      ...promisePlugin.configs.recommended.rules,

      // --- SECURITY ---
      ...securityPlugin.configs.recommended.rules,
      'security/detect-object-injection': 'off', // Too noisy for this project
      'security/detect-non-literal-fs-filename': 'off', // Inherent to save-dialog usage
      'security/detect-non-literal-require': 'off', // Used for dynamic loading in some parts

      // --- IMPORT ORGANIZATION ---
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',
      'import/newline-after-import': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx'],
        },
      },
    },
  },

  // 3. Prettier override (Must be last)
  prettierConfig,
];


