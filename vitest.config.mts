import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Set here (not in the npm script) so it works on every OS without cross-env;
// Vitest workers inherit the env of this process. Mirrors the UTC servers in CI/production.
process.env.TZ = "UTC";

export default defineConfig({
  resolve: {
    // Resolves the "@/*" alias from tsconfig.json, so tests import like the app does.
    tsconfigPaths: true,
    alias: {
      "server-only": fileURLToPath(
        new URL("./tests/helpers/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Set before any test imports src/server/db.ts, which reads it at import time.
    env: { DATABASE_URL: "file:./test.db" },
    globalSetup: ["tests/helpers/global-setup.ts"],
    // Integration test files share one SQLite file, so they must not run at the same time.
    fileParallelism: false,
  },
});
