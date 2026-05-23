import EmpolyBlog from "@/component/EmpolyBlog";
import FloatingPsychologistChatTeaser from "@/component/FloatingPsychologistChatTeaser";
import HomeHeroSearch from "@/component/HomeHeroSearch";
import ServiceBox from "@/component/ServiceBox";
import { listPublicCatalogSpecialtiesForHome } from "@/actions/catalog/list-public-catalog-specialties-for-home";
import { IMAGES } from "@/constant/theme";
import Header from "@/layout/Header";
import Image from "next/image";
import Link from "next/link";
import Howitwork from "@/component/Howitwork";

export default async function HomePage() {
  const serviceItems = await listPublicCatalogSpecialtiesForHome();

  return (
    <>
      <Header />
      <main className="page-content">
        <div
          className="hero-banner style-1"
          style={{ backgroundImage: `url(${IMAGES.herobannerbg1.src})`, backgroundSize: "cover" }}
        >
          <div className="container">
            <div className="inner-wrapper">
              <div className="row align-items-end h-100">
                <div className="col-lg-6 align-self-center">
                  <div className="hero-content">
                    <HomeHeroSearch />
                  </div>
                </div>
                <div className="col-lg-6 wow fadeInRight" data-wow-delay="0.8s" data-wow-duration="0.8s">
                  <div
                    className="hero-thumbnail"
                    data-bottom-top="transform: translateY(-50px)"
                    data-top-bottom="transform: translateY(50px)"
                  >
                    <Image className="thumbnail" src={IMAGES.Banner02.src} alt="" width={900} height={900} />
                    <div className="circle-wrapper">
                      <span className="circle1" />
                      <span className="circle2" />
                      <span className="circle3" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="dz-bnr-inr dz-banner-dark overlay-secondary-middle dz-bnr-inr-md">
          <div className="container">
            <div className="dz-bnr-inr-entry d-table-cell">
              <h1 className="wow fadeInUp" data-wow-delay="0.2s" data-wow-duration="0.8s">
                Cuidado psicologico com acolhimento e seguranca
              </h1>
            </div>
          </div>
        </div>
        <section className="content-inner-2 bg-light">
          <div className="container">
            <div className="section-head style-1 m-b30 row align-items-end">
              <div className="col-xl-7 col-md-9 wow fadeInUp" data-wow-delay="0.2s" data-wow-duration="0.8s">
                <h2 className="title  m-b0">Especialidades para cada etapa da sua jornada</h2>
              </div>
              <div
                className="col-xl-5 col-md-3 text-lg-end d-none d-md-block wow fadeInUp"
                data-wow-delay="0.4s"
                data-wow-duration="0.8s"
              >
                <Link href="/services" className="btn btn-icon btn-primary">
                  {" "}
                  Ver todos
                  <span className="right-icon">
                    <i className="feather icon-arrow-right" />
                  </span>
                </Link>
              </div>
            </div>
            <ServiceBox items={serviceItems} />
          </div>
        </section>
        <section className="content-inner">
          <div className="container">
            <div className="section-head style-1 m-b30 row align-items-end">
              <div className="col-sm-7 wow fadeInUp" data-wow-delay="0.2s" data-wow-duration="0.8s">
                <h2 className="title m-b0">Conheca nossos especialistas</h2>
              </div>
              <div
                className="col-sm-5 text-sm-end d-sm-block d-none wow fadeInUp"
                data-wow-delay="0.4s"
                data-wow-duration="0.8s"
              >
                <Link href="/team" className="btn btn-icon btn-primary btn-shadow">
                  {" "}
                  Ver todos
                  <span className="right-icon">
                    <i className="feather icon-arrow-right" />
                  </span>
                </Link>
              </div>
            </div>
            <EmpolyBlog />
          </div>
        </section>
        <Howitwork />
      </main>
      <FloatingPsychologistChatTeaser />
    </>
  );
}
