import { z } from "zod";
import type { AgendaExceptionFormValues } from "./types";

const ymdSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use data no formato YYYY-MM-DD.");
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use hora no formato HH:mm.");

export const agendaExceptionFormSchema = z
  .object({
    exceptionDate: ymdSchema,
    kind: z.enum(["INACTIVE_DAY", "INACTIVE_INTERVAL", "ACTIVE_OVERRIDE_INTERVAL"]),
    modality: z.enum(["ONLINE", "PRESENTIAL"]),
    addressId: z.string().uuid().nullable(),
    startTime: timeSchema.nullable(),
    endTime: timeSchema.nullable(),
    note: z.string().max(2000, "Máximo de 2000 caracteres."),
    isActive: z.boolean(),
  })
  .superRefine((val, ctx) => {
    const isInterval = val.kind !== "INACTIVE_DAY";

    if (!isInterval && (val.startTime !== null || val.endTime !== null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Dia inteiro indisponível não deve ter horários.",
        path: ["startTime"],
      });
    }

    if (isInterval && (val.startTime === null || val.endTime === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Intervalo exige hora inicial e final.",
        path: ["startTime"],
      });
    }

    if (val.startTime && val.endTime && val.endTime <= val.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hora final deve ser maior que hora inicial.",
        path: ["endTime"],
      });
    }

    if (val.modality === "PRESENTIAL" && !val.addressId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Endereço é obrigatório para modalidade presencial.",
        path: ["addressId"],
      });
    }

    if (val.modality === "ONLINE" && val.addressId !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Modalidade online não deve ter endereço.",
        path: ["addressId"],
      });
    }
  });

export const defaultAgendaExceptionFormValues: AgendaExceptionFormValues = {
  exceptionDate: new Date().toLocaleDateString("en-CA"),
  kind: "INACTIVE_DAY",
  modality: "ONLINE",
  addressId: null,
  startTime: null,
  endTime: null,
  note: "",
  isActive: true,
};
