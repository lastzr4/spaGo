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

function slugify(input) {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "terapis"
  );
}

async function backfillTherapistSlugs() {
  // Nullable `slug` column lets `prisma db push` add it without data loss on
  // existing rows; this fills in a real value for any therapist missing one.
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const missing = await prisma.therapist.findMany({
      where: { slug: null },
      select: { id: true, name: true },
    });
    if (missing.length === 0) return;

    console.log(`[migrate] Backfilling slug for ${missing.length} therapist(s)...`);
    for (const t of missing) {
      const base = slugify(t.name);
      let candidate = base;
      let attempt = 1;
      // eslint-disable-next-line no-await-in-loop
      while (await prisma.therapist.findFirst({ where: { slug: candidate }, select: { id: true } })) {
        attempt += 1;
        candidate = `${base}-${attempt}`;
      }
      // eslint-disable-next-line no-await-in-loop
      await prisma.therapist.update({ where: { id: t.id }, data: { slug: candidate } });
      console.log(`[migrate]   ${t.id} -> ${candidate}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn("[migrate] DATABASE_URL is not set. Skipping `prisma db push`.");
    return;
  }

  run("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"]);
  await backfillTherapistSlugs();

  console.log("[migrate] Database schema is up to date.");
}

main().catch((err) => {
  console.error("[migrate] Unexpected error:", err);
  process.exit(1);
});
