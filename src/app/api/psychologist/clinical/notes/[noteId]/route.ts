import { NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteClinicalNoteService,
  updateClinicalNoteService,
} from "@/services/clinical/clinical-notes.service";
import { requirePsychologist, PsychologistAuthError } from "@/server/auth/require-psychologist";

type Ctx = { params: Promise<{ noteId: string }> };

const patchSchema = z.object({
  title:    z.string().max(200).nullable().optional(),
  body:     z.string().min(1).max(20000).optional(),
  noteType: z.enum(["PROGRESS", "SESSION", "ADMINISTRATIVE", "RISK_OR_SAFETY", "OTHER"]).optional(),
  tagIds:   z.array(z.string().uuid()).optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const session = await requirePsychologist();
    const { noteId } = await ctx.params;
    let body: unknown;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 422 });
    }
    const note = await updateClinicalNoteService(session, noteId, parsed.data);
    return NextResponse.json({ note });
  } catch (e) {
    if (e instanceof PsychologistAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("autenticado") ? 401 : 403 });
    }
    const msg = e instanceof Error ? e.message : "Erro ao atualizar.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/** Exclusão lógica (LGPD / retenção: política de purge pode rodar em job separado). */
export async function DELETE(_req: Request, ctx: Ctx) {
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
