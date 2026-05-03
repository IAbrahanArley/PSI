"use server";

import { getPublicCatalogSpecialtyOptions } from "./get-public-specialty-options";

/**
 * Lista de nomes de especialidades no catálogo ativo (ordem igual às options).
 * @deprecated Preferir {@link getPublicCatalogSpecialtyOptions} com slug + nome.
 */
export async function getPublicSpecialtyLabels(): Promise<string[]> {
  const opts = await getPublicCatalogSpecialtyOptions();
  return opts.map((o) => o.name);
}
