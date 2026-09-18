import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve the "@/*" path alias from tsconfig.json natively (Vite 4+).
    tsconfigPaths: true,
    alias: {
      // `server-only` exists to throw when a module is pulled into a client bundle, and
      // it cannot tell a test runner from one. Swapped for an empty module so the
      // server-side API client can be imported (and mocked) under vitest; the guard still
      // does its job in the real build, which is where it matters.
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: false,
  },
});
