import { type InferSelectModel, and, asc, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  patients,
  psychologistAppointments,
  psychologistClinicalNoteTags,
  psychologistClinicalTags,
  psychologistPatientCare,
  psychologistPatientClinicalNotes,
} from "@/lib/db/schema";

type CareStatus = InferSelectModel<typeof psychologistPatientCare>["status"];

export type PsychologistPatientListRow = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  careStatus: (typeof psychologistPatientCare.$inferSelect)["status"] | null;
  clinicalSummary: string | null;
};

/** Pacientes com ao menos um agendamento ou registro de caso com este psicólogo. */
export async function dbListPatientsForPsychologist(
  psychologistId: string,
  search?: string,
): Promise<PsychologistPatientListRow[]> {
  const apRows = await db
    .select({ patientId: psychologistAppointments.patientId })
    .from(psychologistAppointments)
    .where(eq(psychologistAppointments.psychologistId, psychologistId));

  const careRows = await db
    .select({ patientId: psychologistPatientCare.patientId })
    .from(psychologistPatientCare)
    .where(eq(psychologistPatientCare.psychologistId, psychologistId));

  const idSet = new Set<string>();
  for (const r of apRows) idSet.add(r.patientId);
  for (const r of careRows) idSet.add(r.patientId);

  if (idSet.size === 0) return [];

  const ids = [...idSet];
  const term = search?.trim();
  const idFilter = inArray(patients.id, ids);
  const searchFilter = term
    ? sql`(
        ${patients.fullName} ILIKE ${"%" + term + "%"}
        OR COALESCE(${patients.email}, '') ILIKE ${"%" + term + "%"}
        OR COALESCE(${patients.phone}, '') ILIKE ${"%" + term + "%"}
      )`
    : null;

  const rows = await db
    .select({
      id: patients.id,
      fullName: patients.fullName,
      email: patients.email,
      phone: patients.phone,
      careStatus: psychologistPatientCare.status,
      clinicalSummary: psychologistPatientCare.clinicalSummary,
    })
    .from(patients)
    .leftJoin(
      psychologistPatientCare,
      and(
        eq(psychologistPatientCare.patientId, patients.id),
        eq(psychologistPatientCare.psychologistId, psychologistId),
      ),
    )
    .where(searchFilter ? and(idFilter, searchFilter) : idFilter)
    .orderBy(asc(patients.fullName));

  return rows;
}

/** Vínculo válido: histórico de consultas ou caso já aberto. */
export async function dbPsychologistHasPatientLink(psychologistId: string, patientId: string) {
  const [ap] = await db
    .select({ id: psychologistAppointments.id })
    .from(psychologistAppointments)
    .where(
      and(
        eq(psychologistAppointments.psychologistId, psychologistId),
        eq(psychologistAppointments.patientId, patientId),
      ),
    )
    .limit(1);
  if (ap) return true;
  const care = await dbGetCareByPsychologistPatient(psychologistId, patientId);
  return care != null;
}

