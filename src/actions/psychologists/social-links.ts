import { asc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { psychologistSocialLinks } from "@/lib/db/schema";
import type { PublicPsychologistSocialLink } from "./types";

export async function getPublicSocialLinksByPsychologistIds(ids: string[]) {
  const result = new Map<string, PublicPsychologistSocialLink[]>();

  if (ids.length === 0) return result;

  const rows = await db
    .select({
      psychologistId: psychologistSocialLinks.psychologistId,
      network: psychologistSocialLinks.network,
      url: psychologistSocialLinks.url,
    })
    .from(psychologistSocialLinks)
    .where(inArray(psychologistSocialLinks.psychologistId, ids))
    .orderBy(asc(psychologistSocialLinks.psychologistId), asc(psychologistSocialLinks.sortOrder));

  for (const row of rows) {
    const links = result.get(row.psychologistId) ?? [];
    links.push({ network: row.network, url: row.url });
    result.set(row.psychologistId, links);
  }

  return result;
}
