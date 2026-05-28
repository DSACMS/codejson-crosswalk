// @ts-check
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["dist/**", "docs/**", "node_modules/**"],
  },
  ...tseslint.configs.recommended,
  prettierConfig,
);
