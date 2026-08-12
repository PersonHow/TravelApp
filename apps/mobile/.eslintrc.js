// ESLint：Expo 官方規則 + Prettier（關掉與排版工具衝突的格式規則）
module.exports = {
  root: true,
  extends: ['expo', 'prettier'],
  ignorePatterns: ['dist', '.expo', 'node_modules'],
  // 覆蓋 expo 預設的 typescript resolver（monorepo 下裝不進相容版本會 crash）
  // 路徑解析正確性交給 tsc（npm run type-check），ESLint 用 node resolver 即可
  // 注意要放在 overrides（expo 是在 *.ts/*.tsx 的 overrides 裡設 resolver，頂層 settings 蓋不掉）
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
      settings: {
        'import/resolver': { node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] } },
      },
    },
    // 設定檔跑在 Node 環境（__dirname、module 等全域）
    {
      files: ['*.config.js', '.eslintrc.js'],
      env: { node: true },
    },
  ],
}
