import { NextResponse } from "next/server";
import {
  dbListPinnedClinicalNotesByPatient,
  dbListTagsForNotes,
  dbPsychologistHasPatientLink,
} from "@/lib/db/queries/psychologist-clinical.queries";
import {
  listClinicalNotesWithTagsService,
  createClinicalNoteService,
  searchClinicalNotesService,
} from "@/services/clinical/clinical-notes.service";
import { requirePsychologist, PsychologistAuthError } from "@/server/auth/require-psychologist";
import {
  createClinicalNoteSchema,
  listClinicalNotesQuerySchema,
  searchClinicalNotesQuerySchema,
} from "@/lib/validation/clinical/clinical.schema";

/** GET: listar por paciente (?patientId=&limit=&cursorCreatedAt=&cursorId=) ou busca global (?q=&patientId opcional) */
export async function GET(req: Request) {
  try {
    const ctx = await requirePsychologist();
    const sp = new URL(req.url).searchParams;
    const q = sp.get("q")?.trim();

    const pinnedOnly = sp.get("pinnedOnly");
    if (pinnedOnly === "1" || pinnedOnly === "true") {
      const patientId = sp.get("patientId");
      if (!patientId || !/^[0-9a-f-]{36}$/i.test(patientId)) {
        return NextResponse.json({ error: "patientId obrigatório (UUID)." }, { status: 400 });
      }
      const linked = await dbPsychologistHasPatientLink(ctx.psychologistId, patientId);
      if (!linked) {
        return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
      }
      const pinnedRows = await dbListPinnedClinicalNotesByPatient(ctx.psychologistId, patientId, 12);
      const tagRows = await dbListTagsForNotes(pinnedRows.map((n) => n.id));
      const tagsByNote = new Map<string, { id: string; label: string; color: string | null }[]>();
      for (const t of tagRows) {
        const list = tagsByNote.get(t.noteId) ?? [];
        list.push({ id: t.tagId, label: t.label, color: t.color });
        tagsByNote.set(t.noteId, list);
      }
      const notes = pinnedRows.map((n) => ({ ...n, tags: tagsByNote.get(n.id) ?? [] }));
      return NextResponse.json({ notes, nextCursor: null });
    }

    if (q) {
      const parsed = searchClinicalNotesQuerySchema.safeParse({
        q,
        patientId: sp.get("patientId") ?? undefined,
        limit: sp.get("limit") ?? undefined,
      });
      if (!parsed.success) {
        return NextResponse.json({ error: "Parâmetros inválidos.", details: parsed.error.flatten() }, { status: 400 });
      }
      const hits = await searchClinicalNotesService(ctx, parsed.data);
      return NextResponse.json({ notes: hits });
    }

    const parsed = listClinicalNotesQuerySchema.safeParse({
      patientId: sp.get("patientId"),
      limit: sp.get("limit") ?? undefined,
      cursorCreatedAt: sp.get("cursorCreatedAt") ?? undefined,
      cursorId: sp.get("cursorId") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Parâmetros inválidos.", details: parsed.error.flatten() }, { status: 400 });
    }

    const { patientId, limit, cursorCreatedAt, cursorId } = parsed.data;
    const cursor =
      cursorCreatedAt && cursorId
        ? { createdAt: new Date(cursorCreatedAt), id: cursorId }
        : undefined;

    const out = await listClinicalNotesWithTagsService(ctx, { patientId, limit, cursor });
    return NextResponse.json({
      notes: out.notes,
      nextCursor: out.nextCursor
        ? {
            createdAt: out.nextCursor.createdAt.toISOString(),
            id: out.nextCursor.id,
          }
        : null,
    });
  } catch (e) {
    if (e instanceof PsychologistAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("autenticado") ? 401 : 403 });
    }
    throw e;
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requirePsychologist();
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }
    const parsed = createClinicalNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 422 });
    }
    const note = await createClinicalNoteService(ctx, parsed.data);
    return NextResponse.json({ note }, { status: 201 });
  } catch (e) {
    if (e instanceof PsychologistAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("autenticado") ? 401 : 403 });
    }
    const msg = e instanceof Error ? e.message : "Erro ao criar anotação.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
