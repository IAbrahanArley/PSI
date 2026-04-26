"use server";

import {
  createClinicalNoteService,
  deleteClinicalNoteService,
  listClinicalNotesWithTagsService,
  searchClinicalNotesService,
  setClinicalNotePinnedService,
} from "@/services/clinical/clinical-notes.service";
import { getPatientCareService, updatePatientCareService } from "@/services/clinical/patient-care.service";
import {
  createClinicalNoteSchema,
  updatePatientCareSchema,
} from "@/lib/validation/clinical/clinical.schema";
import { requirePsychologist, PsychologistAuthError } from "@/server/auth/require-psychologist";

function authError(e: unknown): { ok: false; error: string } {
  if (e instanceof PsychologistAuthError) return { ok: false, error: e.message };
  throw e;
}

export async function actionCreateClinicalNote(raw: unknown) {
  try {
    const ctx = await requirePsychologist();
    const parsed = createClinicalNoteSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false as const, error: "Dados inválidos.", details: parsed.error.flatten() };
    }
    const note = await createClinicalNoteService(ctx, parsed.data);
    return { ok: true as const, note };
  } catch (e) {
    if (e instanceof PsychologistAuthError) return authError(e);
    return { ok: false as const, error: e instanceof Error ? e.message : "Erro." };
  }
}

export async function actionListClinicalNotes(input: {
  patientId: string;
  limit?: number;
  cursor?: { createdAt: string; id: string };
}) {
  try {
    const ctx = await requirePsychologist();
    const limit = input.limit ?? 20;
    const cursor =
      input.cursor && input.cursor.createdAt && input.cursor.id
        ? { createdAt: new Date(input.cursor.createdAt), id: input.cursor.id }
        : undefined;
    const out = await listClinicalNotesWithTagsService(ctx, {
      patientId: input.patientId,
      limit,
      cursor,
    });
    return {
      ok: true as const,
      notes: out.notes,
      nextCursor: out.nextCursor
        ? { createdAt: out.nextCursor.createdAt.toISOString(), id: out.nextCursor.id }
        : null,
    };
  } catch (e) {
    if (e instanceof PsychologistAuthError) return authError(e);
    return { ok: false as const, error: e instanceof Error ? e.message : "Erro." };
  }
}

export async function actionSearchClinicalNotes(input: { q: string; patientId?: string; limit?: number }) {
  try {
    const ctx = await requirePsychologist();
    const rows = await searchClinicalNotesService(ctx, {
      q: input.q,
      patientId: input.patientId,
      limit: input.limit ?? 20,
    });
    return { ok: true as const, notes: rows };
  } catch (e) {
    if (e instanceof PsychologistAuthError) return authError(e);
    return { ok: false as const, error: e instanceof Error ? e.message : "Erro." };
  }
}

export async function actionPinClinicalNote(noteId: string, pinned: boolean) {
  try {
    const ctx = await requirePsychologist();
    const note = await setClinicalNotePinnedService(ctx, noteId, pinned);
    return { ok: true as const, note };
  } catch (e) {
    if (e instanceof PsychologistAuthError) return authError(e);
    return { ok: false as const, error: e instanceof Error ? e.message : "Erro." };
  }
}

export async function actionDeleteClinicalNote(noteId: string) {
  try {
    const ctx = await requirePsychologist();
    const note = await deleteClinicalNoteService(ctx, noteId);
    return { ok: true as const, note };
  } catch (e) {
    if (e instanceof PsychologistAuthError) return authError(e);
    return { ok: false as const, error: e instanceof Error ? e.message : "Erro." };
  }
}

export async function actionGetPatientCare(patientId: string) {
  try {
    const ctx = await requirePsychologist();
    const care = await getPatientCareService(ctx, patientId);
    return { ok: true as const, care };
  } catch (e) {
    if (e instanceof PsychologistAuthError) return authError(e);
    return { ok: false as const, error: e instanceof Error ? e.message : "Erro." };
  }
}

export async function actionUpdatePatientCare(patientId: string, raw: unknown) {
  try {
    const ctx = await requirePsychologist();
    const parsed = updatePatientCareSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false as const, error: "Dados inválidos.", details: parsed.error.flatten() };
    }
    const care = await updatePatientCareService(ctx, patientId, parsed.data);
    return { ok: true as const, care };
  } catch (e) {
    if (e instanceof PsychologistAuthError) return authError(e);
    return { ok: false as const, error: e instanceof Error ? e.message : "Erro." };
  }
}
