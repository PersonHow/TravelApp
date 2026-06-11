/** @type {import('tailwindcss').Config} */
// 設計 token 對應 v2 設計檔 + 使用者指定的 9 色色票系列
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  // 用 class 模式管暗色（之後手動切 .dark），不要用系統 media query
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Noto Sans TC 之後再透過 expo-font 載入，先 fallback 系統字
        sans: ['System'],
      },
      colors: {
        // 主色：v2 設計檔實際採用的(從 palette 加深以滿足對比)
        accent: {
          DEFAULT: '#6c7bd6',
          ink: '#ffffff',
          soft: '#e9eafd',
          2: '#ef7a8e',
        },
        // 中性
        ink: '#322f54',
        muted: '#8c89a8',
        surface: '#ffffff',
        'surface-2': '#f1f1fb',
        line: '#ececf6',
        bg: '#f6f6fc',

        // 暗色模式（之後切換時使用）
        dark: {
          bg: '#16142a',
          surface: '#211e3c',
          'surface-2': '#2b2750',
          ink: '#efeefb',
          muted: '#a39fc8',
          line: '#332e58',
          accent: '#a8c0ff',
        },

        // 行程項目類別色（spot/food/shop）
        cat: {
          spot: '#5a8fcf',
          food: '#ef7a8e',
          shop: '#9a7fd6',
          move: '#8c89a8',
        },

        // 使用者指定的 9 色「色票系列」(palette source)
        palette: {
          red: '#ffadad',
          peach: '#ffd6a5',
          cream: '#fdffb6',
          mint: '#caffbf',
          sky: '#9bf6ff',
          blue: '#a0c4ff',
          lavender: '#bdb2ff',
          pink: '#ffc6ff',
          white: '#fffffc',
        },
      },
      borderRadius: {
        card: '14px',
        'card-lg': '18px',
      },
    },
  },
  plugins: [],
}
