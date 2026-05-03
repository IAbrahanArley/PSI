import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { catalogSpecialties } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { slugifyCatalogName } from "@/lib/slugify-catalog";
import { AdminAuthError, requireAdmin } from "@/server/auth/require-admin";

type PatchBody = {
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  slug?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

async function slugFree(slug: string, excludeId: string): Promise<boolean> {
  const [row] = await db.select({ id: catalogSpecialties.id }).from(catalogSpecialties).where(eq(catalogSpecialties.slug, slug)).limit(1);
  return !row || row.id === excludeId;
}

async function uniqueSlugUpdate(base: string, excludeId: string): Promise<string> {
  let s = slugifyCatalogName(base);
  if (await slugFree(s, excludeId)) return s;
  for (let n = 2; n < 500; n++) {
    const trySlug = `${s}-${n}`;
    if (await slugFree(trySlug, excludeId)) return trySlug;
  }
  return `${s}-${Date.now().toString(36)}`;
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof AdminAuthError ? e.message : "Sem permissão.";
    const status = msg === "Não autenticado." ? 401 : 403;
    return NextResponse.json({ error: msg }, { status });
  }

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const [existing] = await db.select().from(catalogSpecialties).where(eq(catalogSpecialties.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  const patch: {
    slug?: string;
    name?: string;
    description?: string | null;
    imageUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
    updatedAt: Date;
  } = { updatedAt: new Date() };

  if (body.name != null) {
    const name = body.name.trim();
    if (name.length < 2) return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
    patch.name = name;
  }

  if (body.description !== undefined) {
    patch.description = body.description?.trim() || null;
  }
  if (body.imageUrl !== undefined) {
    patch.imageUrl = body.imageUrl?.trim() || null;
  }
  if (typeof body.sortOrder === "number" && Number.isFinite(body.sortOrder)) {
    patch.sortOrder = Math.floor(body.sortOrder);
  }
  if (typeof body.isActive === "boolean") {
    patch.isActive = body.isActive;
  }

  if (body.slug != null && body.slug.trim()) {
    const nextSlug = await uniqueSlugUpdate(body.slug.trim(), id);
    patch.slug = nextSlug;
  } else if (body.name != null && body.slug === undefined) {
    // manter slug estável ao renomear
  }

  try {
    await db.update(catalogSpecialties).set(patch).where(eq(catalogSpecialties.id, id));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 });
  }
}
