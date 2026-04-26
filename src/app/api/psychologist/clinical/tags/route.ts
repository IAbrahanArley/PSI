import { NextResponse } from "next/server";
import { dbListClinicalTagsByPsychologist } from "@/lib/db/queries/psychologist-clinical.queries";
import { createClinicalTagSchema } from "@/lib/validation/clinical/clinical.schema";
import { createClinicalTagService } from "@/services/clinical/clinical-tags.service";
import { requirePsychologist, PsychologistAuthError } from "@/server/auth/require-psychologist";

export async function GET() {
  try {
    const ctx = await requirePsychologist();
    const tags = await dbListClinicalTagsByPsychologist(ctx.psychologistId);
    return NextResponse.json({ tags });
  } catch (e) {
    if (e instanceof PsychologistAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("autenticado") ? 401 : 403 });
    }
    throw e;
  }
}

export async function POST(req: Request) {
  try {
    const ctx = await requirePsychologist();
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }
    const parsed = createClinicalTagSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 422 });
    }
    const tag = await createClinicalTagService(ctx, parsed.data);
    return NextResponse.json({ tag }, { status: 201 });
  } catch (e) {
    if (e instanceof PsychologistAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("autenticado") ? 401 : 403 });
    }
    const msg = e instanceof Error ? e.message : "Erro ao criar tag.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
