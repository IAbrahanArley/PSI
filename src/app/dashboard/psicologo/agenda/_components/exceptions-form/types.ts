export type AgendaExceptionKind =
  | "INACTIVE_DAY"
  | "INACTIVE_INTERVAL"
  | "ACTIVE_OVERRIDE_INTERVAL";

export type AgendaExceptionModality = "ONLINE" | "PRESENTIAL";

export type AgendaExceptionFormValues = {
  exceptionDate: string;
  kind: AgendaExceptionKind;
  modality: AgendaExceptionModality;
  addressId: string | null;
  startTime: string | null;
  endTime: string | null;
  note: string;
  isActive: boolean;
};

export type AgendaExceptionSubmitPayload = AgendaExceptionFormValues;
