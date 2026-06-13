"use client";

import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/constant/theme";

type Role = "paciente" | "psicologo";

const PANEL: Record<Role, { headline: string; sub: string; features: string[] }> = {
  paciente: {
    headline: "Cuide da sua saúde mental com quem entende de você",
    sub: "Encontre o psicólogo ideal, agende sua sessão e acompanhe seu progresso — tudo em um só lugar.",
    features: [
      "Psicólogos verificados e especializados",
      "Agendamento online em minutos",
      "Prontuário digital seguro",
      "Sessões presenciais ou online",
    ],
  },
  psicologo: {
    headline: "Sua clínica digital na palma da mão",
    sub: "Gerencie pacientes, agenda e prontuários com agilidade. Foque no que importa: o atendimento.",
    features: [
      "Perfil profissional com destaque na listagem",
      "Agenda integrada e prontuário digital",
      "Acesso à IA para apoio clínico",
      "Suporte dedicado para sua prática",
    ],
  },
};

type Props = {
  role: Role;
  children: React.ReactNode;
};

export function AuthSplitLayout({ role, children }: Props) {
  const panel = PANEL[role];

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>

      {/* ── Painel esquerdo (oculto em mobile) ── */}
      <div
        className="d-none d-lg-flex flex-column justify-content-between bg-primary"
        style={{
          width: "42%",
          minHeight: "100vh",
          padding: "2.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Círculos decorativos */}
        <span style={{
          position: "absolute", top: -100, right: -100,
          width: 320, height: 320, borderRadius: "50%",
          background: "rgba(255,255,255,0.07)", pointerEvents: "none",
        }} />
        <span style={{
          position: "absolute", bottom: -80, left: -80,
          width: 260, height: 260, borderRadius: "50%",
          background: "rgba(255,255,255,0.05)", pointerEvents: "none",
        }} />
        <span style={{
          position: "absolute", top: "40%", left: "60%",
          width: 160, height: 160, borderRadius: "50%",
          background: "rgba(255,255,255,0.04)", pointerEvents: "none",
        }} />

        {/* Logo */}
        <Link href="/" style={{ position: "relative", zIndex: 1 }}>
          <Image
            src={IMAGES.logowhite}
            alt="Amyre"
            height={36}
            style={{ objectFit: "contain", objectPosition: "left" }}
          />
        </Link>

        {/* Conteúdo central */}
        <div className="text-white" style={{ position: "relative", zIndex: 1 }}>
          <h1
            className="fw-bold mb-3"
            style={{ fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", lineHeight: 1.25 }}
          >
            {panel.headline}
          </h1>
          <p className="mb-4" style={{ opacity: 0.82, fontSize: "0.98rem", lineHeight: 1.6 }}>
            {panel.sub}
          </p>
          <ul className="list-unstyled m-0 d-flex flex-column gap-2">
            {panel.features.map((f) => (
              <li key={f} className="d-flex align-items-center gap-2">
                <span
                  className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                  style={{ width: 26, height: 26, background: "rgba(255,255,255,0.18)" }}
                >
                  <i className="feather icon-check text-white" style={{ fontSize: "0.75rem" }} />
                </span>
                <span style={{ fontSize: "0.93rem", opacity: 0.92 }}>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Rodapé */}
        <p className="text-white mb-0" style={{ opacity: 0.45, fontSize: "0.78rem", position: "relative", zIndex: 1 }}>
          © {new Date().getFullYear()} Amyre. Todos os direitos reservados.
        </p>
      </div>

      {/* ── Painel direito ── */}
      <div
        className="flex-grow-1 d-flex flex-column align-items-center justify-content-center bg-white"
        style={{ minHeight: "100vh", padding: "2rem 1.5rem" }}
      >
        {/* Logo mobile (só aparece em telas pequenas) */}
        <div className="d-lg-none mb-4 text-center">
          <Link href="/">
            <Image src={IMAGES.logo} alt="Amyre" height={32} style={{ objectFit: "contain" }} />
          </Link>
        </div>

        <div style={{ width: "100%", maxWidth: 440 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
