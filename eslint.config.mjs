import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier/flat";
import tailwindcss from "eslint-plugin-tailwindcss";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...compat.extends("airbnb-base"),
  tailwindcss.configs.recommended,
  {
    settings: {
      tailwindcss: {
        cssConfigPath: "./app/globals.css",
      },
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      camelcase: "off",
      "import/extensions": "off",
      "import/no-extraneous-dependencies": "off",
      "import/prefer-default-export": "off",
      "no-undef": "off",
      "tailwindcss/no-custom-classname": "off",
    },
  },
  prettierConfig,
]);

export default eslintConfig;
