// Reads the Databricks SQL seed of the cost anomaly weekly report. Only the
// INSERT statements are read; CREATE TABLE gives the column names. Run as a
// script it writes the seed tables as CSV into data/ and compressed copies
// into data/mock; generate-anomaly-mock.mjs imports parseSeed to build the
// richer year long mock on top of the same rows.
//
// Usage:
//   node scripts/anomaly-seed-to-csv.mjs [path/to/seed.sql]

import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { writeTableCsv } from "./csv-mock.mjs";

export const SEED_PATH = join(process.cwd(), "data", "seeds", "anomaly_weekly_report_sample.sql");
export const TABLES = ["anomaly_history", "weekly_report_coverage", "weekly_report_stats", "subscription_contacts"];

/** Strips line comments outside string literals. */
function stripComments(sql) {
  let out = "";
  let inString = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'") inString = !inString;
    if (!inString && ch === "-" && sql[i + 1] === "-") {
      while (i < sql.length && sql[i] !== "\n") i++;
      out += "\n";
      continue;
    }
    out += ch;
  }
  return out;
}

function columnsOf(sql, table) {
  const match = sql.match(new RegExp(`CREATE TABLE ${table} \\(([^;]*?)\\)\\s*(USING DELTA)?\\s*;`, "i"));
  if (!match) throw new Error(`CREATE TABLE ${table} nao encontrado no seed.`);
  return match[1]
    .split(",")
    .map((line) => line.trim().split(/\s+/)[0])
    .filter(Boolean);
}

/** Reads the value tuples of every INSERT INTO the table. */
function tuplesOf(sql, table) {
  const rows = [];
  const pattern = new RegExp(`INSERT INTO ${table} VALUES`, "gi");
  let match;
  while ((match = pattern.exec(sql))) {
    let i = match.index + match[0].length;
    while (i < sql.length && sql[i] !== ";") {
      if (sql[i] === "(") {
        const [tuple, next] = readTuple(sql, i + 1);
        rows.push(tuple);
        i = next;
      } else {
        i++;
      }
    }
  }
  return rows;
}

/** One tuple: quoted strings keep their text, TIMESTAMP and DATE prefixes are dropped. */
function readTuple(sql, start) {
  const values = [];
  let i = start;
  let current = "";
  const push = () => {
    values.push(current.trim());
    current = "";
  };
  while (i < sql.length) {
    const ch = sql[i];
    if (ch === "'") {
      let j = i + 1;
      while (j < sql.length && sql[j] !== "'") current += sql[j++];
      i = j + 1;
      continue;
    }
    if (ch === ",") {
      push();
      i++;
      continue;
    }
    if (ch === ")") {
      push();
      return [values, i + 1];
    }
    const keyword = sql.slice(i).match(/^(TIMESTAMP|DATE)\b/i);
    if (keyword) {
      i += keyword[0].length;
      continue;
    }
    current += ch;
    i++;
  }
  throw new Error("Tupla sem fechamento no seed.");
}

/** Tables of the seed as { columns, rows } with rows keyed by column name. */
export function parseSeed(seedPath = SEED_PATH) {
  const sql = stripComments(readFileSync(seedPath, "utf8"));
  const result = {};
  for (const table of TABLES) {
    const columns = columnsOf(sql, table);
    const rows = tuplesOf(sql, table).map((tuple) => {
      if (tuple.length !== columns.length) throw new Error(`${table}: linha com ${tuple.length} valores, esperava ${columns.length}.`);
      return Object.fromEntries(columns.map((c, i) => [c, tuple[i]]));
    });
    result[table] = { columns, rows };
  }
  return result;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const seed = parseSeed(process.argv[2] ?? SEED_PATH);
  for (const table of TABLES) {
    const { columns, rows } = seed[table];
    await writeTableCsv(table, columns, rows);
  }
}
