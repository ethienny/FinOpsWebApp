// Vitest configuration. Mirrors the "@/" path alias from tsconfig so tests
// import modules the same way the app does.

import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["lib/**/*.test.ts"],
  },
});
