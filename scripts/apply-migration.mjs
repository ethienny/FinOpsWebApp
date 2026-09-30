// Applies a single .sql file under infra/sql/migrations/ to the Azure SQL
// Database. Each migration script is expected to be idempotent (safe to run
// more than once).
//
// Usage:
//   node --env-file=.env.local scripts/apply-migration.mjs <file-name>.sql

import { readFileSync } from "fs";
import { join } from "path";
import sql from "mssql";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is not set.`);
  return value;
}

async function main() {
  const fileName = process.argv[2];
  if (!fileName) {
    console.error("Usage: node scripts/apply-migration.mjs <file-name>.sql");
    process.exit(1);
  }

  const migration = readFileSync(join(process.cwd(), "infra", "sql", "migrations", fileName), "utf8");

  const pool = await sql.connect({
    server: requireEnv("AZURE_SQL_SERVER"),
    database: requireEnv("AZURE_SQL_DATABASE"),
    user: requireEnv("AZURE_SQL_USER"),
    password: requireEnv("AZURE_SQL_PASSWORD"),
    port: Number(process.env.AZURE_SQL_PORT ?? 1433),
    options: { encrypt: true, trustServerCertificate: false },
  });

  try {
    console.log(`Applying infra/sql/migrations/${fileName}...`);
    const result = await pool.request().batch(migration);
    if (result?.recordsets?.length) {
      for (const rs of result.recordsets) console.log(rs);
    }
    console.log("Migration batch completed.");
  } finally {
    await pool.close();
  }
}

main().catch((err) => {
  console.error("Failed to apply the migration:", err);
  process.exit(1);
});
