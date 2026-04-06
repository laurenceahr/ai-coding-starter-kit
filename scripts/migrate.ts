import { Pool } from "pg";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.log("[migrate] DATABASE_URL not set, skipping migrations.");
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    // Create migrations tracking table (idempotent)
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Read all .sql files from migrations/, sorted by name
    const migrationsDir = join(process.cwd(), "migrations");
    const files = (await readdir(migrationsDir))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("[migrate] No migration files found.");
      return;
    }

    // Get already-executed migrations
    const { rows: executed } = await client.query(
      "SELECT name FROM _migrations"
    );
    const executedSet = new Set(executed.map((r) => r.name));

    let applied = 0;

    for (const file of files) {
      if (executedSet.has(file)) {
        continue;
      }

      const sql = await readFile(join(migrationsDir, file), "utf-8");

      console.log(`[migrate] Running ${file}...`);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [
          file,
        ]);
        await client.query("COMMIT");
        console.log(`[migrate] ✓ ${file}`);
        applied++;
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`[migrate] ✗ ${file} failed:`, err);
        throw err;
      }
    }

    if (applied === 0) {
      console.log("[migrate] Database is up to date.");
    } else {
      console.log(`[migrate] Applied ${applied} migration(s).`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("[migrate] Fatal error:", err);
  process.exit(1);
});
