/** Tipos da camada de UI — alinhados ao retorno de `getPsychologistAgendaDaySnapshotAction`. */

export type AgendaModality = "ONLINE" | "PRESENTIAL";

export type AgendaAppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type AgendaAppointmentListItem = {
  id: string;
  patientName: string;
  startsAtIso: string;
  endsAtIso: string;
  modality: AgendaModality;
  status: AgendaAppointmentStatus;
  addressLabel: string | null;
  title: string | null;
};

export type AgendaFreeSlotItem = {
  startLabel: string;
  endLabel: string;
  modality: AgendaModality;
  addressLabel: string | null;
};

export type AgendaDaySnapshot = {
  localDate: string;
  appointments: AgendaAppointmentListItem[];
  freeSlots: AgendaFreeSlotItem[];
};

export type AgendaModalityFilter = "ALL" | AgendaModality;

export type AgendaStatusFilter = "ALL" | AgendaAppointmentStatus;
