import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "node_modules/**",
    "test-results/**",
    "playwright-report/**",
    ".scratch/**",
    "next-env.d.ts",
  ]),
]);
