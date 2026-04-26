"use server";

import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologistAddresses, psychologists } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PsychologistAddress, SavePsychologistAddressesInput } from "./types";

async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}

export async function getPsychologistAddresses(): Promise<PsychologistAddress[] | null> {
  const { user, error } = await getSessionUser();
  if (error || !user) throw new Error("Não autenticado.");

  const role = user.app_metadata?.role as string | undefined;
  if (role !== "PSYCHOLOGIST" && role !== "ADMIN") throw new Error("Sem permissão.");

  const [psy] = await db.select().from(psychologists).where(eq(psychologists.userId, user.id)).limit(1);
  if (!psy) return null;

  const addresses = await db
    .select()
    .from(psychologistAddresses)
    .where(eq(psychologistAddresses.psychologistId, psy.id))
    .orderBy(asc(psychologistAddresses.sortOrder));

  return addresses.map((a) => ({
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
  }));
}

export async function savePsychologistAddresses(input: SavePsychologistAddressesInput) {
  const { user, error } = await getSessionUser();
  if (error || !user) throw new Error("Não autenticado.");

  const role = user.app_metadata?.role as string | undefined;
  if (role !== "PSYCHOLOGIST" && role !== "ADMIN") throw new Error("Sem permissão.");

  const [psy] = await db.select().from(psychologists).where(eq(psychologists.userId, user.id)).limit(1);
  if (!psy) throw new Error("Perfil de psicólogo não encontrado.");

  const addressesIn = (input.addresses ?? []).map((a) => ({
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

  return { ok: true };
}
