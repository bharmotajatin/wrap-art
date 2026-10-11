export default function Loading() {
  return <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-3xl bg-black/10" />)}</div>;
}
