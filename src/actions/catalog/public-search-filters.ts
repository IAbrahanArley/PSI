"use server";

import { and, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologists } from "@/lib/db/schema";
import {
  getPublicCatalogSpecialtyOptions,
  type PublicCatalogSpecialtyOption,
} from "@/actions/psychologists/get-public-specialty-options";

export type PublicCityOption = {
  /** Valor para query `cidade` (lower(trim)) */
  key: string;
  /** Rótulo exibido */
  label: string;
};

export type PublicSearchFilters = {
  specialties: PublicCatalogSpecialtyOption[];
  cities: PublicCityOption[];
};

/**
 * Filtra psicólogos publicáveis (`city` em `psychologists`).
 * Preferência: endereços do perfil só entram quando `psychologists.city` for preenchido (fluxo atual).
 */
export async function getPublicSearchFilters(): Promise<PublicSearchFilters> {
  try {
    const [specialties, cityRows] = await Promise.all([
      getPublicCatalogSpecialtyOptions(),
      !process.env.DATABASE_URL?.trim()
        ? Promise.resolve<Array<{ cityKey: string; cityLabel: string }>>([])
        : db
            .select({
              cityKey: sql<string>`lower(trim(${psychologists.city}))`.mapWith(String),
              cityLabel: sql<string>`min(trim(${psychologists.city}))`.mapWith(String),
            })
            .from(psychologists)
            .where(
              and(
                sql`coalesce(trim(${psychologists.city}), '') <> ''`,
                notInArray(psychologists.status, ["REJECTED", "INACTIVE"]),
              ),
            )
            .groupBy(sql`lower(trim(${psychologists.city}))`),
    ]);

    const cities: PublicCityOption[] = cityRows
      .filter((r) => r.cityKey?.trim())
      .map((r) => ({ key: r.cityKey, label: r.cityLabel }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

    return { specialties, cities };
  } catch {
    return { specialties: [], cities: [] };
  }
}
