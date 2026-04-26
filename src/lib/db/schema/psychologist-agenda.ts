import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  agendaExceptionKindEnum,
  agendaModalityEnum,
  appointmentStatusEnum,
  scheduleBlockCategoryEnum,
  weeklyAgendaRuleTypeEnum,
} from "./enums";
import { patients } from "./patients";
import { psychologistAddresses } from "./psychologist-profile";
import { psychologists } from "./psychologists";
import { users } from "./users";

/**
 * Disponibilidade / indisponibilidade semanal recorrente.
 * Vários registros por weekday permitem vários blocos no mesmo dia.
 *
 * Horários em "relógio local" do psicólogo; combine com um timezone IANA no app
 * (ex. coluna futura em psychologists ou em perfil) para montar slots no calendário.
 *
 * ONLINE → addressId deve ser null.
 * PRESENTIAL → addressId obrigatório (qual consultório naquele bloco).
 */
export const psychologistWeeklyAvailability = pgTable(
  "psychologist_weekly_availability",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    psychologistId: uuid("psychologist_id")
      .notNull()
      .references(() => psychologists.id, { onDelete: "cascade" }),
    /** 0 = domingo … 6 = sábado (compatível com `EXTRACT(dow FROM date)` no PostgreSQL). */
    weekday: smallint("weekday").notNull(),
    startTime: time("start_time", { withTimezone: false }).notNull(),
    endTime: time("end_time", { withTimezone: false }).notNull(),
    ruleType: weeklyAgendaRuleTypeEnum("rule_type").notNull().default("AVAILABLE"),
    modality: agendaModalityEnum("modality").notNull(),
    addressId: uuid("address_id").references(() => psychologistAddresses.id, {
      onDelete: "cascade",
    }),
    sortOrder: smallint("sort_order").notNull().default(0),
    /** Se false, a regra existe mas não entra no cálculo (útil para UI / pausar sem apagar). */
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    weekdayRange: check(
      "psychologist_weekly_availability_weekday_range",
      sql`weekday >= 0 AND weekday <= 6`,
    ),
    timeOrder: check(
      "psychologist_weekly_availability_time_order",
      sql`end_time > start_time`,
    ),
    modalityAddress: check(
      "psychologist_weekly_availability_modality_address",
      sql`(
        (modality = 'ONLINE' AND address_id IS NULL) OR
        (modality = 'PRESENTIAL' AND address_id IS NOT NULL)
      )`,
    ),
    psychWeekdayIdx: index("psychologist_weekly_availability_psychologist_weekday_idx").on(
      t.psychologistId,
      t.weekday,
    ),
    psychModalityIdx: index("psychologist_weekly_availability_psychologist_modality_idx").on(
      t.psychologistId,
      t.modality,
    ),
    /** Um mesmo bloco exato não precisa duplicar (NULLs em unique: cuidado; aqui addressId é NOT NULL para PRESENTIAL). */
    uniqueSlot: uniqueIndex("psychologist_weekly_availability_unique_slot").on(
      t.psychologistId,
      t.weekday,
      t.startTime,
      t.endTime,
      t.ruleType,
      t.modality,
      t.addressId,
    ),
  }),
);

/**
 * Exceção em uma data de calendário (sem timezone armazenado na data).
 * INACTIVE_DAY: bloqueia o dia inteiro (horários nulos).
 * INACTIVE_INTERVAL / ACTIVE_OVERRIDE_INTERVAL: startTime + endTime obrigatórios no mesmo dia local.
 *
 * addressId null → exceção vale para a agenda geral (todas as modalidades / locais).
 * addressId preenchido → exceção escopo àquele endereço (ex.: consultório fechado neste dia).
 */
export const psychologistAgendaExceptions = pgTable(
  "psychologist_agenda_exceptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    psychologistId: uuid("psychologist_id")
      .notNull()
      .references(() => psychologists.id, { onDelete: "cascade" }),
    exceptionDate: date("exception_date", { mode: "string" }).notNull(),
    kind: agendaExceptionKindEnum("kind").notNull(),
    startTime: time("start_time", { withTimezone: false }),
    endTime: time("end_time", { withTimezone: false }),
    addressId: uuid("address_id").references(() => psychologistAddresses.id, {
      onDelete: "cascade",
    }),
    note: text("note"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    kindTimes: check(
      "psychologist_agenda_exceptions_kind_times",
      sql`(
        (kind = 'INACTIVE_DAY' AND start_time IS NULL AND end_time IS NULL)
        OR
        (kind = 'INACTIVE_INTERVAL' AND start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
        OR
        (kind = 'ACTIVE_OVERRIDE_INTERVAL' AND start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
      )`,
    ),
    psychDateIdx: index("psychologist_agenda_exceptions_psychologist_date_idx").on(
      t.psychologistId,
      t.exceptionDate,
    ),
    psychDateKindIdx: index("psychologist_agenda_exceptions_psychologist_date_kind_idx").on(
      t.psychologistId,
      t.exceptionDate,
      t.kind,
    ),
  }),
);

