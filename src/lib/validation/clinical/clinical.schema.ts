import { z } from "zod";

export const patientCareStatusSchema = z.enum(["ACTIVE", "PAUSED", "DISCHARGED"]);

export const clinicalNoteTypeSchema = z.enum([
  "PROGRESS",
  "SESSION",
  "ADMINISTRATIVE",
  "RISK_OR_SAFETY",
  "OTHER",
]);

export const createClinicalNoteSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string().max(500).optional().nullable(),
  body: z.string().min(1).max(50_000),
  noteType: clinicalNoteTypeSchema.optional(),
  appointmentId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).max(20).optional(),
});

export const listClinicalNotesQuerySchema = z
  .object({
    patientId: z.string().uuid(),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    cursorCreatedAt: z.string().min(1).optional(),
    cursorId: z.string().uuid().optional(),
  })
  .refine(
    (d) =>
      (Boolean(d.cursorCreatedAt) && Boolean(d.cursorId)) ||
      (!d.cursorCreatedAt && !d.cursorId),
    { message: "Use cursorCreatedAt e cursorId juntos.", path: ["cursorId"] },
  );

export const searchClinicalNotesQuerySchema = z.object({
  q: z.string().min(2).max(200),
  patientId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const pinClinicalNoteSchema = z.object({
  pinned: z.boolean(),
});

export const updatePatientCareSchema = z.object({
  status: patientCareStatusSchema.optional(),
  clinicalSummary: z.string().max(10_000).optional().nullable(),
});

export const createClinicalTagSchema = z.object({
  label: z.string().min(1).max(80).trim(),
  color: z.string().max(32).optional().nullable(),
});
