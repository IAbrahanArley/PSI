import { NextResponse } from "next/server";
import { getPublicMonthDatesWithSlotsService } from "@/services/public/public-psychologist-booking.service";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const sp = new URL(req.url).searchParams;
  const year = Number.parseInt(sp.get("year") ?? "", 10);
  const month = Number.parseInt(sp.get("month") ?? "", 10);
  if (!Number.isFinite(year) || year < 2000 || year > 2100) {
    return NextResponse.json({ error: "year inválido." }, { status: 400 });
  }
  if (!Number.isFinite(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "month inválido (1–12)." }, { status: 400 });
  }

  try {
    const result = await getPublicMonthDatesWithSlotsService(decodeURIComponent(slug), year, month);
    if (!result) {
      return NextResponse.json({ error: "Profissional não encontrado." }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar o calendário." }, { status: 500 });
  }
}
