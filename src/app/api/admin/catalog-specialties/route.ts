import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { catalogSpecialties } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { slugifyCatalogName } from "@/lib/slugify-catalog";
import { AdminAuthError, requireAdmin } from "@/server/auth/require-admin";

async function slugFreeForCreate(slug: string): Promise<boolean> {
  const [row] = await db.select({ id: catalogSpecialties.id }).from(catalogSpecialties).where(eq(catalogSpecialties.slug, slug)).limit(1);
  return !row;
}

async function uniqueSlug(base: string): Promise<string> {
  let s = slugifyCatalogName(base);
  if (await slugFreeForCreate(s)) return s;
  for (let n = 2; n < 500; n++) {
    const trySlug = `${s}-${n}`;
    if (await slugFreeForCreate(trySlug)) return trySlug;
  }
  return `${s}-${Date.now().toString(36)}`;
}

/** Lista completa para o painel admin (ativas e inativas). */
export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof AdminAuthError ? e.message : "Sem permissão.";
    const status = msg === "Não autenticado." ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  try {
    const rows = await db.select().from(catalogSpecialties).orderBy(
      asc(catalogSpecialties.sortOrder),
      asc(catalogSpecialties.name),
    );
    return NextResponse.json({ items: rows });
  } catch {
    return NextResponse.json({ error: "Erro ao listar." }, { status: 500 });
  }
}

type PostBody = {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  slug?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof AdminAuthError ? e.message : "Sem permissão.";
    const status = msg === "Não autenticado." ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  let body: PostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (name.length < 2) {
    return NextResponse.json({ error: "Informe o nome da especialidade." }, { status: 400 });
  }

  const slugIn = body.slug?.trim();
  const slugBase = slugIn || name;
  const slug = await uniqueSlug(slugBase);

  const description = body.description?.trim() || null;
  const imageUrl = body.imageUrl?.trim() || null;
  const sortOrder =
    typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder) ? Math.floor(body.sortOrder) : 0;
  const isActive = body.isActive !== false;

  try {
    const [inserted] = await db
      .insert(catalogSpecialties)
      .values({
        slug,
        name,
        description,
        imageUrl,
        sortOrder,
        isActive,
        updatedAt: new Date(),
      })
      .returning({ id: catalogSpecialties.id });

    return NextResponse.json({ ok: true, id: inserted?.id });
  } catch {
    return NextResponse.json({ error: "Erro ao criar especialidade." }, { status: 500 });
  }
}
