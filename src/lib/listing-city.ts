/** Igual ao filtro SQL `lower(trim(psychologists.city))` para cidade. */
export function normalizeListingCity(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const t = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return t.length ? t : null;
}
