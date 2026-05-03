import { NextResponse } from "next/server";
import { listPublicCatalogSpecialtiesForHome } from "@/actions/catalog/list-public-catalog-specialties-for-home";

/** Catálogo público para a home (com contagem de psicólogos ativos por especialidade). */
export async function GET() {
  try {
    const items = await listPublicCatalogSpecialtiesForHome();
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar especialidades." }, { status: 500 });
  }
}
