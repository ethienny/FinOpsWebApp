// Shared helper of the mock generators: writes a table as data/<table>.csv
// and stores the compressed copy in data/mock so a fresh clone restores it.

import { createReadStream, createWriteStream, writeFileSync } from "fs";
import { join } from "path";
import { pipeline } from "stream/promises";
import { createGzip } from "zlib";
import Papa from "papaparse";

const DATA_DIR = join(process.cwd(), "data");
const MOCK_DIR = join(DATA_DIR, "mock");

export async function writeTableCsv(table, columns, rows) {
  const csv = Papa.unparse({ fields: columns, data: rows.map((r) => columns.map((c) => r[c] ?? "")) }, { newline: "\n" });
  const target = join(DATA_DIR, `${table}.csv`);
  writeFileSync(target, csv + "\n");
  await pipeline(createReadStream(target), createGzip(), createWriteStream(join(MOCK_DIR, `${table}.csv.gz`)));
  console.log(`${table}: ${rows.length} linhas -> data/${table}.csv e data/mock/${table}.csv.gz`);
}
