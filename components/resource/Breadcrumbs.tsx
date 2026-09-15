// Breadcrumb trail of the resource detail view.

import Link from "next/link";
import { useDictionary } from "@/lib/i18n/LocaleProvider";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  const dict = useDictionary();
  return (
    <nav aria-label={dict.resources.detail.breadcrumbNavAria} className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-2">
          {i > 0 ? <span className="text-slate-600">/</span> : null}
          {item.href ? (
            <Link className="hover:text-cyan-200" href={item.href}>
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-200">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
