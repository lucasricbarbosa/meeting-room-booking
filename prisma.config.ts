import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Not env(): it throws when the variable is missing, and `prisma generate` runs in CI without a .env.
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
