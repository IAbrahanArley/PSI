import { NextResponse } from "next/server";
import { getPatientCareService, updatePatientCareService } from "@/services/clinical/patient-care.service";
import { requirePsychologist, PsychologistAuthError } from "@/server/auth/require-psychologist";
import { updatePatientCareSchema } from "@/lib/validation/clinical/clinical.schema";

export async function GET(_req: Request, ctx: { params: Promise<{ patientId: string }> }) {
  try {
    const session = await requirePsychologist();
    const { patientId } = await ctx.params;
    const care = await getPatientCareService(session, patientId);
    return NextResponse.json({ care });
  } catch (e) {
    if (e instanceof PsychologistAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("autenticado") ? 401 : 403 });
    }
    if (e instanceof Error && e.message.includes("Paciente não encontrado")) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    throw e;
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ patientId: string }> }) {
  try {
    const session = await requirePsychologist();
    const { patientId } = await ctx.params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }
    const parsed = updatePatientCareSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 422 });
    }
    const care = await updatePatientCareService(session, patientId, parsed.data);
    return NextResponse.json({ care });
  } catch (e) {
    if (e instanceof PsychologistAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("autenticado") ? 401 : 403 });
    }
    if (e instanceof Error && e.message.includes("Paciente não encontrado")) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    const msg = e instanceof Error ? e.message : "Erro ao atualizar.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
