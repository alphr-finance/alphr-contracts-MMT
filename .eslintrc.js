module.exports = {
  parser: "@typescript-eslint/parser",
  env: {
    browser: true,
    jest: true,
  },
  extends: [
    "prettier",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended",
    "plugin:jest/recommended",
  ],
  plugins: ["prettier", "@typescript-eslint", "jest"],
  settings: {
    "import/extensions": [".js", ".jsx", ".ts", ".tsx"],
    "import/parsers": {
      "@typescript-eslint/parser": [".js", ".jsx", ".ts", ".tsx"],
    },
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
      },
    },
  },
  rules: {
    "prettier/prettier": ["error", { singleQuote: false, endOfLine: "auto" }],
    "import/extensions": [0],
    "prefer-destructuring": ["error", { object: true, array: false }],
    "no-negated-condition": "error",
    "no-use-before-define": "off",
    "@typescript-eslint/no-use-before-define": ["error"],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error"],
    "import/prefer-default-export": "off",
    "no-param-reassign": "off",
    "no-shadow": "off",
    "no-implicit-coercion": [
      "error",
      {
        boolean: true,
        number: true,
        string: true,
        allow: [],
      },
    ],
    "jest/valid-expect": "off",
  },
  ignorePatterns: ["/dist/*", "/coverage/*", "/lib/*"],
};
