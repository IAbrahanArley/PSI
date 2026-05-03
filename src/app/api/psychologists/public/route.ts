import { NextResponse } from "next/server";
import { getPublicPsychologists } from "@/actions/psychologists/get-public-psychologists";
import { normalizeListingCity } from "@/lib/listing-city";

/**
 * Lista pública de psicólogos para a home (ordem aleatória a cada request).
 * Exclui REJECTED e INACTIVE.
 *
 * Query: ?limit=4 (padrão 4, máx 100)
 * ?especialidade=slug-catalogo (ou label legado)
 * ?cidade=key (lower(trim) da cidade cadastrada)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number.parseInt(searchParams.get("limit") ?? "4", 10);
  const especialidade = searchParams.get("especialidade");
  const cidadeRaw = searchParams.get("cidade");
  const city = normalizeListingCity(cidadeRaw);
  const hasSpecialtyFilter = !!(especialidade?.trim()) && especialidade!.trim().toLowerCase() !== "todos";
  const order = hasSpecialtyFilter || !!city ? "name" : "random";

  try {
    const psychologists = await getPublicPsychologists({
      limit,
      specialty: especialidade?.trim() || null,
      city,
      order,
    });
    return NextResponse.json({ psychologists });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar os perfis." }, { status: 500 });
  }
}
