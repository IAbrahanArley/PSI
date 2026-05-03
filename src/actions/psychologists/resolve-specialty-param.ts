import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { catalogSpecialties } from "@/lib/db/schema";

export type ResolvedSpecialtyFilter = {
  catalogSpecialtyId: string | null;
  legacyLabelNorm: string | null;
};

export async function resolveSpecialtyFilterParam(
  specialtyParam: string | null | undefined,
): Promise<ResolvedSpecialtyFilter> {
  if (!process.env.DATABASE_URL?.trim()) {
    return {
      catalogSpecialtyId: null,
      legacyLabelNorm: specialtyParam?.trim() ? specialtyParam.trim().toLowerCase() : null,
    };
  }

  if (specialtyParam == null) return { catalogSpecialtyId: null, legacyLabelNorm: null };
  const trimmed = specialtyParam.trim();
  if (!trimmed || trimmed.toLowerCase() === "todos") {
    return { catalogSpecialtyId: null, legacyLabelNorm: null };
  }

  const legacyFallback = (): ResolvedSpecialtyFilter => ({
    catalogSpecialtyId: null,
    legacyLabelNorm: trimmed.toLowerCase(),
  });

  try {
    const [bySlug] = await db
      .select({ id: catalogSpecialties.id })
      .from(catalogSpecialties)
      .where(and(eq(catalogSpecialties.slug, trimmed), eq(catalogSpecialties.isActive, true)))
      .limit(1);

    if (bySlug) return { catalogSpecialtyId: bySlug.id, legacyLabelNorm: null };

    const slugLower = trimmed.toLowerCase();
    const [bySlugLc] = await db
      .select({ id: catalogSpecialties.id })
      .from(catalogSpecialties)
      .where(and(eq(catalogSpecialties.slug, slugLower), eq(catalogSpecialties.isActive, true)))
      .limit(1);

    if (bySlugLc) return { catalogSpecialtyId: bySlugLc.id, legacyLabelNorm: null };

    const [byName] = await db
      .select({ id: catalogSpecialties.id })
      .from(catalogSpecialties)
      .where(
        and(
          sql`lower(trim(${catalogSpecialties.name})) = ${trimmed.toLowerCase()}`,
          eq(catalogSpecialties.isActive, true),
        ),
      )
      .limit(1);

    if (byName) return { catalogSpecialtyId: byName.id, legacyLabelNorm: null };

    return legacyFallback();
  } catch {
    return legacyFallback();
  }
}
