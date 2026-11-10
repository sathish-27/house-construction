import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: process.env.TURSO_DATABASE_URL ? "turso" : "sqlite",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_PATH || "./data/construction.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
