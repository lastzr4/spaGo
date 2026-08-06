#!/usr/bin/env node
/**
 * Ensures the database schema is in sync with prisma/schema.prisma before
 * the application starts accepting traffic.
 *
 * Railway's preDeployCommand init containers run in the background and do
 * not reliably block app startup on failure, so instead we run the schema
 * push as part of the actual startup sequence (see the "start" script in
 * package.json).
 */
const { spawnSync } = require("child_process");

function run(command, args) {
  console.log(`[migrate] Running: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    console.error(`[migrate] Failed to execute ${command}:`, result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`[migrate] Command exited with status ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

if (!process.env.DATABASE_URL) {
  console.warn(
    "[migrate] DATABASE_URL is not set. Skipping `prisma db push`."
  );
  process.exit(0);
}

run("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"]);

console.log("[migrate] Database schema is up to date.");
