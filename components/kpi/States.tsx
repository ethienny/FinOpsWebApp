import { Inbox, AlertTriangle } from "lucide-react";

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
      <Inbox className="h-8 w-8 text-slate-500" />
      <p className="mt-3 text-sm font-medium text-slate-200">{title}</p>
      {detail ? <p className="mt-1 max-w-md text-xs text-slate-400">{detail}</p> : null}
    </div>
  );
}

export function ErrorState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/5 px-6 py-16 text-center">
      <AlertTriangle className="h-8 w-8 text-rose-300" />
      <p className="mt-3 text-sm font-medium text-rose-100">{title}</p>
      {detail ? <p className="mt-1 max-w-md text-xs text-rose-200/80">{detail}</p> : null}
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-navy-800" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-navy-800" />
      <div className="h-64 rounded-2xl bg-navy-800" />
    </div>
  );
}
