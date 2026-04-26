import ServiceBox from "@/component/ServiceBox";
import FloatingPsychologistChatTeaser from "@/component/FloatingPsychologistChatTeaser";
import Header from "@/layout/Header"; 
import Link from "next/link";
import { IMAGES } from "@/constant/theme";
import Image from "next/image";
import EmpolyBlog from "@/component/EmpolyBlog";


const HomePage = () =>{
    return(
        <>
            <Header />
            <main className="page-content">
                <div className="hero-banner style-1" style={{ backgroundImage: `url(${IMAGES.herobannerbg1.src})`, backgroundSize: 'cover' }}>
                    <div className="container">
                        <div className="inner-wrapper">
                            <div className="row align-items-end h-100">
                                <div className="col-lg-6 align-self-center">
                                    <div className="hero-content">
                                        <h1 className="title wow fadeInUp" data-wow-delay="0.2s" data-wow-duration="0.8s"> Agende agora <br />Sua consulta <span className="text-primary">  </span> <Image src={IMAGES.herobannerline} alt="" /> </h1>
                                        <p className="text wow fadeInUp" data-wow-delay="0.4s" data-wow-duration="0.8s">Centenas de profissionais qualificados para atender você</p>
                                        <div className="wow fadeInUp" data-wow-delay="0.6s" data-wow-duration="0.8s">
                                            <div className="row g-2 align-items-center">
                                                <div className="col-md-5">
                                                    <select className="form-select form-select-lg">
                                                        <option value="">Escolha a especialidade</option>
                                                        <option value="psicologia-clinica">Psicologia Clinica</option>
                                                        <option value="psicologia-infantil">Psicologia Infantil</option>
                                                        <option value="terapia-casal">Terapia de Casal</option>
                                                        <option value="neuropsicologia">Neuropsicologia</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-4">
                                                    <select className="form-select form-select-lg">
                                                        <option value="">Escolha a cidade</option>
                                                        <option value="sao-paulo">Sao Paulo</option>
                                                        <option value="rio-de-janeiro">Rio de Janeiro</option>
                                                        <option value="belo-horizonte">Belo Horizonte</option>
                                                        <option value="curitiba">Curitiba</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-3">
                                                    <button type="button" className="btn btn-lg btn-primary w-100">
                                                        Pesquisar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-6 wow fadeInRight" data-wow-delay="0.8s" data-wow-duration="0.8s">
                                    <div className="hero-thumbnail" data-bottom-top="transform: translateY(-50px)" data-top-bottom="transform: translateY(50px)">
                                        <Image className="thumbnail" src={IMAGES.Banner02.src} alt="" width={900} height={900} />
                                        <div className="circle-wrapper">
                                            <span className="circle1"></span>
                                            <span className="circle2"></span>
                                            <span className="circle3"></span>
                                           
                                        </div>
                                        {/*<div className="item2" data-bottom-top="transform: translateY(-50px)" data-top-bottom="transform: translateY(50px)">
                                            <div className="info-widget style-1 move-3">
                                                <div className="avatar-group">
                                                    <Image className="avatar rounded-circle avatar-sm border border-white border-2" src={IMAGES.smallavatar1} alt="" />
                                                    <Image className="avatar rounded-circle avatar-sm border border-white border-2" src={IMAGES.smallavatar2} alt="" />
                                                    <Image className="avatar rounded-circle avatar-sm border border-white border-2" src={IMAGES.smallavatar3} alt="" />
                                                    <Image className="avatar rounded-circle avatar-sm border border-white border-2" src={IMAGES.smallavatar4} alt="" />
                                                </div>
                                                <div className="clearfix ms-2">
                                                    <span className="number text-primary">150k</span>
                                                    <span>Patient recovers</span>
                                                </div>
                                            </div>
                                        </div>
                                      {/*  <div className="item3" data-bottom-top="transform: translateY(-50px)" data-top-bottom="transform: translateY(50px)">
                                            <div className="info-widget style-2 move-2">
                                                 progress chart 
                                                <DiagnosisReport />
                                                <div className="widget-content">
                                                    <h6 className="mb-0">Successfully diagnosis</h6>
                                                    <Link href="/team-detail" className="btn btn-square btn-outline-light text-primary rounded-circle">
                                                        <i className="feather icon-arrow-up-right" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div> 
                                        */}
                                        {/*<div className="item4" data-bottom-top="transform: translateY(-50px)" data-top-bottom="transform: translateY(50px)">
                                            <div className="info-widget style-3 move-1">
                                                <div className="widget-head">
                                                    <div className="widget-media">
                                                        <Image src={IMAGES.smallavatar5} alt="" />
                                                    </div>
                                                    <div className="widget-content">
                                                        <h6 className="title">Dr. Natali jackson</h6>
                                                        <ul className="star-list">
                                                            <li><i className="fa fa-star" /></li>
                                                            <li><i className="fa fa-star" /></li>
                                                            <li><i className="fa fa-star" /></li>
                                                            <li><i className="fa fa-star" /></li>
                                                            <li><i className="fa fa-star" /></li>
                                                        </ul>
                                                    </div>
                                                </div>
                                                <p>“It is a long established fact that a reader will be distracted by the readable content”</p>
                                            </div>
                                        </div>*/}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            <div className="dz-bnr-inr dz-banner-dark overlay-secondary-middle dz-bnr-inr-md">
                <div className="container">
                    <div className="dz-bnr-inr-entry d-table-cell">
                        <h1 className="wow fadeInUp" data-wow-delay="0.2s" data-wow-duration="0.8s">O INICIO</h1> 
                    </div>
                </div>
            </div>
            <section className="content-inner-2 bg-light">
                <div className="container">
                    <div className="section-head style-1 m-b30 row align-items-end">
                        <div className="col-xl-7 col-md-9 wow fadeInUp" data-wow-delay="0.2s" data-wow-duration="0.8s">
                            <h2 className="title  m-b0"> Explore nossos serviços </h2>
                        </div>
                        <div className="col-xl-5 col-md-3 text-lg-end d-none d-md-block wow fadeInUp" data-wow-delay="0.4s" data-wow-duration="0.8s">
                            <Link href="/services" className="btn btn-icon btn-primary"> Ver todos
                                <span className="right-icon"><i className="feather icon-arrow-right" /></span>
                            </Link>
                        </div>
                    </div>
                    <ServiceBox />
                </div>
            </section>
            <section className="content-inner">
                    <div className="container">
                        <div className="section-head style-1 m-b30 row align-items-end">
                            <div className="col-sm-7 wow fadeInUp" data-wow-delay="0.2s" data-wow-duration="0.8s">
                                <h2 className="title m-b0">Nossos Especialistas </h2>
                            </div>
                            <div className="col-sm-5 text-sm-end d-sm-block d-none wow fadeInUp" data-wow-delay="0.4s" data-wow-duration="0.8s">
                                <Link href="/team" className="btn btn-icon btn-primary btn-shadow"> Ver todos
                                    <span className="right-icon"><i className="feather icon-arrow-right" /></span>
                                </Link>
                            </div>
                        </div>
                        <EmpolyBlog />
                    </div>
                </section>
            </main>
            <FloatingPsychologistChatTeaser />
        </>
    )
}
export default HomePage;