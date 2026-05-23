import Link from "next/link";
import Header from "@/layout/Header";

export default function LoginHubPage() {
  return (
    <>
      <Header />
      <main className="page-content">
        <section className="content-inner bg-light">
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 col-xl-7">
                <div className="card shadow-sm border-0">
                  <div className="card-body p-4 p-md-5">
                    <h1 className="title text-secondary m-b20">Acesso ao sistema</h1>
                    <p className="text-muted m-b30">
                      Escolha o perfil de acesso para entrar na area correta do painel.
                    </p>
                    <div className="d-flex flex-column gap-2">
                      <Link href="/login/psicologo" className="btn btn-primary btn-lg">
                        Entrar como psicologo
                      </Link>
                      <Link href="/login/paciente" className="btn btn-outline-primary btn-lg">
                        Entrar como paciente
                      </Link>
                    </div>
                    <div className="d-flex flex-wrap gap-2 mt-4">
                      <Link href="/cadastro/psicologo" className="btn btn-outline-secondary">
                        Cadastro de psicologo
                      </Link>
                      <Link href="/cadastro/paciente" className="btn btn-outline-secondary">
                        Cadastro de paciente
                      </Link>
                      <Link href="/" className="btn btn-link">
                        Voltar ao inicio
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
