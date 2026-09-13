// Restores the local mock CSVs from the compressed copies versioned in
// data/mock. The plain CSVs are not tracked by git, so a fresh clone runs
// this before the app can read data in csv mode. Runs automatically before
// "npm run dev" and skips files that already exist unless --force is given.
//
// Usage:
//   node scripts/restore-mock-data.mjs [--force]

import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import { pipeline } from "stream/promises";
import { createGunzip } from "zlib";

const DATA_DIR = join(process.cwd(), "data");
const MOCK_DIR = join(DATA_DIR, "mock");
const force = process.argv.includes("--force");

if (!existsSync(MOCK_DIR)) {
  console.error(`Pasta ${MOCK_DIR} nao encontrada.`);
  process.exit(1);
}

mkdirSync(DATA_DIR, { recursive: true });
const archives = readdirSync(MOCK_DIR).filter((name) => name.endsWith(".csv.gz"));
let restored = 0;

for (const archive of archives) {
  const target = join(DATA_DIR, archive.replace(/\.gz$/, ""));
  if (existsSync(target) && !force) continue;
  await pipeline(createReadStream(join(MOCK_DIR, archive)), createGunzip(), createWriteStream(target));
  restored += 1;
  console.log(`restaurado data/${archive.replace(/\.gz$/, "")}`);
}

if (restored === 0) console.log(`Dados mock ja presentes em data/ (${archives.length} arquivos). Use --force para regravar.`);
