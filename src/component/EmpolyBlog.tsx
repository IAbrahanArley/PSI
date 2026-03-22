"use client"
import { useState } from "react";
import Link from "next/link";
import { empolydata } from "../constant/alldata";
import Image from "next/image";

function EmpolyBlog() {
    const [active, setActive] = useState(1);
    return (
        <>
            <div className="row">
                {empolydata.slice(0, empolydata.length - 4).map((data, i) => (
                    <div className="col-xl-3 col-sm-6 wow fadeInUp" data-wow-delay={data.delay} data-wow-duration="0.8s" key={i}>
                        <div className={`dz-team style-1 box-hover ${active === data.id ? 'active' : ''}`} onMouseEnter={() => setActive(data.id)}>
                            <div className="dz-media">
                                <Image src={data.image} alt="/" />
                                <Link href="/appointment" className="btn btn-primary">
                                    <i className="feather icon-calendar m-r5" /> Appointment Now
                                </Link>
                            </div>
                            <div className="dz-content">
                                <div className="clearfix">
                                    <h3 className="dz-name"><Link href="/team-detail">{data.title}</Link></h3>
                                    <span className="dz-position">{data.position}</span>
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
            </div >
        </>
    )
}
export default EmpolyBlog;