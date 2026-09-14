// Restores the local mock CSVs from the compressed copies versioned in
// data/mock. The plain CSVs are not tracked by git, so a fresh clone runs
// this before the app can read data in csv mode. Runs automatically before
// "npm run dev". A file is extracted when it is missing or when its archive
// is newer than it, which is what a git pull with new mock data produces;
// --force rewrites every file.
//
// Usage:
//   node scripts/restore-mock-data.mjs [--force]

import { createReadStream, createWriteStream, existsSync, mkdirSync, readdirSync, statSync } from "fs";
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

function isStale(archivePath, target) {
  if (!existsSync(target)) return true;
  return statSync(archivePath).mtimeMs > statSync(target).mtimeMs;
}

for (const archive of archives) {
  const archivePath = join(MOCK_DIR, archive);
  const target = join(DATA_DIR, archive.replace(/\.gz$/, ""));
  if (!force && !isStale(archivePath, target)) continue;
  await pipeline(createReadStream(archivePath), createGunzip(), createWriteStream(target));
  restored += 1;
  console.log(`restaurado data/${archive.replace(/\.gz$/, "")}`);
}

if (restored === 0) console.log(`Dados mock ja atualizados em data/ (${archives.length} arquivos). Use --force para regravar.`);