/**
 * Consultas agendadas (paciente obrigatório).
 * Instantâneos em timestamptz para integração direta com calendário e APIs.
 */
export const psychologistAppointments = pgTable(
  "psychologist_appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    psychologistId: uuid("psychologist_id")
      .notNull()
      .references(() => psychologists.id, { onDelete: "cascade" }),
    patientId: uuid("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "restrict" }),
    modality: agendaModalityEnum("modality").notNull(),
    addressId: uuid("address_id").references(() => psychologistAddresses.id, {
      onDelete: "restrict",
    }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: appointmentStatusEnum("status").notNull().default("SCHEDULED"),
    title: text("title"),
    notes: text("notes"),
    cancellationReason: text("cancellation_reason"),
    /** Quando o paciente ou o profissional solicitou cancelamento */
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    rangeOrder: check(
      "psychologist_appointments_range_order",
      sql`ends_at > starts_at`,
    ),
    modalityAddress: check(
      "psychologist_appointments_modality_address",
      sql`(
        (modality = 'ONLINE' AND address_id IS NULL) OR
        (modality = 'PRESENTIAL' AND address_id IS NOT NULL)
      )`,
    ),
    psychStartsIdx: index("psychologist_appointments_psychologist_starts_idx").on(
      t.psychologistId,
      t.startsAt,
    ),
    psychStatusStartsIdx: index("psychologist_appointments_psychologist_status_starts_idx").on(
      t.psychologistId,
      t.status,
      t.startsAt,
    ),
    patientStartsIdx: index("psychologist_appointments_patient_starts_idx").on(
      t.patientId,
      t.startsAt,
    ),
    /**
     * Idempotência leve: evita dois agendamentos não cancelados com o mesmo início
     * (ajuste a cláusula WHERE conforme regras de negócio).
     */
    activeStartUnique: uniqueIndex("psychologist_appointments_psych_active_start_uidx")
      .on(t.psychologistId, t.startsAt)
      .where(sql`status <> 'CANCELLED'`),
  }),
);

/**
 * Bloqueios de horário (sem paciente): reunião interna, pausa, etc.
 * Usa timestamptz para o calendário; pode coexistir com exceções por data.
 */
export const psychologistScheduleBlocks = pgTable(
  "psychologist_schedule_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    psychologistId: uuid("psychologist_id")
      .notNull()
      .references(() => psychologists.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    modality: agendaModalityEnum("modality").notNull().default("ONLINE"),
    addressId: uuid("address_id").references(() => psychologistAddresses.id, {
      onDelete: "set null",
    }),
    category: scheduleBlockCategoryEnum("category").notNull().default("OTHER"),
    reason: text("reason"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    rangeOrder: check(
      "psychologist_schedule_blocks_range_order",
      sql`ends_at > starts_at`,
    ),
    blockModalityAddress: check(
      "psychologist_schedule_blocks_modality_address",
      sql`(
        (modality = 'ONLINE' AND address_id IS NULL) OR
        (modality = 'PRESENTIAL' AND address_id IS NOT NULL)
      )`,
    ),
    psychRangeIdx: index("psychologist_schedule_blocks_psychologist_range_idx").on(
      t.psychologistId,
      t.startsAt,
      t.endsAt,
    ),
  }),
);

/**
 * Histórico de mudanças de status do agendamento (auditoria, timeline na UI).
 */
export const psychologistAppointmentStatusHistory = pgTable(
  "psychologist_appointment_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    appointmentId: uuid("appointment_id")
      .notNull()
      .references(() => psychologistAppointments.id, { onDelete: "cascade" }),
    fromStatus: appointmentStatusEnum("from_status"),
    toStatus: appointmentStatusEnum("to_status").notNull(),
    /** Usuário autenticado que registrou a mudança (psicólogo, paciente ou admin). */
    changedByUserId: uuid("changed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    appointmentCreatedIdx: index("psychologist_appt_status_hist_appt_created_idx").on(
      t.appointmentId,
      t.createdAt,
    ),
  }),
);

/**
 * Sugestão de migração SQL (não gerada automaticamente pelo Drizzle) para impedir
 * sobreposição de horários de consultas ativas no mesmo profissional:
 *
 * CREATE EXTENSION IF NOT EXISTS btree_gist;
 *
 * ALTER TABLE psychologist_appointments
 *   ADD CONSTRAINT psychologist_appointments_no_overlap
 *   EXCLUDE USING gist (
 *     psychologist_id WITH =,
 *     tstzrange(starts_at, ends_at, '[)') WITH &&
 *   )
 *   WHERE (status <> 'CANCELLED');
 */
