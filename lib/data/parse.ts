// Parsing and aggregation helpers for the CSV and SQL rows: typed value
// parsers, sums, distinct values, grouped sums and the resource id encoding
// used in URLs.

export function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const raw = String(value ?? "").trim().toLowerCase();
  return raw === "true" || raw === "1" || raw === "yes";
}

export function parseJson(value: unknown): unknown {
  if (value !== null && typeof value === "object") return value;
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(raw.replace(/""/g, '"'));
    } catch {
      return raw;
    }
  }
}

export function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function sum(values: Array<number | null | undefined>): number {
  return values.reduce<number>((acc, v) => acc + (typeof v === "number" && Number.isFinite(v) ? v : 0), 0);
}

export function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((v) => asString(v)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function groupSum<T>(
  rows: T[],
  keyFn: (row: T) => string,
  valueFn: (row: T) => number | null | undefined,
  limit?: number,
): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = keyFn(row) || "Unassigned";
    map.set(key, (map.get(key) ?? 0) + (valueFn(row) ?? 0));
  }
  const items = [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  return typeof limit === "number" ? items.slice(0, limit) : items;
}

export function hasAllocationTag(owner?: string, costCenter?: string): boolean {
  const o = asString(owner);
  const c = asString(costCenter);
  return Boolean(o) || Boolean(c);
}

export function encodeResourceId(resourceId: string): string {
  const bytes = new TextEncoder().encode(resourceId);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const ENCODED_RESOURCE_ID = /^[A-Za-z0-9_-]{1,1024}$/;

/** Decodes a resource id from a URL segment, or returns an empty string when the segment is not base64url. */
export function decodeResourceId(encoded: string): string {
  if (!ENCODED_RESOURCE_ID.test(encoded)) return "";
  return Buffer.from(encoded, "base64url").toString("utf8");
}
