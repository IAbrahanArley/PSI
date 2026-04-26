import { z } from "zod";

const timeString = z
  .string()
  .regex(/^([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Use HH:mm ou HH:mm:ss");

export const weeklyRuleModalitySchema = z.enum(["ONLINE", "PRESENTIAL"]);
export const weeklyRuleTypeSchema = z.enum(["AVAILABLE", "UNAVAILABLE"]);

/** Objeto cru — sem refinamento — para permitir `.partial()` no update (Zod 4). */
const weeklyRuleFieldsSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: timeString,
  endTime: timeString,
  ruleType: weeklyRuleTypeSchema.default("AVAILABLE"),
  modality: weeklyRuleModalitySchema,
  addressId: z.string().uuid().nullable().optional(),
  sortOrder: z.number().int().min(0).max(32767).optional(),
  isActive: z.boolean().optional(),
});

function refineWeeklyModalityAddress<T extends { modality?: unknown; addressId?: string | null | undefined }>(
  val: T,
  ctx: z.RefinementCtx,
  opts: { partial: boolean },
) {
  if (val.modality === "ONLINE" && val.addressId != null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Atendimento online não pode ter endereço.",
      path: ["addressId"],
    });
  }
  if (val.modality === "PRESENTIAL") {
    if (opts.partial) {
      if (val.addressId === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Presencial exige endereço quando addressId é enviado como null.",
          path: ["addressId"],
        });
      }
    } else if (!val.addressId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Atendimento presencial exige addressId.",
        path: ["addressId"],
      });
    }
  }
}

export const createWeeklyRuleSchema = weeklyRuleFieldsSchema.superRefine((val, ctx) => {
  refineWeeklyModalityAddress(val, ctx, { partial: false });
});

export const updateWeeklyRuleSchema = weeklyRuleFieldsSchema
  .partial()
  .extend({
    id: z.string().uuid(),
  })
  .superRefine((val, ctx) => {
    refineWeeklyModalityAddress(val, ctx, { partial: true });
  });

export const deleteWeeklyRuleSchema = z.object({
  id: z.string().uuid(),
});

export type CreateWeeklyRuleInput = z.infer<typeof createWeeklyRuleSchema>;
export type UpdateWeeklyRuleInput = z.infer<typeof updateWeeklyRuleSchema>;
export type DeleteWeeklyRuleInput = z.infer<typeof deleteWeeklyRuleSchema>;
