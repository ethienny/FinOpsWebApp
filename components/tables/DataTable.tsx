"use client";

// Generic client table used by every page. It receives plain rows and column
// descriptors, then handles search, per column filters, sorting and pagination
// in the browser. Heavy work is memoized, so callers should pass stable
// column and searchKey references.

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/kpi/States";
import { cn } from "@/lib/cn";
import { useDictionary } from "@/lib/i18n/LocaleProvider";

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
  rowKey,
  searchPlaceholder,
}: {
  rows: T[];
  columns: Column<T>[];
  searchKeys?: Array<keyof T>;
  pageSize?: number;
  rowKey?: (row: T) => string;
  searchPlaceholder?: string;
}) {
  const dict = useDictionary();
  const placeholder = searchPlaceholder ?? dict.common.table.searchPlaceholder;
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [colFilters, setColFilters] = useState<Record<string, string>>({});

  /** Distinct values offered by each filterable column. */
  const filterValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const col of columns) {
      if (!col.filterable) continue;
      const values = new Set<string>();
      for (const row of rows) {
        const value = String((row as Record<string, unknown>)[col.key] ?? "");
        if (value) values.add(value);
      }
      map[col.key] = [...values].sort();
    }
    return map;
  }, [rows, columns]);

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
    setPage(0);
  }

  if (!rows.length) return <EmptyState title={dict.common.table.noRows} />;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-xl border border-white/10 bg-navy-900 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-400/40 placeholder:text-slate-500 focus:ring-2 sm:max-w-xs"
        />
        <p className="text-xs text-slate-400">{dict.common.table.rowsCount.replace("{count}", String(filtered.length))}</p>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(col.numeric && "text-right")}
                  aria-sort={sortKey === col.key ? (dir === "asc" ? "ascending" : "descending") : "none"}
                >
                  <button type="button" onClick={() => toggleSort(col.key)} className="hover:text-cyan-200">
                    {col.header}
                    {sortKey === col.key ? (dir === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                  {col.filterable ? (
                    <select
                      aria-label={dict.common.table.filterAriaLabel.replace("{column}", col.header)}
                      className="mt-1 block w-full rounded border border-white/10 bg-navy-900 px-1 py-0.5 text-[11px] font-normal normal-case tracking-normal text-slate-300"
                      value={colFilters[col.key] ?? ""}
                      onChange={(e) => {
                        setColFilters((s) => ({ ...s, [col.key]: e.target.value }));
                        setPage(0);
                      }}
                    >
                      <option value="">{dict.common.table.allOption}</option>
                      {(filterValues[col.key] ?? []).map((v) => (
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
              <tr key={rowKey ? rowKey(row) : i}>
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
          {dict.common.table.previous}
        </button>
        <span>
          {safePage + 1} / {pages}
        </span>
        <button
          className="rounded-lg border border-white/10 px-2 py-1 disabled:opacity-40"
          disabled={safePage >= pages - 1}
          onClick={() => setPage((p) => p + 1)}
        >
          {dict.common.table.next}
        </button>
      </div>
    </div>
  );
}
