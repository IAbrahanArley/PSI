import { NextResponse } from "next/server";
import { dbListRecentAppointmentsForPatient } from "@/lib/db/queries/agenda/appointments.queries";
import { dbPsychologistHasPatientLink } from "@/lib/db/queries/psychologist-clinical.queries";
import { requirePsychologist, PsychologistAuthError } from "@/server/auth/require-psychologist";

export async function GET(req: Request, ctx: { params: Promise<{ patientId: string }> }) {
  try {
    const session = await requirePsychologist();
    const { patientId } = await ctx.params;
    const linked = await dbPsychologistHasPatientLink(session.psychologistId, patientId);
    if (!linked) {
      return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
    }
    const limit = Math.min(
      30,
      Math.max(1, Number.parseInt(new URL(req.url).searchParams.get("limit") ?? "15", 10) || 15),
    );
    const appointments = await dbListRecentAppointmentsForPatient(
      session.psychologistId,
      patientId,
      limit,
    );
    return NextResponse.json({ appointments });
  } catch (e) {
    if (e instanceof PsychologistAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("autenticado") ? 401 : 403 });
    }
    throw e;
  }
}
