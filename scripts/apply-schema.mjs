// Applies infra/sql/schema.sql to the Azure SQL Database. Run it once, right
// after the database is provisioned and before scripts/migrate-to-sql.mjs.
//
// Usage:
//   node --env-file=.env.local scripts/apply-schema.mjs

import { readFileSync } from "fs";
import { join } from "path";
import sql from "mssql";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is not set.`);
  return value;
}

async function main() {
  const schema = readFileSync(join(process.cwd(), "infra", "sql", "schema.sql"), "utf8");

  const pool = await sql.connect({
    server: requireEnv("AZURE_SQL_SERVER"),
    database: requireEnv("AZURE_SQL_DATABASE"),
    user: requireEnv("AZURE_SQL_USER"),
    password: requireEnv("AZURE_SQL_PASSWORD"),
    port: Number(process.env.AZURE_SQL_PORT ?? 1433),
    options: { encrypt: true, trustServerCertificate: false },
  });

  try {
    console.log("Applying infra/sql/schema.sql...");
    await pool.request().batch(schema);
    console.log("Schema created.");
  } finally {
    await pool.close();
  }
}

main().catch((err) => {
  console.error("Failed to apply the schema:", err);
  process.exit(1);
});
