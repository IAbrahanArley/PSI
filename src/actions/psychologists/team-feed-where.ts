"use server";

import { and, notInArray, or, sql } from "drizzle-orm";
import { psychologists } from "@/lib/db/schema";
import { normalizeListingCity } from "@/lib/listing-city";
import { resolveSpecialtyFilterParam } from "./resolve-specialty-param";

/**
 * Combina filtros publicos para listagens (/team, home APIs):
 * status ativo + especialidade (catalogo por slug OU legado por label) + cidade + modalidade.
 */
export async function publicPsychologistListingWhere(opts: {
  specialtyParam?: string | null;
  cityParam?: string | null;
  modality?: "ONLINE" | "PRESENTIAL" | null;
}) {
  const statusOk = notInArray(psychologists.status, ["REJECTED", "INACTIVE"]);
  const { catalogSpecialtyId, legacyLabelNorm } = await resolveSpecialtyFilterParam(opts.specialtyParam ?? null);
  const cityNorm = normalizeListingCity(opts.cityParam ?? null);

  const parts: Parameters<typeof and>[number][] = [statusOk];

  if (catalogSpecialtyId) {
    parts.push(
      sql`exists (
        select 1 from psychologist_specialties ps
        where ps.psychologist_id = ${psychologists.id}
        and ps.catalog_specialty_id = ${catalogSpecialtyId}
      )`,
    );
  } else if (legacyLabelNorm) {
    const legacyOr = or(
      sql`exists (
        select 1 from psychologist_specialties ps
        where ps.psychologist_id = ${psychologists.id}
        and lower(trim(ps.label)) = ${legacyLabelNorm}
      )`,
      sql`lower(trim(coalesce(${psychologists.specialty}, ''))) = ${legacyLabelNorm}`,
    );
    if (legacyOr) parts.push(legacyOr);
  }

  if (cityNorm) {
    parts.push(sql`lower(trim(coalesce(${psychologists.city}, ''))) = ${cityNorm}`);
  }

  if (opts.modality === "ONLINE") {
    parts.push(sql`${psychologists.offersOnline} = true`);
  } else if (opts.modality === "PRESENTIAL") {
    parts.push(sql`${psychologists.offersPresential} = true`);
  }

  return and(...parts)!;
}
