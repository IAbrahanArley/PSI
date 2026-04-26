import { NextResponse } from "next/server";
import { deleteClinicalNoteService } from "@/services/clinical/clinical-notes.service";
import { requirePsychologist, PsychologistAuthError } from "@/server/auth/require-psychologist";

/** Exclusão lógica (LGPD / retenção: política de purge pode rodar em job separado). */
export async function DELETE(_req: Request, ctx: { params: Promise<{ noteId: string }> }) {
  try {
    const session = await requirePsychologist();
    const { noteId } = await ctx.params;
    const note = await deleteClinicalNoteService(session, noteId);
    return NextResponse.json({ note });
  } catch (e) {
    if (e instanceof PsychologistAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("autenticado") ? 401 : 403 });
    }
    const msg = e instanceof Error ? e.message : "Erro ao remover.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
