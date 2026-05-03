"use client"
import { IMAGES } from "../constant/theme";
import { headerdata, headerinfo, HeaderItem } from "../constant/alldata";
import { FormEvent, useEffect, useRef, useState } from "react";
import emailjs from '@emailjs/browser'; 
import Link from "next/link";
import Image from "next/image";

function Header() {
    const [show, setShow] = useState<number | null>(null);
    const handleclick = (index : number) => {
        setShow(index)
    };
    const [isActive, setIsActive] = useState<number | null>(null);
    function menuHandler(index : number) {
        setIsActive((prev) => (prev === index ? null : index));
        // if (isActive == index) {
        //     setIsActive(null)
        // } else {
        //     setIsActive(index)
        // }
    }
    const [scroll, setScroll] = useState(false);
    useEffect(() => {
        window.addEventListener('scroll', scrollHandler)
        return () => {
            window.removeEventListener('scroll', scrollHandler)
        }
    }, [])
    function scrollHandler() {
        if (window.scrollY >= 90) {
            setScroll(true)
        }
        else {
            setScroll(false)
        }
    }

    const form = useRef<HTMLFormElement>(null);
    const sendEmail = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault(); 
        if (!form.current) return;
        emailjs.sendForm('service_61hny88', 'template_vvlidif', form.current, {publicKey: 'aYOgb_ORYkjD-hXhl',})
        .then(() => undefined)
        .catch(() => undefined);
    };

    return (
        <>
            <header className="site-header header style-1">
                <div className={`sticky-header main-bar-wraper ${scroll ? 'is-fixed' : ''}`}>
                    <div className="main-bar clearfix bg-primary text-white">
                        <div className="container-fluid clearfix inner-bar">
                         
                            <button onClick={() => handleclick(2)} className={`w3menu-toggler navicon ${show ? 'open' : ''}`} type="button" data-target="#W3Menu">
                                <span></span>
                                <span></span>
                                <span></span>
                            </button>
                            <div onClick={() => setShow(null)} className="menu-close fade-overlay"></div>
                            <div className={`header-nav w3menu w3menu-end mo-left ${show === 2 ? 'show' : ''}`} id="W3Menu">
                               
                                <ul className="nav navbar-nav">
                                    {headerdata.map((data :HeaderItem, i: number) => {
                                        let menuClassName = data.classChange;
                                        if (menuClassName === 'has-mega-menu') {
                                            return (
                                                <li key={i} className={`has-mega-menu sub-menu-down auto-width menu-left ${i == isActive ? 'open' : ''}`} >
                                                    <Link href={"#"} onClick={() => menuHandler(i)}> <span>{data.title}</span> <i className="fas fa-chevron-down tabIndex" /> </Link>
                                                    <div className="mega-menu">
                                                        <ul className="demo-menu">
                                                            {data.content?.map((item, index) => (
                                                                <li key={index}>
                                                                    <Link href={item.to}> <Image src={item.image as string} alt={item.title} /> 
                                                                        <span className="menu-title">{item.title}</span> 
                                                                    </Link>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </li>
                                            )
                                        }
                                        else if (menuClassName === 'sub-menu-down') {
                                            return (
                                                <li key={i} className={`sub-menu-down ${i == isActive ? 'open' : ''}`} onClick={() => menuHandler(i)}>
                                                    <Link href={"#"}> <span>{data.title}</span> <i className="fas fa-chevron-down tabIndex" /> </Link>
                                                    <ul className="sub-menu">
                                                        {data.content?.map((item, index) => (
                                                            <li key={index}> <Link href={item.to}>{item.title}</Link> </li>
                                                        ))}
                                                    </ul>
                                                </li>
                                            )
                                        }
                                        else {
                                            return (
                                                <li key={i}><Link href={data.to as string}><span>{data.title}</span></Link></li>
                                            )
                                        }
                                    })}
                                </ul>
                                <div className="dz-social-icon">
                                    <ul>
                                        <li> <Link href="https://www.facebook.com/dexignzone" target="_blank"> <i className="fa-brands fa-facebook-f" /> </Link> </li>
                                        <li> <Link href="https://x.com/dexignzone" target="_blank"> <i className="fa-brands fa-x-twitter" /> </Link> </li>
                                        <li> <Link href="https://www.linkedin.com/showcase/dexignzone" target="_blank"> <i className="fa-brands fa-linkedin" /> </Link> </li>
                                        <li> <Link href="https://www.instagram.com/dexignzone" target="_blank"> <i className="fa-brands fa-instagram" /> </Link> </li>
                                    </ul>
                                </div>
                            </div>
                            <div className={`extra-nav ${scroll ? 'active' : ''}`}>
                                <div className="extra-cell">
                                    <ul className="header-right">
                                        <li className="nav-item">
                                            <Link href="/login/psi" className="btn btn-secondary btn-hover1"> Já atua na área? </Link>
                                        </li>
                                        <li className="nav-item">
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={`offcanvas dz-offcanvas offcanvas offcanvas-end ${show === 1 ? 'show' : ''}`} tabIndex={-1} id="headerSidebar">
                    <button onClick={() => setShow(null)} type="button" className="btn-close m-t10 m-l10" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                    <div className="offcanvas-body">
                        <div className="widget">
                            <div className="sidebar-header m-b20">
                                <Link href="/"><Image src={IMAGES.logo} alt="/" /></Link>
                            </div>
                            <p>ClinicMaster is a modern and responsive Bootstrap HTML template designed for health and medical websites. Ideal for clinics, hospitals, and healthcare professionals seeking a professional online presence with an elegant and user-friendly design.</p>
                        </div>
                        <div className="widget">
                            <div className="widget-title">
                                <h4 className="title">Contact Us</h4>
                            </div>
                            <ul className="list-check">
                                <li>785 15h Street, Office 478 Berlin, De 81566</li>
                                <li><Link href="mailto:email@domain.com" className="text-body">email@domain.com</Link></li>
                                <li><Link href="tel:+11234567890" className="text-body">+1 123 456 7890</Link></li>
                            </ul>
                        </div>
                        <div className="widget">
                            <div className="widget-title">
                                <h4 className="title">Newsletter</h4>
                            </div>
                            <form className="dzSubscribe style-2" ref={form} onSubmit={sendEmail} method="post">
                                <div className="dzSubscribeMsg"></div>
                                <div className="form-group">
                                    <div className="input-group mb-0">
                                        <input name="dzEmail" required type="email" className="form-control" placeholder="Your Email Address" />
                                        <div className="input-group-addon">
                                            <button name="submit" value="Submit" type="submit" className="btn text-primary btn-transparent p-2">
                                                <i className="fa-solid fa-paper-plane" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="widget">
                            <div className="widget-title">
                                <h4 className="title">Follow Us</h4>
                            </div>
                            <div className="dz-social-icon style-1">
                                <ul>
                                    <li><Link href="https://www.linkedin.com/showcase/dexignzone" target="_blank"><i className="fa-brands fa-linkedin" /></Link> </li>
                                    <li><Link href="https://www.instagram.com/dexignzone" target="_blank"><i className="fa-brands fa-instagram" /></Link> </li>
                                    <li><Link href="https://www.facebook.com/dexignzone" target="_blank"><i className="fa-brands fa-facebook-f" /></Link> </li>
                                    <li><Link href="https://x.com/dexignzone" target="_blank"><i className="fa-brands fa-x-twitter" /></Link> </li>
                                    <li><Link href="https://www.youtube.com/@dexignzone" target="_blank"><i className="fa-brands fa-youtube" /></Link> </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        </>
    )
}
export default Header;
