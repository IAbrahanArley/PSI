import Link from "next/link";
import { AuthSplitLayout } from "./_components/AuthSplitLayout";

export default function LoginHubPage() {
  return (
    <AuthSplitLayout role="paciente">
      <h2 className="fw-bold mb-2" style={{ fontSize: "1.75rem", color: "#1a1a2e" }}>
        Acesse sua conta
      </h2>
      <p className="text-muted mb-4" style={{ fontSize: "0.92rem" }}>
        Escolha seu perfil para entrar na área correta do painel.
      </p>

      <div className="d-flex flex-column gap-3 mb-4">
        <Link
          href="/login/psicologo"
          className="btn btn-primary btn-lg fw-semibold d-flex align-items-center gap-3"
          style={{ borderRadius: 10, height: 56, fontSize: "0.97rem" }}
        >
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-circle bg-white"
            style={{ width: 34, height: 34, flexShrink: 0 }}
          >
            <i className="feather icon-briefcase text-primary" style={{ fontSize: "1rem" }} />
          </span>
          <span>Entrar como psicólogo</span>
          <i className="feather icon-arrow-right ms-auto" />
        </Link>

        <Link
          href="/login/paciente"
          className="btn btn-outline-primary btn-lg fw-semibold d-flex align-items-center gap-3"
          style={{ borderRadius: 10, height: 56, fontSize: "0.97rem" }}
        >
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-circle"
            style={{ width: 34, height: 34, flexShrink: 0, background: "rgba(var(--bs-primary-rgb),0.08)" }}
          >
            <i className="feather icon-user text-primary" style={{ fontSize: "1rem" }} />
          </span>
          <span>Entrar como paciente</span>
          <i className="feather icon-arrow-right ms-auto" />
        </Link>
      </div>

      <div
        className="d-flex align-items-center gap-3 my-4"
        style={{ color: "#d1d5db" }}
      >
        <hr className="flex-grow-1 m-0" />
        <span className="small text-muted">ou crie sua conta</span>
        <hr className="flex-grow-1 m-0" />
      </div>

      <div className="d-flex gap-2">
        <Link href="/cadastro/psicologo" className="btn btn-outline-secondary flex-grow-1" style={{ borderRadius: 10 }}>
          Cadastro psicólogo
        </Link>
        <Link href="/cadastro/paciente" className="btn btn-outline-secondary flex-grow-1" style={{ borderRadius: 10 }}>
          Cadastro paciente
        </Link>
      </div>

      <div className="text-center mt-4">
        <Link href="/" className="small text-muted text-decoration-none">
          ← Voltar ao início
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
