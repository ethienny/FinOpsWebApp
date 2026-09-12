"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/kpi/States";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  header: string;
  numeric?: boolean;
  filterable?: boolean;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
}

export function DataTable<T extends object>({
  rows,
  columns,
  searchKeys,
  pageSize = 12,
  onRowClick,
}: {
  rows: T[];
  columns: Column<T>[];
  searchKeys?: Array<keyof T>;
  pageSize?: number;
  onRowClick?: (row: T) => void;
}) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [colFilters, setColFilters] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    let next = rows;
    if (q.trim()) {
      const needle = q.toLowerCase();
      next = next.filter((row) => {
        if (searchKeys?.length) {
          return searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(needle));
        }
        return Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(needle));
      });
    }
    for (const [key, value] of Object.entries(colFilters)) {
      if (!value) continue;
      next = next.filter((row) => String((row as Record<string, unknown>)[key] ?? "") === value);
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      next = [...next].sort((a, b) => {
        const av = col?.sortValue ? col.sortValue(a) : (a as Record<string, unknown>)[sortKey];
        const bv = col?.sortValue ? col.sortValue(b) : (b as Record<string, unknown>)[sortKey];
        if (typeof av === "number" && typeof bv === "number") return dir === "asc" ? av - bv : bv - av;
        return dir === "asc" ? String(av ?? "").localeCompare(String(bv ?? "")) : String(bv ?? "").localeCompare(String(av ?? ""));
      });
    }
    return next;
  }, [rows, q, colFilters, sortKey, dir, columns, searchKeys]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setDir("desc");
    }
  }

  if (!rows.length) return <EmptyState title="No rows in the current scope." />;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Search resources..."
          className="w-full rounded-xl border border-white/10 bg-navy-900 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-400/40 placeholder:text-slate-500 focus:ring-2 sm:max-w-xs"
        />
        <p className="text-xs text-slate-400">{filtered.length} rows</p>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={cn(col.numeric && "text-right")}>
                  <button type="button" onClick={() => toggleSort(col.key)} className="hover:text-cyan-200">
                    {col.header}
                    {sortKey === col.key ? (dir === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                  {col.filterable ? (
                    <select
                      className="mt-1 block w-full rounded border border-white/10 bg-navy-900 px-1 py-0.5 text-[11px] font-normal normal-case tracking-normal text-slate-300"
                      value={colFilters[col.key] ?? ""}
                      onChange={(e) => {
                        setColFilters((s) => ({ ...s, [col.key]: e.target.value }));
                        setPage(0);
                      }}
                    >
                      <option value="">All</option>
                      {[...new Set(rows.map((r) => String((r as Record<string, unknown>)[col.key] ?? "")).filter(Boolean))]
                        .sort()
                        .map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                    </select>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn(col.numeric && "num")}>
                    {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2 text-xs text-slate-400">
        <button
          className="rounded-lg border border-white/10 px-2 py-1 disabled:opacity-40"
          disabled={safePage === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Previous
        </button>
        <span>
          {safePage + 1} / {pages}
        </span>
        <button
          className="rounded-lg border border-white/10 px-2 py-1 disabled:opacity-40"
          disabled={safePage >= pages - 1}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
