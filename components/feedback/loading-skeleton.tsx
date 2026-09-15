export function LoadingSkeleton() {
  return <div aria-label="Cargando contenido" className="animate-pulse space-y-3 p-5">{Array.from({ length: 5 }, (_, index) => <div className="h-12 rounded-lg bg-slate-800" key={index} />)}</div>;
}
