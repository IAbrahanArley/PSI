"use server";

import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { catalogSpecialties } from "@/lib/db/schema";

export type PublicCatalogSpecialtyOption = {
  slug: string;
  name: string;
};

/** Especialidades ativas no catálogo (dropdowns públicos por slug). */
export async function getPublicCatalogSpecialtyOptions(): Promise<PublicCatalogSpecialtyOption[]> {
  if (!process.env.DATABASE_URL?.trim()) return [];

  try {
    const rows = await db
      .select({ slug: catalogSpecialties.slug, name: catalogSpecialties.name })
      .from(catalogSpecialties)
      .where(eq(catalogSpecialties.isActive, true))
      .orderBy(asc(catalogSpecialties.sortOrder), asc(catalogSpecialties.name));

    return rows;
  } catch {
    return [];
  }
}
