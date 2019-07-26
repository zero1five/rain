module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
    'ecmaFeatures': {
      'experimentalObjectRestSpread': true,
      'jsx': true,
      'arrowFunctions': true,
      'classes': true,
      'modules': true,
      'defaultParams': true,
      'legacyDecorators': true
    },
  },
  parser: 'babel-eslint',
  env: {
    node: true,
    es6: true
  },
  extends: ['prettier', 'plugin:prettier/recommended'],
  plugins: ['prettier', 'react'],
  rules: {
    'prettier/prettier': 'error'
  }
}
