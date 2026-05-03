"use server";

import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologistSocialLinks, psychologists } from "@/lib/db/schema";
import {
  normalizeSocialNetwork,
  normalizeSocialUrl,
  PSYCHOLOGIST_SOCIAL_NETWORKS,
  type PsychologistSocialNetwork,
} from "@/lib/psychologist-social-links";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PsychologistSocialLink, SavePsychologistSocialLinksInput } from "./types";

async function getSessionUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
}

async function getCurrentPsychologistId() {
  const { user, error } = await getSessionUser();
  if (error || !user) throw new Error("Nao autenticado.");

  const role = user.app_metadata?.role as string | undefined;
  if (role !== "PSYCHOLOGIST" && role !== "ADMIN") throw new Error("Sem permissao.");

  const [psy] = await db.select({ id: psychologists.id }).from(psychologists).where(eq(psychologists.userId, user.id)).limit(1);
  return psy?.id ?? null;
}

export async function getPsychologistSocialLinks(): Promise<PsychologistSocialLink[] | null> {
  const psychologistId = await getCurrentPsychologistId();
  if (!psychologistId) return null;

  const rows = await db
    .select({
      id: psychologistSocialLinks.id,
      network: psychologistSocialLinks.network,
      url: psychologistSocialLinks.url,
    })
    .from(psychologistSocialLinks)
    .where(eq(psychologistSocialLinks.psychologistId, psychologistId))
    .orderBy(asc(psychologistSocialLinks.sortOrder));

  return rows;
}

export async function savePsychologistSocialLinks(input: SavePsychologistSocialLinksInput) {
  const psychologistId = await getCurrentPsychologistId();
  if (!psychologistId) throw new Error("Perfil de psicologo nao encontrado.");

  const seen = new Set<PsychologistSocialNetwork>();
  const normalized: Array<{ network: PsychologistSocialNetwork; url: string }> = [];

  for (const row of input.links ?? []) {
    const network = normalizeSocialNetwork(row.network);
    const url = normalizeSocialUrl(row.url);

    if (!network && !url) continue;
    if (!network) throw new Error("Selecione uma rede social valida.");
    if (!url) throw new Error("Informe o link da rede social.");
    if (seen.has(network)) throw new Error("Cada rede social pode ser cadastrada apenas uma vez.");

    seen.add(network);
    normalized.push({ network, url });
  }

  normalized.sort(
    (a, b) =>
      PSYCHOLOGIST_SOCIAL_NETWORKS.indexOf(a.network) - PSYCHOLOGIST_SOCIAL_NETWORKS.indexOf(b.network),
  );

  await db.transaction(async (tx) => {
    await tx.delete(psychologistSocialLinks).where(eq(psychologistSocialLinks.psychologistId, psychologistId));

    for (let i = 0; i < normalized.length; i++) {
      await tx.insert(psychologistSocialLinks).values({
        psychologistId,
        network: normalized[i].network,
        url: normalized[i].url,
        sortOrder: i,
        updatedAt: new Date(),
      });
    }
  });

  return { ok: true };
}
