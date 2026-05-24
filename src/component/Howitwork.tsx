"use client"
import Link from "next/link";
import { IMAGES } from "../constant/theme";
import CountUp from "react-countup";
import { howitworkdata } from "../constant/alldata";
import Image from "next/image";

function Howitwork() {
    return (
        <>
            <section className="content-inner">
                <div className="container">
                    <div className="row content-wrapper style-3">
                        <div className="col-xl-4 m-b30 pe-xl-4">
                            <div className="section-head style-1 m-b30">
                                <h2 className="title m-b0 wow fadeInUp" data-wow-delay="0.2s" data-wow-duration="0.8s">Como funciona</h2>
                                <p className="wow fadeInUp" data-wow-delay="0.4s" data-wow-duration="0.8s">Conectamos você ao psicólogo ideal para a sua jornada. Do cadastro à primeira sessão, tudo de forma simples, segura e no seu ritmo.</p>
                            </div>
                            <div className="row">
                                {howitworkdata.map((data, i) => (
                                    <div className="col-xl-12 col-md-6 wow fadeInUp" data-wow-delay={data.delay} data-wow-duration="0.8s" key={i}>
                                        <div className="icon-bx-wraper style-2 m-b20">
                                            <div className="icon-bx">
                                                <span className="icon-cell"> {data.icon} </span>
                                            </div>
                                            <div className="icon-content">
                                                <h3 className="dz-title">{data.title}</h3>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="col-xl-8">
                            <div className="content-media">
                                <div className="dz-media">
                                    <Image src={IMAGES.sessaoPsi} alt="Sessão de psicologia online" />
                                    <div className="dz-btn">
                                        <Link href="/cadastro" className="btn btn-lg btn-icon btn-secondary btn-shadow">
                                            Agendar sessão <span className="right-icon"><i className="feather icon-arrow-right" /></span>
                                        </Link>
                                    </div>
                                </div>
                                <div className="item1" data-bottom-top="transform: translateY(30px)" data-top-bottom="transform: translateY(-30px)">
                                    <div className="info-widget style-8 bg-primary">
                                        <div className="row g-0">
                                            <div className="col-6 d-flex">
                                                <div className="content-bx style-1 m-auto text-center">
                                                    <span className="content-text text-white"><span className="counter"><CountUp end={50} duration={5} /></span>+</span>
                                                    <h3 className="title text-white m-b0">Psicólogos</h3>
                                                </div>
                                            </div>
                                            <div className="col-6 d-flex">
                                                <div className="content-bx style-1 m-auto text-center">
                                                    <span className="content-text text-white"><span className="counter"><CountUp start={1} end={2} duration={5} /></span>K+</span>
                                                    <h3 className="title text-white m-b0">Sessões realizadas</h3>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}
export default Howitwork;