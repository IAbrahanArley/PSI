import { sql } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { patients } from "./patients";

/**
 * Anamnese do paciente — coletada no onboarding para alimentar o algoritmo
 * de compatibilidade com psicólogos.
 *
 * Um registro por paciente (UNIQUE em patient_id).
 * O paciente pode atualizar a qualquer momento (upsert).
 *
 * Campos sensíveis (LGPD Art. 11 — dado de saúde):
 *   - Tratados exclusivamente para indicação de profissionais
 *   - Nunca compartilhados com terceiros sem consentimento explícito
 *   - `completed_at` registra quando o paciente concluiu o fluxo pela primeira vez
 */
export const patientAnamnesis = pgTable(
  "patient_anamnesis",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** Um paciente tem no máximo uma anamnese (upsert por patient_id). */
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" })
      .unique(),

    // ── Passo 1: Motivo principal ─────────────────────────────────────────────
    /**
     * Seleção múltipla de motivos.
     * Valores possíveis: "ansiedade" | "depressao" | "relacionamentos" |
     * "autoconhecimento" | "luto" | "trauma" | "estresse" | "familia" |
     * "orientacao_vocacional" | "outros"
     */
    mainReasons: text("main_reasons")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),

    // ── Passo 2: Duração dos sintomas ─────────────────────────────────────────
    /**
     * "lt1m"     → Menos de 1 mês
     * "1to3m"    → 1 a 3 meses
     * "3to6m"    → 3 a 6 meses
     * "6to12m"   → 6 meses a 1 ano
     * "gt1y"     → Mais de 1 ano
     */
    symptomDuration: text("symptom_duration"),

    // ── Passo 3: Histórico terapêutico ────────────────────────────────────────
    hadPreviousTherapy: boolean("had_previous_therapy"),

    /**
     * Abordagem anterior (preenchido se hadPreviousTherapy = true).
     * "tcc" | "psicanalise" | "humanista" | "sistemica" | "nao_sei" | "outra"
     */
    previousApproach: text("previous_approach"),

    // ── Passo 4: Preferências de atendimento ──────────────────────────────────
    /**
     * "ONLINE" | "PRESENTIAL" | "NO_PREFERENCE"
     */
    preferredModality: text("preferred_modality"),

    /**
     * "MALE" | "FEMALE" | "NO_PREFERENCE"
     */
    genderPreference: text("gender_preference"),

    // ── Passo 5: Disponibilidade ──────────────────────────────────────────────
    /**
     * Dias da semana disponíveis.
     * Valores: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN"
     */
    availableDays: text("available_days")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),

    /**
     * Períodos disponíveis.
     * Valores: "MORNING" | "AFTERNOON" | "EVENING"
     */
    availablePeriods: text("available_periods")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),

    // ── Passo 6: Investimento e urgência ──────────────────────────────────────
    /**
     * Faixa de investimento por sessão.
     * "up100"      → Até R$ 100
     * "100to150"   → R$ 100 a R$ 150
     * "150to200"   → R$ 150 a R$ 200
     * "200plus"    → Acima de R$ 200
     * "flexible"   → Flexível / sem restrição
     */
    investmentRange: text("investment_range"),

    /**
     * Nível de urgência percebido pelo paciente.
     * 1 = pode aguardar  …  5 = preciso com urgência
     */
    urgencyLevel: integer("urgency_level"),

    /** Preenchido quando o paciente conclui o fluxo pela primeira vez. */
    completedAt: timestamp("completed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    patientUidx: uniqueIndex("patient_anamnesis_patient_uidx").on(t.patientId),
    urgencyIdx:  index("patient_anamnesis_urgency_idx").on(t.urgencyLevel),
  }),
);
