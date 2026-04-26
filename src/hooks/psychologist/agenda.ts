"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelPsychologistAppointmentAction,
  listPsychologistAppointmentsByDayAction,
  listPsychologistAppointmentsByWeekAction,
  reschedulePsychologistAppointmentAction,
  setPsychologistAppointmentStatusAction,
} from "@/actions/agenda/appointments.actions";
import {
  createAgendaExceptionAction,
  listAgendaExceptionsByPeriodAction,
} from "@/actions/agenda/exceptions.actions";
import { getPsychologistAgendaDaySnapshotAction } from "@/actions/agenda/agenda-day-snapshot.actions";
import {
  createWeeklyAvailabilityRuleAction,
  deleteWeeklyAvailabilityRuleAction,
  listWeeklyAvailabilityRulesAction,
  updateWeeklyAvailabilityRuleAction,
} from "@/actions/agenda/weekly-rules.actions";
import type { CancelAppointmentInput, RescheduleAppointmentInput } from "@/lib/validation/agenda/appointments.schema";

export type AgendaAppointmentRow = Awaited<
  ReturnType<typeof listPsychologistAppointmentsByDayAction>
>[number];

export const getAgendaAppointmentsDayKey = (localDate: string, timeZone: string) =>
  ["psychologist-agenda", "appointments-day", localDate, timeZone] as const;

export const getAgendaAppointmentsWeekKey = (anchorLocalDate: string, timeZone: string) =>
  ["psychologist-agenda", "appointments-week", anchorLocalDate, timeZone] as const;

export const getWeeklyAvailabilityRulesKey = () => ["psychologist-agenda", "weekly-rules"] as const;

export const getAgendaDaySnapshotKey = (localDate: string, timeZone: string) =>
  ["psychologist-agenda", "day-snapshot", localDate, timeZone] as const;

export const getAgendaExceptionsKey = (fromDate: string, toDate: string) =>
  ["psychologist-agenda", "exceptions", fromDate, toDate] as const;

export function useAgendaAppointmentsDay(localDate: string, timeZone: string) {
  return useQuery({
    queryKey: getAgendaAppointmentsDayKey(localDate, timeZone),
    queryFn: () => listPsychologistAppointmentsByDayAction({ localDate, timeZone }),
  });
}

export function useAgendaAppointmentsWeek(anchorLocalDate: string, timeZone: string) {
  return useQuery({
    queryKey: getAgendaAppointmentsWeekKey(anchorLocalDate, timeZone),
    queryFn: () => listPsychologistAppointmentsByWeekAction({ anchorLocalDate, timeZone }),
  });
}

export function useWeeklyAvailabilityRules() {
  return useQuery({
    queryKey: getWeeklyAvailabilityRulesKey(),
    queryFn: () => listWeeklyAvailabilityRulesAction(),
  });
}

export function useAgendaDaySnapshot(localDate: string, timeZone: string) {
  return useQuery({
    queryKey: getAgendaDaySnapshotKey(localDate, timeZone),
    queryFn: () => getPsychologistAgendaDaySnapshotAction({ localDate, timeZone }),
  });
}

export function useAgendaExceptionsPeriod(fromDate: string, toDate: string, enabled = true) {
  return useQuery({
    queryKey: getAgendaExceptionsKey(fromDate, toDate),
    queryFn: () => listAgendaExceptionsByPeriodAction({ fromDate, toDate }),
    enabled,
  });
}

export function useCreateWeeklyRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => createWeeklyAvailabilityRuleAction(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: getWeeklyAvailabilityRulesKey() });
      await qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "psychologist-agenda" &&
          q.queryKey[1] === "day-snapshot",
      });
    },
  });
}

export function useUpdateWeeklyRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => updateWeeklyAvailabilityRuleAction(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: getWeeklyAvailabilityRulesKey() });
      await qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "psychologist-agenda" &&
          q.queryKey[1] === "day-snapshot",
      });
    },
  });
}

export function useDeleteWeeklyRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => deleteWeeklyAvailabilityRuleAction(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: getWeeklyAvailabilityRulesKey() });
      await qc.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "psychologist-agenda" &&
          q.queryKey[1] === "day-snapshot",
      });
    },
  });
}

export function useCreateAgendaException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => createAgendaExceptionAction(input),
    onSuccess: async () => {
      await qc.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "psychologist-agenda",
      });
    },
  });
}

/** Invalida listas de consultas do período visível (aproximação simples). */
export async function invalidateAgendaAppointmentQueries(
  qc: ReturnType<typeof useQueryClient>,
  localDate: string,
  timeZone: string,
) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: getAgendaAppointmentsDayKey(localDate, timeZone) }),
    qc.invalidateQueries({ queryKey: getAgendaAppointmentsWeekKey(localDate, timeZone) }),
    qc.invalidateQueries({ queryKey: getAgendaDaySnapshotKey(localDate, timeZone) }),
  ]);
}

export function useSetAppointmentStatus(localDate: string, timeZone: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => setPsychologistAppointmentStatusAction(input),
    onSuccess: async () => {
      await invalidateAgendaAppointmentQueries(qc, localDate, timeZone);
    },
  });
}

export function useCancelAppointment(localDate: string, timeZone: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CancelAppointmentInput) => cancelPsychologistAppointmentAction(input),
    onSuccess: async () => {
      await invalidateAgendaAppointmentQueries(qc, localDate, timeZone);
    },
  });
}

export function useRescheduleAppointment(localDate: string, timeZone: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RescheduleAppointmentInput) =>
      reschedulePsychologistAppointmentAction(input as unknown),
    onSuccess: async () => {
      await invalidateAgendaAppointmentQueries(qc, localDate, timeZone);
    },
  });
}
