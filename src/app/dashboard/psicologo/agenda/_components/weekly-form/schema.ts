import { z } from "zod";
import type { WeeklyScheduleFormValues } from "./types";

const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm");

const weeklyBlockSchema = z
  .object({
    startTime: timeStringSchema,
    endTime: timeStringSchema,
    modality: z.enum(["ONLINE", "PRESENTIAL"]),
    addressId: z.string().uuid().nullable(),
    sessionDurationMinutes: z
      .number("Informe a duração da sessão.")
      .int("Use minutos inteiros.")
      .min(15, "Duração mínima de 15 min.")
      .max(180, "Duração máxima de 180 min."),
    bufferBetweenSessionsMinutes: z
      .number("Informe o buffer entre sessões.")
      .int("Use minutos inteiros.")
      .min(0, "Buffer mínimo de 0 min.")
      .max(120, "Buffer máximo de 120 min."),
    isActive: z.boolean(),
  })
  .superRefine((block, ctx) => {
    if (block.endTime <= block.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Hora final deve ser maior que hora inicial.",
        path: ["endTime"],
      });
    }

    if (block.modality === "PRESENTIAL" && !block.addressId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Endereço é obrigatório para bloco presencial.",
        path: ["addressId"],
      });
    }

    if (block.modality === "ONLINE" && block.addressId !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bloco online não deve ter endereço.",
        path: ["addressId"],
      });
    }
  });

export const weeklyScheduleFormSchema = z
  .object({
    weekday: z.number().int().min(0).max(6),
    blocks: z.array(weeklyBlockSchema).min(1, "Adicione ao menos um bloco."),
  })
  .superRefine((form, ctx) => {
    for (let i = 0; i < form.blocks.length; i += 1) {
      const current = form.blocks[i];
      for (let j = i + 1; j < form.blocks.length; j += 1) {
        const compared = form.blocks[j];

        const currentInsideCompared =
          current.startTime >= compared.startTime && current.endTime <= compared.endTime;
        const comparedInsideCurrent =
          compared.startTime >= current.startTime && compared.endTime <= current.endTime;

        if (currentInsideCompared || comparedInsideCurrent) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Existem blocos totalmente sobrepostos no mesmo dia.",
            path: ["blocks", j, "startTime"],
          });
        }
      }
    }
  });

export type WeeklyScheduleFormSchema = z.infer<typeof weeklyScheduleFormSchema>;

export const defaultWeeklyBlock: WeeklyScheduleFormValues["blocks"][number] = {
  startTime: "09:00",
  endTime: "12:00",
  modality: "ONLINE",
  addressId: null,
  sessionDurationMinutes: 50,
  bufferBetweenSessionsMinutes: 10,
  isActive: true,
};
