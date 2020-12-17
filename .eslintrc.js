module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true
  },
  extends: [
    "standard"
  ],
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
    quotes: ["warn", "double", { avoidEscape: true, allowTemplateLiterals: false }],
    semi: ["error", "always"],
    "no-useless-escape": "off"
  }
};
