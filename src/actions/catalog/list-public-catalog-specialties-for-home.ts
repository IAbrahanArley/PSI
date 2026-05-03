"use server";

import { and, asc, countDistinct, eq, isNotNull, notInArray } from "drizzle-orm";
import type { HomeCatalogSpecialtyCard } from "@/types/home-catalog-specialty";
import { db } from "@/lib/db";
import { catalogSpecialties, psychologistSpecialties, psychologists } from "@/lib/db/schema";

export async function listPublicCatalogSpecialtiesForHome(): Promise<HomeCatalogSpecialtyCard[]> {
  if (!process.env.DATABASE_URL?.trim()) return [];

  try {
    const catalogs = await db
      .select({
        id: catalogSpecialties.id,
        slug: catalogSpecialties.slug,
        name: catalogSpecialties.name,
        description: catalogSpecialties.description,
        imageUrl: catalogSpecialties.imageUrl,
        sortOrder: catalogSpecialties.sortOrder,
      })
      .from(catalogSpecialties)
      .where(eq(catalogSpecialties.isActive, true))
      .orderBy(asc(catalogSpecialties.sortOrder), asc(catalogSpecialties.name));

    if (!catalogs.length) return [];

    const activePsychStatuses = ["REJECTED", "INACTIVE"] as const;

    const countRows = await db
      .select({
        catalogId: psychologistSpecialties.catalogSpecialtyId,
        c: countDistinct(psychologists.id),
      })
      .from(psychologistSpecialties)
      .innerJoin(psychologists, eq(psychologistSpecialties.psychologistId, psychologists.id))
      .where(
        and(
          isNotNull(psychologistSpecialties.catalogSpecialtyId),
          notInArray(psychologists.status, [...activePsychStatuses]),
        ),
      )
      .groupBy(psychologistSpecialties.catalogSpecialtyId);

    const byId = new Map<string, number>();
    for (const r of countRows) {
      if (r.catalogId) byId.set(r.catalogId, Number(r.c ?? 0));
    }

    return catalogs.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      description: c.description ?? null,
      imageUrl: c.imageUrl ?? null,
      psychologistCount: byId.get(c.id) ?? 0,
      sortOrder: c.sortOrder,
    }));
  } catch {
    return [];
  }
}
