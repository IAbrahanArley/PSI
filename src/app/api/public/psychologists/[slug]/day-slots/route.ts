import { NextResponse } from "next/server";
import { getPublicDaySlotsService } from "@/services/public/public-psychologist-booking.service";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const date = new URL(req.url).searchParams.get("date")?.trim() ?? "";
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "Parâmetro date inválido (use YYYY-MM-DD)." }, { status: 400 });
  }

  try {
    const result = await getPublicDaySlotsService(decodeURIComponent(slug), date);
    if (!result) {
      return NextResponse.json({ error: "Profissional não encontrado." }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar os horários." }, { status: 500 });
  }
}
