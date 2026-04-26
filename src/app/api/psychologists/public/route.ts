import { NextResponse } from "next/server";
import { getPublicPsychologists } from "@/actions/psychologists/get-public-psychologists";

/**
 * Lista pública de psicólogos para a home (ordem aleatória a cada request).
 * Exclui REJECTED e INACTIVE.
 *
 * Query: ?limit=4 (padrão 4, máx 24)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number.parseInt(searchParams.get("limit") ?? "4", 10);
  const especialidade = searchParams.get("especialidade");

  try {
    const psychologists = await getPublicPsychologists({
      limit,
      specialty: especialidade?.trim() || null,
      order: especialidade?.trim() && especialidade.trim().toLowerCase() !== "todos" ? "name" : "random",
    });
    return NextResponse.json({ psychologists });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar os perfis." }, { status: 500 });
  }
}
