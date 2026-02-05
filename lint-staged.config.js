/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.{js,ts,tsx,vue}': ['eslint --fix'],
}
