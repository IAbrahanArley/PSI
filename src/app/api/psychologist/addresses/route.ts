import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologistAddresses, psychologists } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}

type AddressInput = {
  label?: string;
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  complement?: string | null;
  reference?: string | null;
};

export async function GET() {
  const { user, error } = await getSessionUser();
  if (error || !user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const role = user.app_metadata?.role as string | undefined;
  if (role !== "PSYCHOLOGIST" && role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const [psy] = await db.select().from(psychologists).where(eq(psychologists.userId, user.id)).limit(1);
  if (!psy) return NextResponse.json({ error: "Perfil de psicólogo não encontrado." }, { status: 404 });

  const addresses = await db
    .select()
    .from(psychologistAddresses)
    .where(eq(psychologistAddresses.psychologistId, psy.id))
    .orderBy(asc(psychologistAddresses.sortOrder));

  return NextResponse.json({
    addresses: addresses.map((a) => ({
      id: a.id,
      label: a.label,
      street: a.street,
      number: a.number,
      neighborhood: a.neighborhood,
      city: a.city,
      state: a.state,
      zipCode: a.zipCode,
      complement: a.complement,
      reference: a.reference,
    })),
  });
}

export async function PUT(req: Request) {
  const { user, error } = await getSessionUser();
  if (error || !user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const role = user.app_metadata?.role as string | undefined;
  if (role !== "PSYCHOLOGIST" && role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  let body: { addresses?: AddressInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const [psy] = await db.select().from(psychologists).where(eq(psychologists.userId, user.id)).limit(1);
  if (!psy) return NextResponse.json({ error: "Perfil de psicólogo não encontrado." }, { status: 404 });

  const addressesIn = (body.addresses ?? []).map((a) => ({
    label: String(a.label ?? "").trim(),
    street: String(a.street ?? "").trim() || null,
    number: String(a.number ?? "").trim() || null,
    neighborhood: String(a.neighborhood ?? "").trim() || null,
    city: String(a.city ?? "").trim() || null,
    state: String(a.state ?? "").trim() || null,
    zipCode: String(a.zipCode ?? "").trim() || null,
    complement: String(a.complement ?? "").trim() || null,
    reference: String(a.reference ?? "").trim() || null,
  }));

  try {
    await db.transaction(async (tx) => {
      await tx.delete(psychologistAddresses).where(eq(psychologistAddresses.psychologistId, psy.id));
      for (let i = 0; i < addressesIn.length; i++) {
        const a = addressesIn[i];
        if (!a.label) continue;
        await tx.insert(psychologistAddresses).values({
          psychologistId: psy.id,
          label: a.label,
          street: a.street,
          number: a.number,
          neighborhood: a.neighborhood,
          city: a.city,
          state: a.state,
          zipCode: a.zipCode,
          complement: a.complement,
          reference: a.reference,
          sortOrder: i,
          updatedAt: new Date(),
        });
      }
    });
  } catch {
    return NextResponse.json({ error: "Erro ao salvar endereços." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
