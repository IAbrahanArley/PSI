import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "ADMIN",
  "PATIENT",
  "PSYCHOLOGIST",
]);

export const psychologistStatusEnum = pgEnum("psychologist_status", [
  "PENDING",
  "ACTIVE",
  "INACTIVE",
  "REJECTED",
]);

export const genderEnum = pgEnum("gender", [
  "MALE",
  "FEMALE",
  "OTHER",
  "PREFER_NOT_TO_SAY",
]);

/** Online vs presencial — appointments, disponibilidade semanal e bloqueios */
export const agendaModalityEnum = pgEnum("agenda_modality", [
  "ONLINE",
  "PRESENTIAL",
]);

/**
 * Regra semanal: janelas em que o psicólogo aceita agendamentos
 * ou bloqueios recorrentes (ex.: almoço toda terça).
 */
export const weeklyAgendaRuleTypeEnum = pgEnum("weekly_agenda_rule_type", [
  "AVAILABLE",
  "UNAVAILABLE",
]);

/**
 * Exceções em uma data específica (sobrescrevem a grade semanal).
 * - INACTIVE_DAY: dia inteiro indisponível (ou sem atendimento naquele endereço, se addressId preenchido).
 * - INACTIVE_INTERVAL: intervalo indisponível.
 * - ACTIVE_OVERRIDE_INTERVAL: abre disponibilidade extra pontual.
 */
export const agendaExceptionKindEnum = pgEnum("agenda_exception_kind", [
  "INACTIVE_DAY",
  "INACTIVE_INTERVAL",
  "ACTIVE_OVERRIDE_INTERVAL",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

/** Classificação opcional de bloqueio na agenda (foco, pausa, admin…) */
export const scheduleBlockCategoryEnum = pgEnum("schedule_block_category", [
  "BREAK",
  "ADMIN",
  "FOCUS",
  "OTHER",
]);

/**
 * Status do vínculo terapêutico (caso) entre psicólogo e paciente — prontuário leve.
 * Não confundir com status de agendamento (`appointment_status`).
 */
export const patientCareStatusEnum = pgEnum("patient_care_status", [
  "ACTIVE",
  "PAUSED",
  "DISCHARGED",
]);

/**
 * Tipo de anotação clínica (organização e filtros na UI; não substitui avaliação formal).
 */
export const clinicalNoteTypeEnum = pgEnum("clinical_note_type", [
  /** Evolução / registro clínico habitual */
  "PROGRESS",
  /** Ligada conceitualmente a uma sessão (pode referenciar `appointment_id`) */
  "SESSION",
  /** Tarefas, contatos, encaminhamentos, logística */
  "ADMINISTRATIVE",
  /** Alertas de risco ou prioridade — revisar políticas internas e CFP */
  "RISK_OR_SAFETY",
  /** Demais */
  "OTHER",
]);

export const psychologistSocialNetworkEnum = pgEnum("psychologist_social_network", [
  "INSTAGRAM",
  "LINKEDIN",
  "FACEBOOK",
  "X",
  "YOUTUBE",
]);
