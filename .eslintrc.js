module.exports = {
  root: true,
  extends: '@react-native-community',
  plugins: ['sort-keys-fix'],
  rules: {
    'react-native/no-inline-styles': 0,
    'lines-between-class-members': ['error', 'always'],
    'sort-keys-fix/sort-keys-fix': 'error',
  },
};
