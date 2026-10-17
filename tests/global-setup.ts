import { execSync } from "node:child_process";

// Builds a throw-away SQLite schema (prisma/test.db, gitignored) for the DB-backed tests.
export default function setup() {
  execSync("npx prisma db push --skip-generate --force-reset --accept-data-loss", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
}
