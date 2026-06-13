import Link from "next/link";
import Header from "@/layout/Header";

export default function CheckoutSucessoPage() {
  return (
    <>
      <Header />
      <main className="page-content">
        <section className="content-inner">
          <div className="container">
            <div
              className="text-center mx-auto"
              style={{ maxWidth: 520 }}
            >
              {/* Ícone de sucesso */}
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 m-b20"
                style={{ width: 88, height: 88 }}
              >
                <i className="feather icon-check-circle text-success" style={{ fontSize: "3rem" }} />
              </div>

              <h1 className="title m-b15">Assinatura ativada!</h1>
              <p className="text-muted m-b30">
                Seu pagamento foi processado com sucesso. Agora você tem acesso completo à
                plataforma. Boas consultas!
              </p>

              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                <Link href="/dashboard" className="btn btn-primary btn-lg">
                  Ir para o dashboard
                  <span className="ms-2">
                    <i className="feather icon-arrow-right" />
                  </span>
                </Link>
                <Link href="/home" className="btn btn-outline-secondary btn-lg">
                  Voltar ao início
                </Link>
              </div>

              <p className="text-muted small m-t30">
                Você receberá um e-mail de confirmação em instantes.
                Dúvidas?{" "}
                <Link href="mailto:contato@amyre.com.br" className="text-primary">
                  Entre em contato
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
