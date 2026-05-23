import { Suspense } from "react";
import Header from "@/layout/Header";
import { RoleLoginForm } from "../_components/RoleLoginForm";

function PatientLoginCard() {
  return (
    <RoleLoginForm
      expectedRole="PATIENT"
      title="Entrar como paciente"
      description="Acesse seu painel de paciente com seu e-mail e senha."
      signupHref="/cadastro/paciente"
      signupLabel="Criar conta de paciente"
      alternateHref="/login/psicologo"
      alternateLabel="Sou psicologo"
    />
  );
}

export default function LoginPacientePage() {
  return (
    <>
      <Header />
      <main className="page-content">
        <section className="content-inner bg-light">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 col-xl-6">
                <Suspense fallback={<div className="text-center p-5">Carregando...</div>}>
                  <PatientLoginCard />
                </Suspense>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
