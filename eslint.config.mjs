import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
      },
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        process: "readonly",
        MAIN_WINDOW_VITE_DEV_SERVER_URL: "readonly",
        MAIN_WINDOW_VITE_NAME: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        setTimeout: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "no-empty": ["error", { allowEmptyCatch: true }],
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ["src/preload.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["src/renderer/src/components/ui/**"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["vite.*.ts", "forge.config.ts"],
  },
];
