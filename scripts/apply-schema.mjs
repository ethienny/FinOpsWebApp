// ============================================================================
// Aplica infra/sql/schema.sql no Azure SQL Database. Rode uma única vez,
// logo após o provisionamento do banco (antes de scripts/migrate-to-sql.mjs).
//
// Uso:
//   node --env-file=.env.local scripts/apply-schema.mjs
// ============================================================================

import { readFileSync } from "fs";
import { join } from "path";
import sql from "mssql";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ${name} não definida.`);
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
    console.log("Aplicando infra/sql/schema.sql...");
    await pool.request().batch(schema);
    console.log("Schema criado com sucesso.");
  } finally {
    await pool.close();
  }
}

main().catch((err) => {
  console.error("Falha ao aplicar o schema:", err);
  process.exit(1);
});
