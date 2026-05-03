import { NextResponse } from "next/server";
import { getPublicSearchFilters } from "@/actions/catalog/public-search-filters";

export async function GET() {
  try {
    const filters = await getPublicSearchFilters();
    return NextResponse.json(filters);
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar os filtros." }, { status: 500 });
  }
}
