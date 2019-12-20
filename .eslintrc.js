module.exports = {
  root: true,
  extends: '@react-native-community',
  plugins: ['sort-keys-fix'],
  rules: {
    'react-native/no-inline-styles': 0,
    'sort-keys-fix/sort-keys-fix': 'error',
  },
};
