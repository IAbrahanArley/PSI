"use client"
import { useState } from "react";
import Link from "next/link";
import { serviceboxdata } from "../constant/alldata";

function ServiceBox() {
    const [active, setActive] = useState<number | null>(null);
    return (
        <>
            <div className="row">
                {serviceboxdata.map((data, i) => (
                    <div className="col-xl-3 col-md-6 m-b30 wow fadeInUp" data-wow-delay={data.delay} data-wow-duration="0.8s" key={i}>
                        <div
                            className={`icon-bx-wraper style-3 box-hover ${active === data.id ? 'active' : ''}`}
                            onMouseEnter={() => setActive(data.id)}
                            onMouseLeave={() => setActive(null)}
                        >
                            <div className="icon-bx-head">
                                <div className="icon-bx"> 
                                    <span className="icon-cell" dangerouslySetInnerHTML={{__html : data.svg1}}>  
                                    </span> 
                                </div>
                                <span className="icon-bg" 
                                    dangerouslySetInnerHTML={{__html : data.svg2}}> 
                                </span>
                                <div className="icon-content">
                                    <h3 className={`dz-title ${active === data.id ? "text-white" : "text-secondary"}`}>{data.title}</h3>
                                    <p className={active === data.id ? "text-white opacity-75" : "text-muted"}>
                                        {data.description ?? "Atendimento especializado para o seu cuidado."}
                                    </p>
                                </div>
                            </div>
                            <div className="icon-bx-footer">
                                <span className="text-badge"><i className="fa fa-circle text-primary" /> {data.quantity} Especialistas</span>
                                <Link href="/service-detail" className="btn btn-square btn-primary rounded-circle">
                                    <i className="feather icon-arrow-up-right" />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
} 
export default ServiceBox;