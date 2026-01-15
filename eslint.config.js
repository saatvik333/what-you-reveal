const globals = require('globals');
const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'always-multiline'],
      'arrow-spacing': 'error',
      'no-multi-spaces': 'error',
      'object-curly-spacing': ['error', 'always'],
    },
  },
  {
    // Override for Node.js backend files that use CommonJS
    files: ['server.js', 'routes/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
    rules: {
      'no-console': 'off', // Allow console logs in server
    },
  },
];
