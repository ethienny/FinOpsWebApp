// Converts the Databricks SQL seed of the cost anomaly weekly report into the
// CSV files the app reads in csv mode, then stores compressed copies in
// data/mock so a fresh clone restores them with the other datasets. Only the
// INSERT statements are read; CREATE TABLE gives the column names.
//
// Usage:
//   node scripts/anomaly-seed-to-csv.mjs [path/to/seed.sql]

import { createReadStream, createWriteStream, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { pipeline } from "stream/promises";
import { createGzip } from "zlib";
import Papa from "papaparse";

const DATA_DIR = join(process.cwd(), "data");
const MOCK_DIR = join(DATA_DIR, "mock");
const seedPath = process.argv[2] ?? join(DATA_DIR, "seeds", "anomaly_weekly_report_sample.sql");

const TABLES = ["anomaly_history", "weekly_report_coverage", "weekly_report_stats", "subscription_contacts"];

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
function rowsOf(sql, table) {
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
      let text = "";
      while (j < sql.length && sql[j] !== "'") text += sql[j++];
      current += text;
      i = j + 1;
      continue;
    }
    if (ch === "," ) {
      push();
      i++;
      continue;
    }
    if (ch === ")") {
      push();
      return [values, i + 1];
    }
    if (!/^(TIMESTAMP|DATE)$/i.test(sql.slice(i, i + 9).split(/\s/)[0])) current += ch;
    else i += sql.slice(i).match(/^(TIMESTAMP|DATE)/i)[0].length - 1;
    i++;
  }
  throw new Error("Tupla sem fechamento no seed.");
}

const sql = stripComments(readFileSync(seedPath, "utf8"));
for (const table of TABLES) {
  const columns = columnsOf(sql, table);
  const rows = rowsOf(sql, table);
  for (const row of rows) {
    if (row.length !== columns.length) throw new Error(`${table}: linha com ${row.length} valores, esperava ${columns.length}.`);
  }
  const csv = Papa.unparse({ fields: columns, data: rows }, { newline: "\n" });
  const target = join(DATA_DIR, `${table}.csv`);
  writeFileSync(target, csv + "\n");
  await pipeline(createReadStream(target), createGzip(), createWriteStream(join(MOCK_DIR, `${table}.csv.gz`)));
  console.log(`${table}: ${rows.length} linhas -> data/${table}.csv e data/mock/${table}.csv.gz`);
}
