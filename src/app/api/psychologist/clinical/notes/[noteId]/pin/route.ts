import { NextResponse } from "next/server";
import { setClinicalNotePinnedService } from "@/services/clinical/clinical-notes.service";
import { requirePsychologist, PsychologistAuthError } from "@/server/auth/require-psychologist";
import { pinClinicalNoteSchema } from "@/lib/validation/clinical/clinical.schema";

export async function PATCH(req: Request, ctx: { params: Promise<{ noteId: string }> }) {
  try {
    const session = await requirePsychologist();
    const { noteId } = await ctx.params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }
    const parsed = pinClinicalNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 422 });
    }
    const note = await setClinicalNotePinnedService(session, noteId, parsed.data.pinned);
    return NextResponse.json({ note });
  } catch (e) {
    if (e instanceof PsychologistAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("autenticado") ? 401 : 403 });
    }
    const msg = e instanceof Error ? e.message : "Erro ao fixar anotação.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
