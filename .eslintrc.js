module.exports = {
  root: true,
  env: { node: true },
  extends: ["plugin:vue/essential", "@vue/prettier", "@vue/typescript"],
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-implicit-coercion":
      process.env.NODE_ENV === "production" ? "error" : "warn",
    "max-len": ["warn", 80, 2, { ignoreUrls: true }]
  },
  parserOptions: { parser: "@typescript-eslint/parser" }
};
