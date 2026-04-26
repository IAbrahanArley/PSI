import {
  boolean,
  index,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { clinicalNoteTypeEnum, patientCareStatusEnum } from "./enums";
import { patients } from "./patients";
import { psychologistAppointments } from "./psychologist-agenda";
import { psychologists } from "./psychologists";
import { users } from "./users";

/**
 * Caso clínico: um registro por par (psicólogo, paciente).
 * Centraliza status de atendimento e resumo para a UI (timeline + card do paciente).
 */
export const psychologistPatientCare = pgTable(
  "psychologist_patient_care",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    psychologistId: uuid("psychologist_id")
      .notNull()
      .references(() => psychologists.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    status: patientCareStatusEnum("status").notNull().default("ACTIVE"),
    /** Resumo clínico curto (objetivos, hipóteses de trabalho — evitar dados desnecessários). */
    clinicalSummary: text("clinical_summary"),
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    dischargedAt: timestamp("discharged_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniquePsychPatient: uniqueIndex("psychologist_patient_care_psych_patient_uidx").on(
      t.psychologistId,
      t.patientId,
    ),
    psychIdx: index("psychologist_patient_care_psychologist_idx").on(t.psychologistId),
    patientIdx: index("psychologist_patient_care_patient_idx").on(t.patientId),
    statusIdx: index("psychologist_patient_care_status_idx").on(t.psychologistId, t.status),
  }),
);

/**
 * Tags clínicas reutilizáveis por psicólogo (ex.: temas de trabalho, não diagnóstico DSM na label).
 */
export const psychologistClinicalTags = pgTable(
  "psychologist_clinical_tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    psychologistId: uuid("psychologist_id")
      .notNull()
      .references(() => psychologists.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    color: text("color"),
    sortOrder: smallint("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    /** Labels normalizadas em minúsculas na aplicação ao criar/editar. */
    uniqueLabel: uniqueIndex("psychologist_clinical_tags_psych_label_uidx").on(t.psychologistId, t.label),
    psychIdx: index("psychologist_clinical_tags_psychologist_idx").on(t.psychologistId),
  }),
);

/**
 * Anotações de prontuário. Corpo em texto — criptografia em repouso fica a cargo da infra (DB/Volume).
 * `deleted_at`: exclusão lógica (retention conforme política do consultório e resoluções CFP).
 */
export const psychologistPatientClinicalNotes = pgTable(
  "psychologist_patient_clinical_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    psychologistId: uuid("psychologist_id")
      .notNull()
      .references(() => psychologists.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    /** Opcional: vincula a uma sessão agendada (mesmo psych + paciente validado na aplicação). */
    appointmentId: uuid("appointment_id").references(() => psychologistAppointments.id, {
      onDelete: "set null",
    }),
    title: text("title"),
    body: text("body").notNull(),
    noteType: clinicalNoteTypeEnum("note_type").notNull().default("PROGRESS"),
    isPinned: boolean("is_pinned").notNull().default(false),
    pinnedAt: timestamp("pinned_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    psychPatientCreated: index("psych_clinical_notes_psych_patient_created_idx").on(
      t.psychologistId,
      t.patientId,
      t.createdAt,
    ),
    psychPatientPinned: index("psych_clinical_notes_psych_patient_pinned_idx").on(
      t.psychologistId,
      t.patientId,
      t.isPinned,
      t.pinnedAt,
    ),
    appointmentIdx: index("psych_clinical_notes_appointment_idx").on(t.appointmentId),
    authorIdx: index("psych_clinical_notes_author_idx").on(t.authorUserId),
  }),
);

export const psychologistClinicalNoteTags = pgTable(
  "psychologist_clinical_note_tags",
  {
    noteId: uuid("note_id")
      .notNull()
      .references(() => psychologistPatientClinicalNotes.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => psychologistClinicalTags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.noteId, t.tagId] }),
    tagIdx: index("psych_clinical_note_tags_tag_idx").on(t.tagId),
  }),
);
