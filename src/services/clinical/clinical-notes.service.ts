import type { PsychologistSessionContext } from "@/server/auth/require-psychologist";
import {
  dbAssertTagsBelongToPsychologist,
  dbGetAppointmentForPatientUnderPsychologist,
  dbGetClinicalNoteForPsychologist,
  dbInsertClinicalNote,
  dbListClinicalNotesByPatient,
  dbListTagsForNotes,
  dbPsychologistHasPatientLink,
  dbReplaceNoteTags,
  dbSearchClinicalNotes,
  dbSetClinicalNotePinned,
  dbSoftDeleteClinicalNote,
  dbUpsertPsychologistPatientCare,
} from "@/lib/db/queries/psychologist-clinical.queries";
import type { createClinicalNoteSchema } from "@/lib/validation/clinical/clinical.schema";
import type { z } from "zod";

export async function createClinicalNoteService(
  ctx: PsychologistSessionContext,
  input: z.infer<typeof createClinicalNoteSchema>,
) {
  const linked = await dbPsychologistHasPatientLink(ctx.psychologistId, input.patientId);
  if (!linked) {
    throw new Error("Paciente não encontrado ou sem vínculo com sua prática.");
  }
  await dbUpsertPsychologistPatientCare({
    psychologistId: ctx.psychologistId,
    patientId: input.patientId,
  });

  if (input.appointmentId) {
    const ap = await dbGetAppointmentForPatientUnderPsychologist(
      input.appointmentId,
      ctx.psychologistId,
      input.patientId,
    );
    if (!ap) {
      throw new Error("Agendamento inválido para este paciente.");
    }
  }

  if (input.tagIds?.length) {
    const ok = await dbAssertTagsBelongToPsychologist(ctx.psychologistId, input.tagIds);
    if (!ok) throw new Error("Uma ou mais tags são inválidas.");
  }

  const row = await dbInsertClinicalNote({
    psychologistId: ctx.psychologistId,
    patientId: input.patientId,
    authorUserId: ctx.userId,
    appointmentId: input.appointmentId ?? null,
    title: input.title?.trim() || null,
    body: input.body.trim(),
    noteType: input.noteType ?? "PROGRESS",
    isPinned: false,
    pinnedAt: null,
    deletedAt: null,
  });

  if (!row) throw new Error("Falha ao criar anotação.");

  if (input.tagIds?.length) {
    await dbReplaceNoteTags(row.id, input.tagIds);
  }

  return row;
}

export async function listClinicalNotesWithTagsService(
  ctx: PsychologistSessionContext,
  input: {
    patientId: string;
    limit: number;
    cursor?: { createdAt: Date; id: string };
  },
) {
  const linked = await dbPsychologistHasPatientLink(ctx.psychologistId, input.patientId);
  if (!linked) {
    throw new Error("Paciente não encontrado ou sem vínculo com sua prática.");
  }
  const { notes, nextCursor } = await dbListClinicalNotesByPatient({
    psychologistId: ctx.psychologistId,
    patientId: input.patientId,
    limit: input.limit,
    cursor: input.cursor,
  });

  const tagRows = await dbListTagsForNotes(notes.map((n) => n.id));
  const tagsByNote = new Map<string, { id: string; label: string; color: string | null }[]>();
  for (const t of tagRows) {
    const list = tagsByNote.get(t.noteId) ?? [];
    list.push({ id: t.tagId, label: t.label, color: t.color });
    tagsByNote.set(t.noteId, list);
  }

  return {
    notes: notes.map((n) => ({ ...n, tags: tagsByNote.get(n.id) ?? [] })),
    nextCursor,
  };
}

export async function searchClinicalNotesService(
  ctx: PsychologistSessionContext,
  input: { q: string; patientId?: string; limit: number },
) {
  if (input.patientId) {
    const linked = await dbPsychologistHasPatientLink(ctx.psychologistId, input.patientId);
    if (!linked) {
      throw new Error("Paciente não encontrado ou sem vínculo com sua prática.");
    }
  }
  const rows = await dbSearchClinicalNotes({
    psychologistId: ctx.psychologistId,
    patientId: input.patientId,
    query: input.q,
    limit: input.limit,
  });
  const tagRows = await dbListTagsForNotes(rows.map((n) => n.id));
  const tagsByNote = new Map<string, { id: string; label: string; color: string | null }[]>();
  for (const t of tagRows) {
    const list = tagsByNote.get(t.noteId) ?? [];
    list.push({ id: t.tagId, label: t.label, color: t.color });
    tagsByNote.set(t.noteId, list);
  }
  return rows.map((n) => ({ ...n, tags: tagsByNote.get(n.id) ?? [] }));
}

export async function setClinicalNotePinnedService(
  ctx: PsychologistSessionContext,
  noteId: string,
  pinned: boolean,
) {
  const existing = await dbGetClinicalNoteForPsychologist(noteId, ctx.psychologistId);
  if (!existing) throw new Error("Anotação não encontrada.");
  const row = await dbSetClinicalNotePinned(noteId, ctx.psychologistId, pinned);
  if (!row) throw new Error("Não foi possível atualizar.");
  return row;
}

export async function deleteClinicalNoteService(ctx: PsychologistSessionContext, noteId: string) {
  const row = await dbSoftDeleteClinicalNote(noteId, ctx.psychologistId);
  if (!row) throw new Error("Anotação não encontrada ou já removida.");
  return row;
}
