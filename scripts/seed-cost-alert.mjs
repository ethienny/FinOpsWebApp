// ============================================================================
// Cria as tabelas do Cost Alert Report (se ainda não existirem) e popula com
// os dados fictícios de uma semana, no Azure SQL Database. Pode ser rodado
// de novo com segurança (schema é IF NOT EXISTS, seed faz TRUNCATE antes).
//
// Uso:
//   node --env-file=.env.local scripts/seed-cost-alert.mjs
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
  const schema = readFileSync(join(process.cwd(), "infra", "sql", "cost-alert-schema.sql"), "utf8");
  const seed = readFileSync(join(process.cwd(), "infra", "sql", "seed-cost-alert-sample.sql"), "utf8");

  const pool = await sql.connect({
    server: requireEnv("AZURE_SQL_SERVER"),
    database: requireEnv("AZURE_SQL_DATABASE"),
    user: requireEnv("AZURE_SQL_USER"),
    password: requireEnv("AZURE_SQL_PASSWORD"),
    port: Number(process.env.AZURE_SQL_PORT ?? 1433),
    options: { encrypt: true, trustServerCertificate: false },
    requestTimeout: 120000,
    connectionTimeout: 60000,
  });

  try {
    console.log("Aplicando infra/sql/cost-alert-schema.sql...");
    await pool.request().batch(schema);
    console.log("Schema do Cost Alert Report pronto.");

    console.log("Populando com infra/sql/seed-cost-alert-sample.sql...");
    await pool.request().batch(seed);
    console.log("Dados de amostra inseridos com sucesso.");
  } finally {
    await pool.close();
  }
}

main().catch((err) => {
  console.error("Falha ao popular o Cost Alert Report:", err);
  process.exit(1);
});
