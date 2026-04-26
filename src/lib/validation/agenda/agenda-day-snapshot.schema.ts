import { z } from "zod";

export const getAgendaDaySnapshotSchema = z.object({
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeZone: z.string().min(1),
});

export type GetAgendaDaySnapshotInput = z.infer<typeof getAgendaDaySnapshotSchema>;
