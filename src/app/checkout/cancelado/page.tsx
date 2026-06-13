import Link from "next/link";
import Header from "@/layout/Header";

export default function CheckoutCanceladoPage() {
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
              {/* Ícone */}
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle bg-warning bg-opacity-10 m-b20"
                style={{ width: 88, height: 88 }}
              >
                <i className="feather icon-x-circle text-warning" style={{ fontSize: "3rem" }} />
              </div>

              <h1 className="title m-b15">Pagamento cancelado</h1>
              <p className="text-muted m-b30">
                Você cancelou o processo de pagamento. Nenhuma cobrança foi realizada.
                Quando quiser, é só escolher um plano e tentar novamente.
              </p>

              <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                <Link href="/assinar" className="btn btn-primary btn-lg">
                  Ver planos
                  <span className="ms-2">
                    <i className="feather icon-arrow-right" />
                  </span>
                </Link>
                <Link href="/dashboard" className="btn btn-outline-secondary btn-lg">
                  Voltar ao dashboard
                </Link>
              </div>

              <p className="text-muted small m-t30">
                Dúvidas sobre os planos?{" "}
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
