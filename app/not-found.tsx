// Not found view, rendered when a route or a resource id is outside the
// published dataset.

export default function NotFound() {
  return (
    <div className="card-surface p-10 text-center">
      <p className="text-sm uppercase tracking-[0.16em] text-cyan-300">Not found</p>
      <h1 className="mt-2 text-2xl font-semibold text-white">This view is not available</h1>
      <p className="mt-2 text-sm text-slate-400">The resource or page you requested is outside the current published dataset.</p>
    </div>
  );
}
