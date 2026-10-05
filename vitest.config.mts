import { defineConfig } from "vitest/config";

// Set here (not in the npm script) so it works on every OS without cross-env;
// Vitest workers inherit the env of this process. Mirrors the UTC servers in CI/production.
process.env.TZ = "UTC";

export default defineConfig({
  // Resolves the "@/*" alias from tsconfig.json, so tests import like the app does.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
