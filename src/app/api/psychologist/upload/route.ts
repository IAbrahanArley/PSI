import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PSYCHOLOGIST_STORAGE_BUCKET } from "@/lib/storage/psychologist-bucket";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase não configurado." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const role = user.app_metadata?.role as string | undefined;
  if (role !== "PSYCHOLOGIST" && role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "FormData inválido." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande (máx. 5MB)." }, { status: 400 });
  }

  const type = file.type || "application/octet-stream";
  if (!ALLOWED.has(type)) {
    return NextResponse.json({ error: "Tipo não permitido (use JPG, PNG, WebP ou GIF)." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upError } = await supabaseAdmin.storage
    .from(PSYCHOLOGIST_STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType: type,
      upsert: false,
    });

  if (upError) {
    return NextResponse.json(
      { error: upError.message || "Falha no upload. Verifique se o bucket existe no Supabase." },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(PSYCHOLOGIST_STORAGE_BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl, path });
}
