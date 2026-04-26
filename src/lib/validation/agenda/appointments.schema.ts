import { z } from "zod";

export const appointmentModalitySchema = z.enum(["ONLINE", "PRESENTIAL"]);

export const createAppointmentSchema = z
  .object({
    patientId: z.string().uuid(),
    modality: appointmentModalitySchema,
    addressId: z.string().uuid().nullable().optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    title: z.string().max(500).nullable().optional(),
    notes: z.string().max(5000).nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.endsAt <= val.startsAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "endsAt deve ser após startsAt.", path: ["endsAt"] });
    }
    if (val.modality === "ONLINE" && val.addressId != null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Online sem endereço.", path: ["addressId"] });
    }
    if (val.modality === "PRESENTIAL" && !val.addressId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Presencial exige addressId.",
        path: ["addressId"],
      });
    }
  });

export const listAppointmentsByDaySchema = z.object({
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** IANA, ex.: America/Sao_Paulo — delimita o dia civil para filtro em timestamptz */
  timeZone: z.string().min(1),
});

/** Qualquer dia da semana; o backend usa a semana dominical que contém esta data. */
export const listAppointmentsByWeekSchema = z.object({
  anchorLocalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeZone: z.string().min(1),
});

export const setAppointmentStatusSchema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum(["CONFIRMED", "COMPLETED"]),
});

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid(),
  reason: z.string().max(2000).optional(),
});

export const rescheduleAppointmentSchema = z
  .object({
    appointmentId: z.string().uuid(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .superRefine((val, ctx) => {
    if (val.endsAt <= val.startsAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "endsAt deve ser após startsAt.", path: ["endsAt"] });
    }
  });

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type ListAppointmentsByDayInput = z.infer<typeof listAppointmentsByDaySchema>;
export type ListAppointmentsByWeekInput = z.infer<typeof listAppointmentsByWeekSchema>;
export type SetAppointmentStatusInput = z.infer<typeof setAppointmentStatusSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