export async function dbGetCareByPsychologistPatient(psychologistId: string, patientId: string) {
  const [row] = await db
    .select()
    .from(psychologistPatientCare)
    .where(
      and(
        eq(psychologistPatientCare.psychologistId, psychologistId),
        eq(psychologistPatientCare.patientId, patientId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function dbUpsertPsychologistPatientCare(input: {
  psychologistId: string;
  patientId: string;
  status?: CareStatus;
  clinicalSummary?: string | null;
}) {
  const existing = await dbGetCareByPsychologistPatient(input.psychologistId, input.patientId);
  if (existing) return existing;
  const [row] = await db
    .insert(psychologistPatientCare)
    .values({
      psychologistId: input.psychologistId,
      patientId: input.patientId,
      status: input.status ?? "ACTIVE",
      clinicalSummary: input.clinicalSummary ?? null,
    })
    .returning();
  return row ?? null;
}

export async function dbUpdatePatientCare(
  psychologistId: string,
  patientId: string,
  patch: {
    status?: CareStatus;
    clinicalSummary?: string | null;
    pausedAt?: Date | null;
    dischargedAt?: Date | null;
  },
) {
  const now = new Date();
  const [row] = await db
    .update(psychologistPatientCare)
    .set({
      ...patch,
      updatedAt: now,
    })
    .where(
      and(
        eq(psychologistPatientCare.psychologistId, psychologistId),
        eq(psychologistPatientCare.patientId, patientId),
      ),
    )
    .returning();
  return row ?? null;
}

/** Valida se o agendamento pertence ao psicólogo e ao paciente. */
export async function dbGetAppointmentForPatientUnderPsychologist(
  appointmentId: string,
  psychologistId: string,
  patientId: string,
) {
  const [row] = await db
    .select({ id: psychologistAppointments.id })
    .from(psychologistAppointments)
    .where(
      and(
        eq(psychologistAppointments.id, appointmentId),
        eq(psychologistAppointments.psychologistId, psychologistId),
        eq(psychologistAppointments.patientId, patientId),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function dbInsertClinicalNote(values: typeof psychologistPatientClinicalNotes.$inferInsert) {
  const [row] = await db.insert(psychologistPatientClinicalNotes).values(values).returning();
  return row;
}

export async function dbGetClinicalNoteForPsychologist(noteId: string, psychologistId: string) {
  const [row] = await db
    .select()
    .from(psychologistPatientClinicalNotes)
    .where(
      and(
        eq(psychologistPatientClinicalNotes.id, noteId),
        eq(psychologistPatientClinicalNotes.psychologistId, psychologistId),
        isNull(psychologistPatientClinicalNotes.deletedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

export type ListClinicalNotesOpts = {
  psychologistId: string;
  patientId: string;
  limit: number;
  /** Cursor: último `createdAt` + `id` da página anterior */
  cursor?: { createdAt: Date; id: string };
};

/**
 * Lista por data decrescente (cursor estável). Destaque de “fixadas” na timeline fica na UI
 * ou via campo `isPinned` sem reordenar o cursor.
 */
/** Bloco “destaques” no topo da timeline (fixadas). */
export async function dbListPinnedClinicalNotesByPatient(
  psychologistId: string,
  patientId: string,
  limit = 8,
) {
  return db
    .select()
    .from(psychologistPatientClinicalNotes)
    .where(
      and(
        eq(psychologistPatientClinicalNotes.psychologistId, psychologistId),
        eq(psychologistPatientClinicalNotes.patientId, patientId),
        isNull(psychologistPatientClinicalNotes.deletedAt),
        eq(psychologistPatientClinicalNotes.isPinned, true),
      ),
    )
    .orderBy(
      desc(psychologistPatientClinicalNotes.pinnedAt),
      desc(psychologistPatientClinicalNotes.createdAt),
    )
    .limit(limit);
}

export async function dbListClinicalNotesByPatient(opts: ListClinicalNotesOpts) {
  const { psychologistId, patientId, limit, cursor } = opts;

  const base = and(
    eq(psychologistPatientClinicalNotes.psychologistId, psychologistId),
    eq(psychologistPatientClinicalNotes.patientId, patientId),
    isNull(psychologistPatientClinicalNotes.deletedAt),
    cursor
      ? or(
          lt(psychologistPatientClinicalNotes.createdAt, cursor.createdAt),
          and(
            eq(psychologistPatientClinicalNotes.createdAt, cursor.createdAt),
            lt(psychologistPatientClinicalNotes.id, cursor.id),
          ),
        )
      : undefined,
  );

  const rows = await db
    .select()
    .from(psychologistPatientClinicalNotes)
    .where(base)
    .orderBy(desc(psychologistPatientClinicalNotes.createdAt), desc(psychologistPatientClinicalNotes.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last
      ? { createdAt: last.createdAt, id: last.id }
      : undefined;

  return { notes: page, nextCursor };
}

export async function dbSearchClinicalNotes(input: {
  psychologistId: string;
  patientId?: string;
  query: string;
  limit: number;
}) {
  const term = `%${input.query.trim()}%`;
  if (input.query.trim().length < 2) return [];

  const cond = and(
    eq(psychologistPatientClinicalNotes.psychologistId, input.psychologistId),
    isNull(psychologistPatientClinicalNotes.deletedAt),
    input.patientId
      ? eq(psychologistPatientClinicalNotes.patientId, input.patientId)
      : undefined,
    or(
      sql`COALESCE(${psychologistPatientClinicalNotes.title}, '') ILIKE ${term}`,
      sql`${psychologistPatientClinicalNotes.body} ILIKE ${term}`,
    ),
  );

  return db
    .select()
    .from(psychologistPatientClinicalNotes)
    .where(cond)
    .orderBy(desc(psychologistPatientClinicalNotes.createdAt))
    .limit(input.limit);
}

export async function dbSetClinicalNotePinned(
  noteId: string,
  psychologistId: string,
  pinned: boolean,
) {
  const now = new Date();
  const [row] = await db
    .update(psychologistPatientClinicalNotes)
    .set({
      isPinned: pinned,
      pinnedAt: pinned ? now : null,
      updatedAt: now,
    })
    .where(
      and(
        eq(psychologistPatientClinicalNotes.id, noteId),
        eq(psychologistPatientClinicalNotes.psychologistId, psychologistId),
        isNull(psychologistPatientClinicalNotes.deletedAt),
      ),
    )
    .returning();
  return row ?? null;
}

export async function dbSoftDeleteClinicalNote(noteId: string, psychologistId: string) {
  const now = new Date();
  const [row] = await db
    .update(psychologistPatientClinicalNotes)
    .set({
      deletedAt: now,
      isPinned: false,
      pinnedAt: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(psychologistPatientClinicalNotes.id, noteId),
        eq(psychologistPatientClinicalNotes.psychologistId, psychologistId),
        isNull(psychologistPatientClinicalNotes.deletedAt),
      ),
    )
    .returning();
  return row ?? null;
}

export async function dbUpdateClinicalNote(
  noteId: string,
  psychologistId: string,
  patch: {
    title?: string | null;
    body?: string;
    noteType?: typeof psychologistPatientClinicalNotes.$inferInsert["noteType"];
  },
) {
  const now = new Date();
  const [row] = await db
    .update(psychologistPatientClinicalNotes)
    .set({ ...patch, updatedAt: now })
    .where(
      and(
        eq(psychologistPatientClinicalNotes.id, noteId),
        eq(psychologistPatientClinicalNotes.psychologistId, psychologistId),
        isNull(psychologistPatientClinicalNotes.deletedAt),
      ),
    )
    .returning();
  return row ?? null;
}

export async function dbReplaceNoteTags(noteId: string, tagIds: string[]) {
  await db.delete(psychologistClinicalNoteTags).where(eq(psychologistClinicalNoteTags.noteId, noteId));
  if (tagIds.length === 0) return;
  await db.insert(psychologistClinicalNoteTags).values(
    tagIds.map((tagId) => ({ noteId, tagId })),
  );
}

export async function dbListTagsForNotes(noteIds: string[]) {
  if (noteIds.length === 0) return [];
  return db
    .select({
      noteId: psychologistClinicalNoteTags.noteId,
      tagId: psychologistClinicalTags.id,
      label: psychologistClinicalTags.label,
      color: psychologistClinicalTags.color,
    })
    .from(psychologistClinicalNoteTags)
    .innerJoin(
      psychologistClinicalTags,
      eq(psychologistClinicalNoteTags.tagId, psychologistClinicalTags.id),
    )
    .where(inArray(psychologistClinicalNoteTags.noteId, noteIds));
}

export async function dbListClinicalTagsByPsychologist(psychologistId: string) {
  return db
    .select()
    .from(psychologistClinicalTags)
    .where(eq(psychologistClinicalTags.psychologistId, psychologistId))
    .orderBy(asc(psychologistClinicalTags.sortOrder), asc(psychologistClinicalTags.label));
}

export async function dbInsertClinicalTag(values: typeof psychologistClinicalTags.$inferInsert) {
  const [row] = await db.insert(psychologistClinicalTags).values(values).returning();
  return row;
}

/** Garante que todas as tags pertencem ao psicólogo. */
export async function dbAssertTagsBelongToPsychologist(psychologistId: string, tagIds: string[]) {
  if (tagIds.length === 0) return true;
  const rows = await db
    .select({ id: psychologistClinicalTags.id })
    .from(psychologistClinicalTags)
    .where(
      and(
        eq(psychologistClinicalTags.psychologistId, psychologistId),
        inArray(psychologistClinicalTags.id, tagIds),
      ),
    );
  return rows.length === tagIds.length;
}
