// ESLint：TypeScript 推薦規則 + Prettier（關掉與排版工具衝突的格式規則）
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  env: { node: true, es2022: true },
  ignorePatterns: ['dist', 'node_modules'],
  rules: {
    // 底線開頭參數視為刻意不用（如 Express errorHandler 必須收 4 個參數的 _next）
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
}
