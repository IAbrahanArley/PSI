import Link from "next/link";
import { eq } from "drizzle-orm";
import { CalendarCheck, ClipboardList, Search, Smile, UserRound, ArrowRight, CheckCircle2 } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { patients } from "@/lib/db/schema";

export default async function DashboardPacientePage() {
  // Busca dados básicos do paciente para personalizar a saudação
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let firstName = "";
  let hasProfile = false;

  if (user?.id && process.env.DATABASE_URL) {
    try {
      const [patient] = await db
        .select({ fullName: patients.fullName })
        .from(patients)
        .where(eq(patients.userId, user.id))
        .limit(1);

      if (patient?.fullName) {
        firstName = patient.fullName.split(" ")[0] ?? "";
        hasProfile = true;
      }
    } catch {
      /* banco indisponível — segue sem nome */
    }
  }

  const greeting = firstName ? `Olá, ${firstName}!` : "Bem-vindo!";

  // ── Cartões de atalho ──────────────────────────────────────────────────────
  const shortcuts = [
    {
      href: "/dashboard/paciente/anamnese",
      icon: <ClipboardList size={22} className="text-primary" />,
      title: "Minha anamnese",
      description: "Responda algumas perguntas para encontrarmos o psicólogo ideal para você.",
      cta: "Preencher agora",
      highlight: !hasProfile, // destaca se ainda não completou o perfil
    },
    {
      href: "/dashboard/paciente/psicologos",
      icon: <Search size={22} className="text-success" />,
      title: "Encontrar psicólogo",
      description: "Veja profissionais compatíveis com seu perfil e agende sua primeira sessão.",
      cta: "Explorar profissionais",
      highlight: false,
    },
    {
      href: "/dashboard/paciente/consultas",
      icon: <CalendarCheck size={22} className="text-primary" />,
      title: "Minhas consultas",
      description: "Acompanhe seus agendamentos, confirme horários e gerencie suas sessões.",
      cta: "Ver consultas",
      highlight: false,
    },
    {
      href: "/dashboard/paciente/humor",
      icon: <Smile size={22} className="text-warning" />,
      title: "Diário de humor",
      description: "Registre como você está se sentindo hoje. Acompanhe sua evolução ao longo do tempo.",
      cta: "Registrar hoje",
      highlight: false,
    },
    {
      href: "/dashboard/paciente/perfil",
      icon: <UserRound size={22} className="text-secondary" />,
      title: "Meu perfil",
      description: "Complete seus dados pessoais para uma experiência mais personalizada.",
      cta: "Ver perfil",
      highlight: false,
    },
  ];

  return (
    <div>
      {/* Cabeçalho de boas-vindas */}
      <div className="m-b30">
        <h1 className="title mb-1">{greeting}</h1>
        <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
          Este é o seu espaço de cuidado. Comece por onde preferir.
        </p>
      </div>

      {/* Banner de onboarding — aparece apenas se o perfil ainda não foi criado */}
      {!hasProfile && (
        <div
          className="alert border-0 d-flex align-items-start gap-3 m-b30 rounded-3 p-4"
          style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)" }}
        >
          <ClipboardList size={24} className="text-primary flex-shrink-0 mt-1" />
          <div className="flex-grow-1">
            <p className="fw-semibold mb-1" style={{ color: "#1a1a2e" }}>
              Comece pela anamnese
            </p>
            <p className="text-muted small mb-3">
              São apenas 5 minutos. Com suas respostas conseguimos indicar o profissional
              mais adequado para o que você está buscando.
            </p>
            <Link
              href="/dashboard/paciente/anamnese"
              className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
              style={{ borderRadius: 8 }}
            >
              Preencher anamnese
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}

      {/* Grid de atalhos */}
      <div className="row g-3">
        {shortcuts.map((s) => (
          <div key={s.href} className="col-sm-6 col-xl-4">
            <Link href={s.href} className="text-decoration-none h-100 d-block">
              <div
                className={`card border-0 shadow-sm h-100 ${s.highlight ? "border border-primary" : ""}`}
                style={{
                  outline: s.highlight ? "2px solid var(--bs-primary)" : undefined,
                  transition: "box-shadow 0.15s",
                }}
              >
                <div className="card-body p-4 d-flex flex-column gap-3">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-3"
                    style={{ width: 44, height: 44, background: "#f3f4f8" }}
                  >
                    {s.icon}
                  </div>
                  <div className="flex-grow-1">
                    <p className="fw-semibold mb-1" style={{ color: "#1a1a2e", fontSize: "0.97rem" }}>
                      {s.title}
                    </p>
                    <p className="text-muted mb-0" style={{ fontSize: "0.83rem", lineHeight: 1.5 }}>
                      {s.description}
                    </p>
                  </div>
                  <span
                    className="d-inline-flex align-items-center gap-1 text-primary fw-semibold"
                    style={{ fontSize: "0.83rem" }}
                  >
                    {s.cta}
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Rodapé informativo */}
      <div
        className="mt-4 p-3 rounded-3 d-flex align-items-start gap-2"
        style={{ background: "#f8f9fa", fontSize: "0.82rem" }}
      >
        <CheckCircle2 size={16} className="text-success flex-shrink-0 mt-1" />
        <span className="text-muted">
          Seus dados são protegidos pela{" "}
          <strong className="text-dark">LGPD</strong> e utilizados exclusivamente para
          melhorar suas indicações de profissionais. Você pode excluí-los a qualquer momento
          nas configurações do perfil.
        </span>
      </div>
    </div>
  );
}
