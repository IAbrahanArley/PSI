import { z } from "zod";

const timeString = z
  .string()
  .regex(/^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Use HH:mm ou HH:mm:ss");

export const agendaExceptionKindSchema = z.enum([
  "INACTIVE_DAY",
  "INACTIVE_INTERVAL",
  "ACTIVE_OVERRIDE_INTERVAL",
]);

export const createAgendaExceptionSchema = z
  .object({
    exceptionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    kind: agendaExceptionKindSchema,
    startTime: timeString.nullable().optional(),
    endTime: timeString.nullable().optional(),
    addressId: z.string().uuid().nullable().optional(),
    note: z.string().max(2000).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.kind === "INACTIVE_DAY") {
      if (val.startTime != null || val.endTime != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "INACTIVE_DAY não deve ter horários.",
          path: ["startTime"],
        });
      }
    } else {
      if (val.startTime == null || val.endTime == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Intervalo exige startTime e endTime.",
          path: ["startTime"],
        });
      }
    }
  });

export const listExceptionsByPeriodSchema = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type CreateAgendaExceptionInput = z.infer<typeof createAgendaExceptionSchema>;
export type ListExceptionsByPeriodInput = z.infer<typeof listExceptionsByPeriodSchema>;
