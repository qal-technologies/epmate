module.exports = {
  root: true,
  extends: [ 'plugin:@typescript-eslint/recommended', '@react-native' ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    "eqeqeq": [ "error", "always" ],
    "no-magic-numbers": "warn",
    "no-unused-vars": "error"
  },
  plugins: [ '@typescript-eslint' ],
};
