"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IMAGES } from "../constant/theme";
import { headerdata, HeaderItem } from "../constant/alldata";
import { supabaseClient } from "@/lib/db/supabase/client";
import type { User } from "@supabase/supabase-js";

// ─── helpers ──────────────────────────────────────────────────────────────────

function getRoleFromUser(user: User): string | null {
  return user.app_metadata?.role ?? user.user_metadata?.role ?? null;
}

function dashboardHref(role: string | null): string {
  if (role === "PSYCHOLOGIST") return "/dashboard/psicologo/agenda";
  if (role === "PATIENT") return "/dashboard/paciente";
  return "/dashboard";
}

function roleLabel(role: string | null): string {
  if (role === "PATIENT") return "Paciente";
  if (role === "PSYCHOLOGIST") return "Psicólogo";
  if (role === "ADMIN") return "Admin";
  return "";
}

// ─── User dropdown ────────────────────────────────────────────────────────────

function UserMenu({ user }: { user: User }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const role = getRoleFromUser(user);
  const email = user.email ?? "";
  const initial = (email.charAt(0) ?? "U").toUpperCase();

  // Fecha ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabaseClient.auth.signOut();
    setLoggingOut(false);
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-haspopup="true"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(255,255,255,0.15)",
          border: "1.5px solid rgba(255,255,255,0.35)",
          borderRadius: 40,
          padding: "5px 12px 5px 5px",
          cursor: "pointer",
          color: "#fff",
          fontWeight: 500,
          fontSize: "0.88rem",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.background =
            "rgba(255,255,255,0.25)")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLButtonElement).style.background =
            "rgba(255,255,255,0.15)")
        }
      >
        {/* Avatar */}
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.9)",
            color: "var(--bs-primary, #4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: "0.85rem",
            flexShrink: 0,
          }}
        >
          {initial}
        </span>
        <span className="d-none d-sm-inline" style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {email.split("@")[0]}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
          style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none", opacity: 0.7 }}
        >
          <path d="M1 3.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 220,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
            overflow: "hidden",
            zIndex: 9999,
            border: "1px solid #e5e7eb",
          }}
        >
          {/* Header do dropdown */}
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #f1f3f5" }}>
            <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#111827", marginBottom: 2 }}>
              {email}
            </div>
            {role && (
              <span
                style={{
                  display: "inline-block",
                  fontSize: "0.73rem",
                  fontWeight: 500,
                  color: "var(--bs-primary, #4f46e5)",
                  background: "rgba(79,70,229,0.09)",
                  borderRadius: 20,
                  padding: "2px 8px",
                }}
              >
                {roleLabel(role)}
              </span>
            )}
          </div>

          {/* Links */}
          <div style={{ padding: "6px 0" }}>
            <Link
              href={dashboardHref(role)}
              onClick={() => setOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 16px",
                color: "#374151",
                textDecoration: "none",
                fontSize: "0.88rem",
                fontWeight: 500,
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
              Ir para o painel
            </Link>

            {role === "PATIENT" && (
              <Link
                href="/dashboard/paciente/consultas"
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 16px",
                  color: "#374151",
                  textDecoration: "none",
                  fontSize: "0.88rem",
                  fontWeight: 500,
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Minhas consultas
              </Link>
            )}

            {role === "PATIENT" && (
              <Link
                href="/dashboard/paciente/perfil"
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 16px",
                  color: "#374151",
                  textDecoration: "none",
                  fontSize: "0.88rem",
                  fontWeight: 500,
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zm-4 7a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Meu perfil
              </Link>
            )}
          </div>

          {/* Separador + sair */}
          <div style={{ borderTop: "1px solid #f1f3f5", padding: "6px 0 4px" }}>
            <button
              type="button"
              disabled={loggingOut}
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: "9px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#dc2626",
                fontSize: "0.88rem",
                fontWeight: 500,
                textAlign: "left",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {loggingOut ? "Saindo…" : "Sair da conta"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Header ──────────────────────────────────────────────────────────────

function Header() {
  const [show, setShow] = useState<number | null>(null);
  const [isActive, setIsActive] = useState<number | null>(null);
  const [scroll, setScroll] = useState(false);

  // Auth state
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Carrega usuário inicial
    supabaseClient.auth.getUser().then(({ data }) => {
      setAuthUser(data.user ?? null);
      setAuthLoading(false);
    });

    // Escuta mudanças de sessão (login / logout)
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  function menuHandler(index: number) {
    setIsActive((prev) => (prev === index ? null : index));
  }

  useEffect(() => {
    function scrollHandler() {
      setScroll(window.scrollY >= 90);
    }
    window.addEventListener("scroll", scrollHandler);
    return () => window.removeEventListener("scroll", scrollHandler);
  }, []);

  const form = useRef<HTMLFormElement>(null);
  const sendEmail = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.current) return;
    emailjs
      .sendForm("service_61hny88", "template_vvlidif", form.current, {
        publicKey: "aYOgb_ORYkjD-hXhl",
      })
      .then(() => undefined)
      .catch(() => undefined);
  };

  const role = authUser ? getRoleFromUser(authUser) : null;

  return (
    <>
      <header className="site-header header style-1">
        <div className={`sticky-header main-bar-wraper ${scroll ? "is-fixed" : ""}`}>
          <div className="main-bar clearfix bg-primary text-white">
            <div className="container-fluid clearfix inner-bar">
              <button
                onClick={() => setShow(2)}
                className={`w3menu-toggler navicon ${show ? "open" : ""}`}
                type="button"
                data-target="#W3Menu"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
              <div onClick={() => setShow(null)} className="menu-close fade-overlay"></div>
              <div
                className={`header-nav w3menu w3menu-end mo-left ${show === 2 ? "show" : ""}`}
                id="W3Menu"
              >
                <ul className="nav navbar-nav">
                  {headerdata.map((data: HeaderItem, i: number) => {
                    const menuClassName = data.classChange;
                    if (menuClassName === "has-mega-menu") {
                      return (
                        <li
                          key={i}
                          className={`has-mega-menu sub-menu-down auto-width menu-left ${i === isActive ? "open" : ""}`}
                        >
                          <Link href="#" onClick={() => menuHandler(i)}>
                            <span>{data.title}</span>
                            <i className="fas fa-chevron-down tabIndex" />
                          </Link>
                          <div className="mega-menu">
                            <ul className="demo-menu">
                              {data.content?.map((item, index) => (
                                <li key={index}>
                                  <Link href={item.to}>
                                    <Image src={item.image as string} alt={item.title} />
                                    <span className="menu-title">{item.title}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </li>
                      );
                    } else if (menuClassName === "sub-menu-down") {
                      return (
                        <li
                          key={i}
                          className={`sub-menu-down ${i === isActive ? "open" : ""}`}
                          onClick={() => menuHandler(i)}
                        >
                          <Link href="#">
                            <span>{data.title}</span>
                            <i className="fas fa-chevron-down tabIndex" />
                          </Link>
                          <ul className="sub-menu">
                            {data.content?.map((item, index) => (
                              <li key={index}>
                                <Link href={item.to}>{item.title}</Link>
                              </li>
                            ))}
                          </ul>
                        </li>
                      );
                    } else {
                      return (
                        <li key={i}>
                          <Link href={data.to as string}>
                            <span>{data.title}</span>
                          </Link>
                        </li>
                      );
                    }
                  })}

                  {/* Item dinâmico de auth no menu mobile */}
                  {!authLoading && !authUser && (
                    <li>
                      <Link href="/login/paciente">
                        <span>Painel</span>
                      </Link>
                    </li>
                  )}
                  {!authLoading && authUser && (
                    <li>
                      <Link href={dashboardHref(role)} onClick={() => setShow(null)}>
                        <span>Painel</span>
                      </Link>
                    </li>
                  )}
                </ul>

                <div className="dz-social-icon">
                  <ul>
                    <li>
                      <Link href="https://www.facebook.com/dexignzone" target="_blank">
                        <i className="fa-brands fa-facebook-f" />
                      </Link>
                    </li>
                    <li>
                      <Link href="https://x.com/dexignzone" target="_blank">
                        <i className="fa-brands fa-x-twitter" />
                      </Link>
                    </li>
                    <li>
                      <Link href="https://www.linkedin.com/showcase/dexignzone" target="_blank">
                        <i className="fa-brands fa-linkedin" />
                      </Link>
                    </li>
                    <li>
                      <Link href="https://www.instagram.com/dexignzone" target="_blank">
                        <i className="fa-brands fa-instagram" />
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Extra nav — botões à direita */}
              <div className={`extra-nav ${scroll ? "active" : ""}`}>
                <div className="extra-cell">
                  <ul className="header-right" style={{ display: "flex", alignItems: "center", gap: 10, listStyle: "none", margin: 0, padding: 0 }}>

                    {/* "Já atua na área?" — só aparece quando não está logado como psi */}
                    {!authLoading && role !== "PSYCHOLOGIST" && (
                      <li className="nav-item">
                        <Link href="/login/psicologo" className="btn btn-secondary btn-hover1">
                          Já atua na área?
                        </Link>
                      </li>
                    )}

                    {/* Botão auth */}
                    <li className="nav-item">
                      {authLoading ? (
                        // Placeholder durante verificação para não ter layout shift
                        <div style={{ width: 90, height: 38 }} />
                      ) : authUser ? (
                        <UserMenu user={authUser} />
                      ) : (
                        <Link
                          href="/login/paciente"
                          className="btn btn-light btn-hover1"
                          style={{ fontWeight: 600, fontSize: "0.88rem" }}
                        >
                          Entrar
                        </Link>
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Offcanvas lateral */}
        <div
          className={`offcanvas dz-offcanvas offcanvas offcanvas-end ${show === 1 ? "show" : ""}`}
          tabIndex={-1}
          id="headerSidebar"
        >
          <button
            onClick={() => setShow(null)}
            type="button"
            className="btn-close m-t10 m-l10"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
          <div className="offcanvas-body">
            <div className="widget">
              <div className="sidebar-header m-b20">
                <Link href="/">
                  <Image src={IMAGES.logo} alt="/" />
                </Link>
              </div>
              <p>
                ClinicMaster is a modern and responsive Bootstrap HTML template designed for
                health and medical websites.
              </p>
            </div>
            <div className="widget">
              <div className="widget-title">
                <h4 className="title">Contact Us</h4>
              </div>
              <ul className="list-check">
                <li>785 15h Street, Office 478 Berlin, De 81566</li>
                <li>
                  <Link href="mailto:email@domain.com" className="text-body">
                    email@domain.com
                  </Link>
                </li>
                <li>
                  <Link href="tel:+11234567890" className="text-body">
                    +1 123 456 7890
                  </Link>
                </li>
              </ul>
            </div>
            <div className="widget">
              <div className="widget-title">
                <h4 className="title">Newsletter</h4>
              </div>
              <form className="dzSubscribe style-2" ref={form} onSubmit={sendEmail} method="post">
                <div className="dzSubscribeMsg" />
                <div className="form-group">
                  <div className="input-group mb-0">
                    <input
                      name="dzEmail"
                      required
                      type="email"
                      className="form-control"
                      placeholder="Your Email Address"
                    />
                    <div className="input-group-addon">
                      <button
                        name="submit"
                        value="Submit"
                        type="submit"
                        className="btn text-primary btn-transparent p-2"
                      >
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
                  <li>
                    <Link href="https://www.linkedin.com/showcase/dexignzone" target="_blank">
                      <i className="fa-brands fa-linkedin" />
                    </Link>
                  </li>
                  <li>
                    <Link href="https://www.instagram.com/dexignzone" target="_blank">
                      <i className="fa-brands fa-instagram" />
                    </Link>
                  </li>
                  <li>
                    <Link href="https://www.facebook.com/dexignzone" target="_blank">
                      <i className="fa-brands fa-facebook-f" />
                    </Link>
                  </li>
                  <li>
                    <Link href="https://x.com/dexignzone" target="_blank">
                      <i className="fa-brands fa-x-twitter" />
                    </Link>
                  </li>
                  <li>
                    <Link href="https://www.youtube.com/@dexignzone" target="_blank">
                      <i className="fa-brands fa-youtube" />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
