import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/lib/test-setup.ts"],
    css: true,
    exclude: ["e2e/**", "node_modules/**"],

    // Coverage configuration (enabled via --coverage flag)
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
        "src/**/__tests__/**",
        "src/vite-env.d.ts",
        "src/main.tsx",
        "src/**/index.ts",
        "src/**/types.ts",
        "src/**/*.d.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
        // Per-file thresholds can be overridden below
        perFile: false,
      },
    },

    // Run tests sequentially for deterministic results
    sequence: {
      shuffle: false,
    },

    // Clean up mocks between tests
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },
});
