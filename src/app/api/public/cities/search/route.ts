import { and, notInArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { psychologists } from "@/lib/db/schema";

export type CityDbResult = {
  key: string;      // lower-trim city name — usado como parâmetro URL
  city: string;     // nome original, ex: "São Paulo"
  state: string;    // sigla UF, ex: "SP"
};

/**
 * Retorna cidades onde há psicólogos ativos no DB.
 * A busca pelo IBGE (todas as cidades brasileiras) é feita diretamente
 * no cliente pelo componente CityAutocomplete.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const specialtyParam = searchParams.get("especialidade") ?? undefined;

  try {
    const rows = await db
      .select({
        cityKey:   sql<string>`lower(trim(${psychologists.city}))`.mapWith(String),
        cityLabel: sql<string>`min(trim(${psychologists.city}))`.mapWith(String),
        stateLabel: sql<string>`min(trim(${psychologists.state}))`.mapWith(String),
      })
      .from(psychologists)
      .where(
        and(
          sql`coalesce(trim(${psychologists.city}), '') <> ''`,
          notInArray(psychologists.status, ["REJECTED", "INACTIVE"]),
          specialtyParam
            ? sql`exists (
                select 1 from psychologist_specialties ps
                inner join catalog_specialties cs on cs.id = ps.catalog_specialty_id
                where ps.psychologist_id = ${psychologists.id}
                and cs.slug = ${specialtyParam}
              )`
            : sql`1=1`,
        ),
      )
      .groupBy(sql`lower(trim(${psychologists.city}))`);

    const cities: CityDbResult[] = rows
      .filter((r) => r.cityKey?.trim())
      .map((r) => ({
        key:   r.cityKey,
        city:  r.cityLabel,
        state: r.stateLabel ?? "",
      }))
      .sort((a, b) => a.city.localeCompare(b.city, "pt-BR"));

    return NextResponse.json({ cities });
  } catch (e) {
    console.error("[cities/search]", e);
    return NextResponse.json({ cities: [] });
  }
}
