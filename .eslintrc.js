module.exports = {
  root: true,
  extends: [
    '@react-native',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_'
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-var-requires': 'off', // Allow require() in React Native project
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/display-name': 'off',
    'react/no-unescaped-entities': 'off',
    'react/no-unknown-property': 'off',
    'no-case-declarations': 'off',
    'no-catch-shadow': 'off', // Legacy rule, not needed in modern code
    'no-undef': 'off', // TypeScript handles this better
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    // Relax rules for test files
    {
      files: ['**/__tests__/**/*', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'src/__tests__/**/*'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-console': 'off',
        'react/display-name': 'off',
      },
    },
    // Relax rules for example/demo files
    {
      files: ['docs/**/*', '**/examples/**/*', '**/*.example.{ts,tsx}'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
    // Relax rules for scripts and tooling
    {
      files: ['scripts/**/*', 'e2e/**/*', '**/__mocks__/**/*', '**/fixtures/**/*'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
        'no-undef': 'off',
      },
    },
    // Allow console in service files (intentional logging)
    {
      files: ['src/services/**/*', 'src/utils/**/*'],
      rules: {
        'no-console': 'off',
      },
    },
    // Relax React Native component rules
    {
      files: ['src/components/**/*', 'src/screens/**/*'],
      rules: {
        'react/display-name': 'off',
        'react/no-unescaped-entities': 'off',
        'react/no-unknown-property': 'off',
      },
    },
  ],
};
