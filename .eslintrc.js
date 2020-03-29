module.exports = {
  root: true,
  extends: '@react-native-community',
  plugins: ['sort-keys-fix', 'typescript-sort-keys'],
  rules: {
    'lines-between-class-members': ['error', 'always'],
    '@typescript-eslint/member-ordering': 2,
    'react/prefer-stateless-function': 2,
    'react-native/no-inline-styles': 0,
    'react/no-direct-mutation-state': 2,
    'sort-keys-fix/sort-keys-fix': 'error',
    'typescript-sort-keys/string-enum': 2,
    'react/no-this-in-sfc': 2,
  },
};
