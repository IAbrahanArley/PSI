/** Modalidade de um slot / regra; alinhado ao enum `agenda_modality` no banco. */
export type AgendaModality = "ONLINE" | "PRESENTIAL";

export type WeeklyRuleType = "AVAILABLE" | "UNAVAILABLE";

export type AgendaExceptionKind =
  | "INACTIVE_DAY"
  | "INACTIVE_INTERVAL"
  | "ACTIVE_OVERRIDE_INTERVAL";

/** Slot retornado para UI / API (instantes UTC absolutos). */
export type AgendaAvailableSlot = {
  start: Date;
  end: Date;
  mode: AgendaModality;
  addressId: string | null;
};

/** Slot teórico da grade do dia + se ainda está livre para agendar. */
export type AgendaSlotWithAvailability = AgendaAvailableSlot & {
  available: boolean;
};

/** Regra semanal (linha de disponibilidade ou indisponibilidade recorrente). */
export type WeeklyAvailabilityRuleInput = {
  weekday: number;
  /** "HH:mm" ou "HH:mm:ss" */
  startTime: string;
  endTime: string;
  ruleType: WeeklyRuleType;
  modality: AgendaModality;
  addressId: string | null;
  isActive?: boolean;
  /**
   * Se definido, sobrescreve a duração padrão da sessão para slots gerados
   * a partir deste bloco AVAILABLE (útil quando o schema ganhar a coluna no futuro).
   */
  slotDurationMinutes?: number | null;
};

export type AgendaExceptionInput = {
  exceptionDate: string;
  kind: AgendaExceptionKind;
  startTime?: string | null;
  endTime?: string | null;
  addressId?: string | null;
  isActive?: boolean;
};

/** Consulta ou bloqueio já materializado no tempo (UTC). */
export type BusyUtcRange = {
  startsAt: Date;
  endsAt: Date;
};

export type CalculateAvailableSlotsInput = {
  /** "YYYY-MM-DD" no calendário do psicólogo. */
  localDate: string;
  /** Ex.: "America/Sao_Paulo" */
  timeZone: string;
  defaultSessionDurationMinutes: number;
  /** Espaço livre exigido antes do início de um slot (ex.: preparo). Default 0. */
  bufferBeforeMinutes?: number;
  /** Espaço livre exigido após o fim do slot (ex.: troca de paciente). Default 0. */
  bufferAfterMinutes?: number;
  weeklyRules: WeeklyAvailabilityRuleInput[];
  exceptions: AgendaExceptionInput[];
  /**
   * Consultas que bloqueiam o horário (já filtradas — ex.: sem `CANCELLED`).
   */
  appointments: BusyUtcRange[];
  scheduleBlocks: BusyUtcRange[];
};
