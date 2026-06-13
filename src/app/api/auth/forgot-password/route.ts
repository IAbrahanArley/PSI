import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { supabaseAdmin } from "@/lib/db/supabase/admin";
import type { UserRole } from "@/lib/auth/roles";
import { sendResendEmail } from "@/lib/email/resend";

type Body = {
  email?: string;
  profile?: "paciente" | "psicologo" | "admin";
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resolveAppBaseUrl(req: Request): string {
  const envBase = process.env.APP_BASE_URL?.trim();
  if (envBase) return envBase.replace(/\/+$/, "");

  const headerHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const headerProto = req.headers.get("x-forwarded-proto") ?? "http";
  if (headerHost) return `${headerProto}://${headerHost}`;

  return "http://localhost:3000";
}

function roleFromProfile(profile?: Body["profile"]): UserRole | null {
  if (profile === "paciente") return "PATIENT";
  if (profile === "psicologo") return "PSYCHOLOGIST";
  if (profile === "admin") return "ADMIN";
  return null;
}

function recoverySubject(profile?: Body["profile"]) {
  if (profile === "psicologo") return "Recuperacao de senha - Area do psicologo";
  if (profile === "paciente") return "Recuperacao de senha - Area do paciente";
  return "Recuperacao de senha";
}

function recoveryHtml(actionLink: string, baseUrl: string) {
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#1f1f1f">
      <h2 style="margin-bottom:8px">Recuperacao de senha</h2>
      <p>Recebemos uma solicitacao para redefinir sua senha.</p>
      <p>
        <a href="${actionLink}" style="display:inline-block;padding:10px 16px;background:#6c3a91;color:#fff;text-decoration:none;border-radius:6px">
          Redefinir senha
        </a>
      </p>
      <p>Se o botao nao funcionar, copie e cole este link no navegador:</p>
      <p style="word-break:break-all">${actionLink}</p>
      <p style="color:#666;font-size:13px">Se voce nao solicitou isso, pode ignorar este e-mail.</p>
      <p style="color:#666;font-size:13px">Amyre • ${baseUrl}</p>
    </div>
  `;
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL?.trim()) {
    return NextResponse.json({ error: "DATABASE_URL nao configurada." }, { status: 503 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase Auth nao configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 503 },
    );
  }
  if (!process.env.RESEND_API_KEY?.trim() || !process.env.RESEND_FROM_EMAIL?.trim()) {
    return NextResponse.json(
      { error: "Resend nao configurado (RESEND_API_KEY / RESEND_FROM_EMAIL)." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const wantedRole = roleFromProfile(body.profile);
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: true });
  }

  const [row] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      role: users.role,
    })
    .from(users)
    .where(sql`lower(trim(${users.email})) = ${email}`)
    .limit(1);

  if (!row) {
    return NextResponse.json({ ok: true });
  }

  if (wantedRole && row.role !== wantedRole && row.role !== "ADMIN") {
    return NextResponse.json({ ok: true });
  }

  const baseUrl = resolveAppBaseUrl(req);
  const redirectTo = `${baseUrl}/redefinir-senha`;

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: row.email,
    options: { redirectTo },
  });

  if (error) {
    return NextResponse.json({ ok: true });
  }

  const actionLink =
    data?.properties?.action_link ??
    (data as { action_link?: string } | null)?.action_link ??
    null;

  if (!actionLink) {
    return NextResponse.json({ ok: true });
  }

  try {
    await sendResendEmail({
      to: row.email,
      subject: recoverySubject(body.profile),
      html: recoveryHtml(actionLink, baseUrl),
      text: `Abra este link para redefinir sua senha: ${actionLink}`,
    });
  } catch {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
