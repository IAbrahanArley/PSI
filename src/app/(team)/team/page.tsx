"use client"
import Link from "next/link";
import { useState } from "react";
import MeetDr from "@/component/MeetDr";
import PageBanner from "@/component/PageBanner";
import { IMAGES } from "@/constant/theme";
//import Footer from "@/layout/Footer";
import Header from "@/layout/Header";
import { empolydata } from "@/constant/alldata";
import Image from "next/image";

function Team() {
    const [active, setActive] = useState(1);
    return (
        <>
            <Header />
            <main className="page-content">
                <PageBanner title="Especialidades // Todos" bnrimage={IMAGES.bnr2.src} />
                <section className="content-inner">
                    <div className="container">
                        <div className="row">
                            {empolydata.map((item, i) => (
                                <div className="col-xl-3 col-sm-6 wow fadeInUp" data-wow-delay={item.delay} data-wow-duration="0.8s" key={i}>
                                    <div className={active === item.id ? "dz-team style-1 active box-hover" : "dz-team style-1 box-hover"} 
                                        onMouseEnter={() => setActive(item.id)}
                                    >
                                        <div className="dz-media">
                                            <Image src={item.image} alt="/" />
                                            <Link href="/appointment" className="btn btn-primary">
                                                <i className="feather icon-calendar m-r5" /> Agendar consulta
                                            </Link>
                                        </div>
                                        <div className="dz-content">
                                            <div className="clearfix">
                                                <h3 className="dz-name"><Link href="/team-detail">{item.title}</Link></h3>
                                                <span className="dz-position">{item.position}</span>
                                            </div>
                                            <Link href="/team-detail" className="btn btn-square btn-secondary">
                                                <i className="feather icon-arrow-right" />
                                            </Link>
                                        </div>
                                        <ul className="dz-social">
                                            <li><Link href="https://www.linkedin.com/showcase/dexignzone" target="_blank"><i className="fa-brands fa-linkedin" /></Link></li>
                                            <li><Link href="https://www.instagram.com/dexignzone" target="_blank"><i className="fa-brands fa-instagram" /></Link></li>
                                            <li><Link href="https://www.facebook.com/dexignzone" target="_blank"><i className="fa-brands fa-facebook-f" /></Link></li>
                                            <li><Link href="https://x.com/dexignzone" target="_blank"><i className="fa-brands fa-x-twitter" /></Link></li>
                                            <li><Link href="https://www.youtube.com/@dexignzone" target="_blank"><i className="fa-brands fa-youtube" /></Link></li>
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                <MeetDr />
            </main>
           {/* <Footer />             */}
        </>
    );
}
export default Team;