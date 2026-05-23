import { Suspense } from "react";
import Header from "@/layout/Header";
import { RoleLoginForm } from "../_components/RoleLoginForm";

function PsychologistLoginCard() {
  return (
    <RoleLoginForm
      expectedRole="PSYCHOLOGIST"
      title="Entrar como psicologo"
      description="Acesse seu painel profissional com o e-mail e senha da sua conta."
      signupHref="/cadastro/psicologo"
      signupLabel="Criar conta de psicologo"
      alternateHref="/login/paciente"
      alternateLabel="Sou paciente"
    />
  );
}

export default function LoginPsicologoPage() {
  return (
    <>
      <Header />
      <main className="page-content">
        <section className="content-inner bg-light">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 col-xl-6">
                <Suspense fallback={<div className="text-center p-5">Carregando...</div>}>
                  <PsychologistLoginCard />
                </Suspense>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
