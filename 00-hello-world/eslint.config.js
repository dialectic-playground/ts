// ESLint flat config: the recommended JavaScript rules plus typescript-eslint's strict,
// type-checked rule sets for the TypeScript sources in src/.
import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig({ ignores: ["dist/", "node_modules/"] }, eslint.configs.recommended, {
  files: ["**/*.ts"],
  extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
  languageOptions: {
    parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
  },
  rules: {
    // node:test's describe/it return promises that the test runner itself awaits.
    "@typescript-eslint/no-floating-promises": [
      "error",
      {
        allowForKnownSafeCalls: [
          { from: "package", package: "node:test", name: ["describe", "it", "test"] },
        ],
      },
    ],
  },
});
