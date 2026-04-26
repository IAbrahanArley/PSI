import { z } from "zod";

export const publicBookAppointmentBodySchema = z
  .object({
    fullName: z.string().min(2).max(200),
    email: z.string().email().max(320),
    phone: z.string().min(8).max(40),
    message: z.string().max(2000).optional().nullable(),
    startsAtIso: z.string().min(1),
    endsAtIso: z.string().min(1),
    modality: z.enum(["ONLINE", "PRESENTIAL"]),
    addressId: z.string().uuid().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.modality === "PRESENTIAL" && !data.addressId) {
      ctx.addIssue({
        code: "custom",
        message: "Endereço obrigatório para atendimento presencial.",
        path: ["addressId"],
      });
    }
    if (data.modality === "ONLINE" && data.addressId) {
      ctx.addIssue({
        code: "custom",
        message: "Consulta online não deve informar endereço.",
        path: ["addressId"],
      });
    }
  });

export type PublicBookAppointmentBody = z.infer<typeof publicBookAppointmentBodySchema>;
