import { NextResponse } from "next/server";
import { publicBookAppointmentBodySchema } from "@/lib/validation/public/public-booking.schema";
import { bookPublicAppointmentService } from "@/services/public/public-psychologist-booking.service";

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = publicBookAppointmentBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const b = parsed.data;
  try {
    const out = await bookPublicAppointmentService(decodeURIComponent(slug), {
      fullName: b.fullName,
      email: b.email,
      phone: b.phone,
      message: b.message ?? null,
      startsAtIso: b.startsAtIso,
      endsAtIso: b.endsAtIso,
      modality: b.modality,
      addressId: b.modality === "ONLINE" ? null : (b.addressId ?? null),
    });

    if (out === "not_found") {
      return NextResponse.json({ error: "Profissional não encontrado." }, { status: 404 });
    }
    if (out === "invalid_slot") {
      return NextResponse.json({ error: "Horário inválido ou indisponível." }, { status: 400 });
    }
    if (out === "slot_taken") {
      return NextResponse.json({ error: "Este horário acabou de ser reservado. Escolha outro." }, { status: 409 });
    }
    if (out === "conflict") {
      return NextResponse.json({ error: "Não foi possível concluir o agendamento." }, { status: 409 });
    }

    return NextResponse.json({ ok: true, appointmentId: out.appointmentId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao agendar.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
