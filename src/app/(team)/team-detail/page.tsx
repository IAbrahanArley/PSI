import Link from "next/link";
import PageBanner from "@/component/PageBanner";
import { IMAGES } from "@/constant/theme";
import Footer from "@/layout/Footer";
import Header from "@/layout/Header";
import Table from 'react-bootstrap/Table';
import AppointForm from "./_componenets/AppointForm";
import Image from "next/image";

function TeamDetail() {   
    return (
        <>
            <Header />
            <main className="page-content">
                <PageBanner title="Team Detail" bnrimage={IMAGES.bnr2.src} />
                <section className="content-inner">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-4 m-b30">
                                <aside className="side-bar sticky-top">
                                    <div className="widget wow fadeInUp" data-wow-delay="0.1s" data-wow-duration="0.7s">
                                        <div className="dz-team style-5">
                                            <div className="dz-media">
                                                <Image src={IMAGES.teampmg2} alt="/" />
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
                                    <div className="widget widget_schedule bg-secondary text-white wow fadeInUp" data-wow-delay="0.2s" data-wow-duration="0.7s">
                                        <div className="widget-title">
                                            <h4 className="title text-white">My Time Schedule</h4>
                                        </div>
                                        <Table className="table table-border-bottom m-b0">
                                            <thead>
                                                <tr>
                                                    <th>Monday - Friday</th>
                                                    <td className="text-end">09:30 - 07:30</td>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <th>Saturday</th>
                                                    <td className="text-end">09:30 - 04:30</td>
                                                </tr>
                                                <tr>
                                                    <th>Sunday</th>
                                                    <td className="text-end">09:30 - 04:30</td>
                                                </tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                    <div className="widget widget_info bg-light wow fadeInUp" data-wow-delay="0.3s" data-wow-duration="0.7s">
                                        <div className="icon-bx-wraper style-1 m-b20">
                                            <div className="icon-bx bg-primary">
                                                <span className="icon-cell">
                                                    <i className="feather icon-map-pin" />
                                                </span>
                                            </div>
                                            <div className="icon-content">
                                                <h5 className="dz-title fw-semibold">Address</h5>
                                                <p className="fw-normal">234 Oak Drive, Villagetown, USA</p>
                                            </div>
                                        </div>
                                        <div className="icon-bx-wraper style-1 m-b20">
                                            <div className="icon-bx bg-primary">
                                                <span className="icon-cell">
                                                    <i className="feather icon-phone" />
                                                </span>
                                            </div>
                                            <div className="icon-content">
                                                <h5 className="dz-title fw-semibold">Call Us</h5>
                                                <p className="fw-normal"><Link href="tel:+11234567890" className="text-body">+1 123 456 7890</Link></p>
                                            </div>
                                        </div>
                                        <div className="icon-bx-wraper style-1 m-b15">
                                            <div className="icon-bx bg-primary">
                                                <span className="icon-cell">
                                                    <i className="feather icon-mail" />
                                                </span>
                                            </div>
                                            <div className="icon-content">
                                                <h5 className="dz-title fw-semibold">Send us a Mail</h5>
                                                <p className="fw-normal"><Link href="mailto:info@example.com" className="text-body">info@example.com</Link></p>
                                            </div>
                                        </div>
                                    </div>
                                </aside>
                            </div>
                            <div className="col-lg-8 ps-xl-5 m-b30">
                                <div className="section-head style-1 mb-30">
                                    <h2 className="titlev fw-semibold m-b0 wow fadeInUp" data-wow-delay="0.1s" data-wow-duration="0.7s">Dr. Danial Frankie</h2>
                                    <p className="text-primary m-b20 fw-normal font-16 wow fadeInUp" data-wow-delay="0.2s" data-wow-duration="0.7s">MBBS (Village Town), USA (Cardiac Surgery)</p>
                                    <p className="fw-normal m-b0 wow fadeInUp" data-wow-delay="0.3s" data-wow-duration="0.7s">It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters,</p>
                                </div>
                                <Table className="table table-striped table-striped-rounded m-b40 wow fadeInUp" data-wow-delay="0.4s" data-wow-duration="0.7s">
                                    <thead>
                                        <tr>
                                            <th>Specialty</th>
                                            <td>Orthodontist Surgeon Specialize</td>
                                        </tr>
                                    </thead>
                                    <tbody className="border-top-0">
                                        <tr>
                                            <th>Degrees</th>
                                            <td><Link href={"#"} scroll={false}>MBBS University of California</Link></td>
                                        </tr>
                                        <tr>
                                            <th>Experience</th>
                                            <td>7 years, New York Urgent Medical Care Serving California</td>
                                        </tr>
                                        <tr>
                                            <th>Awards</th>
                                            <td>2018 - 2019 : William Allan Award</td>
                                        </tr>
                                    </tbody>
                                </Table>
                                <h3 className="font-20 m-b15 wow fadeInUp" data-wow-delay="0.5s" data-wow-duration="0.7s">Professional Skills</h3>
                                <ul className="list-check-circle list-light text-secondary fw-medium grid-2 m-b40 wow fadeInUp" data-wow-delay="0.6s" data-wow-duration="0.7s">
                                    <li>Radiant Skin Dermatology</li>
                                    <li>Laser Resurfacing</li>
                                    <li>Flawless Dermatology</li>
                                    <li>Refined Skin Dermatology</li>
                                    <li>Luminous Dermatology</li>
                                    <li>Anti Aging</li>
                                </ul>
                                <div className="form-wrapper style-1 wow fadeInUp" data-wow-delay="0.7s" data-wow-duration="0.7s">
                                    <div className="form-body bg-primary background-blend-burn" style={{ backgroundImage: `url(${IMAGES.bg2png})` }}>
                                        <div className="title-head">
                                            <h2 className="form-title m-b0">Make An <span>Appointment</span> Apply For Treatments</h2>
                                        </div>
                                       <AppointForm />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />            
        </>
    );
}
export default TeamDetail;