import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { PsychologistAuthError, requirePsychologist } from "@/server/auth/require-psychologist";
import { db } from "@/lib/db";
import { patientAnamnesis, patients, psychologistAppointments, psychologistPatientCare } from "@/lib/db/schema";

type Ctx = { params: Promise<{ patientId: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const session = await requirePsychologist();
    const { patientId } = await ctx.params;

    // Verifica vínculo (agendamento ou care)
    const [ap] = await db
      .select({ id: psychologistAppointments.id })
      .from(psychologistAppointments)
      .where(
        and(
          eq(psychologistAppointments.psychologistId, session.psychologistId),
          eq(psychologistAppointments.patientId, patientId),
        ),
      )
      .limit(1);

    if (!ap) {
      const [care] = await db
        .select({ id: psychologistPatientCare.id })
        .from(psychologistPatientCare)
        .where(
          and(
            eq(psychologistPatientCare.psychologistId, session.psychologistId),
            eq(psychologistPatientCare.patientId, patientId),
          ),
        )
        .limit(1);
      if (!care) {
        return NextResponse.json({ error: "Paciente não encontrado ou sem vínculo." }, { status: 404 });
      }
    }

    // Dados do paciente
    const [pat] = await db
      .select({
        id: patients.id,
        fullName: patients.fullName,
        email: patients.email,
        phone: patients.phone,
        whatsapp: patients.whatsapp,
        birthDate: patients.birthDate,
        gender: patients.gender,
        state: patients.state,
        city: patients.city,
        avatarUrl: patients.avatarUrl,
        createdAt: patients.createdAt,
      })
      .from(patients)
      .where(eq(patients.id, patientId))
      .limit(1);

    if (!pat) {
      return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
    }

    // Anamnese (pode ser null se não preenchida)
    const [anamnesis] = await db
      .select()
      .from(patientAnamnesis)
      .where(eq(patientAnamnesis.patientId, patientId))
      .limit(1);

    return NextResponse.json({
      patient: pat,
      anamnesis: anamnesis ?? null,
    });
  } catch (e) {
    if (e instanceof PsychologistAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("autenticado") ? 401 : 403 });
    }
    console.error("[clinical/patients/[patientId]/profile GET]", e);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
