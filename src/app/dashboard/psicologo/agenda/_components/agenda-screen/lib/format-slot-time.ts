/** Formata instante ISO (UTC) para relógio local no fuso informado (ou fuso do navegador). */
export function formatSlotTime(iso: string, timeZone?: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const opts: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" };
  if (timeZone) opts.timeZone = timeZone;
  return d.toLocaleTimeString("pt-BR", opts);
}
