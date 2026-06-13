import { StaticImageData } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  title:    string;
  bnrimage: string | StaticImageData;
  /** Substitui o botão de telefone padrão. Passe `null` para ocultar o botão. */
  cta?: ReactNode;
}

function PageBanner({ title, bnrimage, cta }: Props) {
  // Se `cta` não foi passado, mantém o comportamento original (telefone placeholder)
  const ctaContent =
    cta !== undefined ? cta : (
      <Link href="tel:+11234567890" className="btn btn-lg btn-icon btn-primary radius-xl btn-shadow mb-3 mb-sm-0">
        <span className="left-icon">
          <i className="feather icon-phone-call" />
        </span>
        +1 123 456 7890
      </Link>
    );

  return (
    <div
      className="dz-bnr-inr dz-banner-dark overlay-black-middle dz-bnr-inr-md"
      style={{
        backgroundImage:   `url(${bnrimage})`,
        backgroundPosition: "center bottom",
        opacity:           0.95,
      }}
    >
      <div className="container">
        <div className="dz-bnr-inr-entry d-table-cell">
          <h1 className="wow fadeInUp" data-wow-delay="0.2s" data-wow-duration="0.8s">
            {title}
          </h1>
          <nav aria-label="breadcrumb" className="breadcrumb-row wow fadeInUp" data-wow-delay="0.4s" data-wow-duration="0.8s">
            <ul className="breadcrumb">
              <li className="breadcrumb-item"><Link href="/">Home</Link></li>
              <li className="breadcrumb-item">{title}</li>
            </ul>
          </nav>
          {ctaContent !== null && (
            // CTA padrao (telefone) usa `.dz-btn` (fundo branco + curvas do tema, ancorado embaixo).
            // CTA customizado usa um wrapper neutro, centralizado e sem a decoracao branca.
            <div className={cta !== undefined ? "dz-bnr-custom-cta mt-4 d-flex justify-content-center" : "dz-btn"}>
              {ctaContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PageBanner;
