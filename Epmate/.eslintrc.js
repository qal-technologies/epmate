module.exports = {
  root: true,
  extends: ['@react-native-community', 'plugin:@typescript-eslint/recommended', '@react-native'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {},
};
