import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolves the `@/*` alias from tsconfig.json (built into Vite 8).
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // axe runs on full page containers exceed the 5s default under full-suite
    // parallel load (they take ~0.3–2.5s alone).
    testTimeout: 20_000,
  },
});
