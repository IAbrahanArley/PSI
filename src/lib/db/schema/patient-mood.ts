import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { patients } from "./patients";

/**
 * Entradas do diário de humor do paciente.
 * Um registro por dia por paciente (UNIQUE em patient_id + date).
 * O paciente pode atualizar a entrada do dia (upsert).
 *
 * score: 1 = Muito mal … 5 = Ótimo
 */
export const patientMoodEntries = pgTable(
  "patient_mood_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),

    /** Data da entrada no formato YYYY-MM-DD (fuso do cliente). */
    date: text("date").notNull(),

    /** 1 = Muito mal | 2 = Mal | 3 = Neutro | 4 = Bem | 5 = Ótimo */
    score: integer("score").notNull(),

    /** Nota opcional do paciente (máx. 500 chars). */
    note: text("note"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    /** Garante uma entrada por paciente por dia. */
    patientDateUidx: uniqueIndex("patient_mood_entries_patient_date_uidx").on(t.patientId, t.date),
    patientIdx:      index("patient_mood_entries_patient_idx").on(t.patientId),
  }),
);
