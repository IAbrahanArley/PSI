/** Remove tudo que não for dígito (para persistir no banco) */
export function stripPhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Máscara telefone BR: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 * Aplica enquanto o usuário digita.
 */
export function formatBrazilPhone(value: string): string {
  const d = stripPhoneDigits(value).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
