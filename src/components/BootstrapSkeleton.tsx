/** Placeholder estilo Bootstrap (substitui Skeleton shadcn). */
export function BootstrapSkeleton({
  height = "1rem",
  className = "",
}: {
  height?: string | number;
  className?: string;
}) {
  const h = typeof height === "number" ? `${height}px` : height;
  return (
    <div className={`placeholder-glow ${className}`.trim()} aria-hidden>
      <span className="placeholder col-12 rounded w-100 d-block" style={{ minHeight: h }} />
    </div>
  );
}
