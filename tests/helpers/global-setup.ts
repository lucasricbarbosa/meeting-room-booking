import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

const TEST_DATABASE_URL = "file:./test.db";

// Builds the test database from the same migrations the app uses, once per `vitest run`.
export default function setup() {
  rmSync("test.db", { force: true });
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
