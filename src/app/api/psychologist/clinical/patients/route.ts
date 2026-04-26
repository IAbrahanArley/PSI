import { NextResponse } from "next/server";
import { listPatientsForPsychologistService } from "@/services/clinical/clinical-patients.service";
import { requirePsychologist, PsychologistAuthError } from "@/server/auth/require-psychologist";

export async function GET(req: Request) {
  try {
    const ctx = await requirePsychologist();
    const q = new URL(req.url).searchParams.get("q")?.trim() || undefined;
    const patients = await listPatientsForPsychologistService(ctx, q);
    return NextResponse.json({ patients });
  } catch (e) {
    if (e instanceof PsychologistAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("autenticado") ? 401 : 403 });
    }
    throw e;
  }
}
