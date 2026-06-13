"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { IMAGES } from "@/constant/theme";
import { prefetchPsychologistBySlug, usePublicPsychologists } from "@/hooks/psychologists/queries";
import PsychologistSocialLinks from "@/component/PsychologistSocialLinks";

const CARD_W   = 270;   // px — largura de cada card
const CARD_GAP = 24;    // px — gap entre cards
const AUTO_MS  = 3500;  // ms — intervalo do auto-avanço

function EmpolyBlog() {
  const trackRef    = useRef<HTMLDivElement>(null);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [current, setCurrent]   = useState(0);
  const [paused,  setPaused]    = useState(false);
  const [visible, setVisible]   = useState(4); // cards visíveis simultaneamente

  const { data: list = [], isLoading: loading } = usePublicPsychologists(8);
  const total = list.length;

  const queryClient = useQueryClient();

  // ── Calcula quantos cards cabem na tela ──────────────────────────────────
  useEffect(() => {
    function calc() {
      const w = window.innerWidth;
      if (w < 576)       setVisible(1);
      else if (w < 768)  setVisible(2);
      else if (w < 1200) setVisible(3);
      else               setVisible(4);
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // ── Scroll suave para o índice ───────────────────────────────────────────
  const scrollTo = useCallback((idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(idx, total - 1));
    track.scrollTo({ left: clamped * (CARD_W + CARD_GAP), behavior: "smooth" });
    setCurrent(clamped);
  }, [total]);

  // ── Sincroniza `current` com o scroll real (swipe mobile) ────────────────
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    function onScroll() {
      const idx = Math.round(track!.scrollLeft / (CARD_W + CARD_GAP));
      setCurrent(Math.max(0, Math.min(idx, total - 1)));
    }
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [total]);

  // ── Auto-avanço ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (paused || total === 0) return;
    timerRef.current = setTimeout(() => {
      const next = current >= total - visible ? 0 : current + 1;
      scrollTo(next);
    }, AUTO_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, paused, total, visible, scrollTo]);

  function prev() {
    setPaused(true);
    scrollTo(current <= 0 ? total - visible : current - 1);
  }
  function next() {
    setPaused(true);
    scrollTo(current >= total - visible ? 0 : current + 1);
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", gap: CARD_GAP, overflow: "hidden", padding: "0 24px" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ width: CARD_W, flexShrink: 0 }}>
            <div className="dz-team style-1 box-hover p-3 bg-white rounded border" style={{ minHeight: 320 }}>
              <div className="placeholder-glow">
                <span className="placeholder col-12 rounded mb-3" style={{ height: 220, display: "block" }} />
                <span className="placeholder col-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="text-center text-muted py-4">
        <p className="mb-0">Em breve você verá nossos psicólogos aqui.</p>
      </div>
    );
  }

  const atStart = current === 0;
  const atEnd   = current >= total - visible;

  return (
    <div
      className="position-relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Seta esquerda ── */}
      <button
        type="button"
        onClick={prev}
        aria-label="Anterior"
        style={{
          position:   "absolute",
          left:       8,
          top:        "50%",
          transform:  "translateY(-50%)",
          zIndex:     10,
          width:      42,
          height:     42,
          borderRadius: "50%",
          border:     "none",
          background: "rgba(255,255,255,0.95)",
          boxShadow:  "0 2px 12px rgba(0,0,0,0.15)",
          display:    "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor:     "pointer",
          opacity:    atStart ? 0.35 : 1,
          transition: "opacity 0.2s",
        }}
      >
        <ChevronLeft size={20} />
      </button>

      {/* ── Seta direita ── */}
      <button
        type="button"
        onClick={next}
        aria-label="Próximo"
        style={{
          position:   "absolute",
          right:      8,
          top:        "50%",
          transform:  "translateY(-50%)",
          zIndex:     10,
          width:      42,
          height:     42,
          borderRadius: "50%",
          border:     "none",
          background: "rgba(255,255,255,0.95)",
          boxShadow:  "0 2px 12px rgba(0,0,0,0.15)",
          display:    "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor:     "pointer",
          opacity:    atEnd ? 0.35 : 1,
          transition: "opacity 0.2s",
        }}
      >
        <ChevronRight size={20} />
      </button>

      {/* ── Fades laterais ── */}
      <div aria-hidden style={{
        position: "absolute", inset: "0 auto 0 0", width: 60, zIndex: 5,
        background: "linear-gradient(to right, var(--bs-body-bg,#fff), transparent)",
        pointerEvents: "none",
      }} />
      <div aria-hidden style={{
        position: "absolute", inset: "0 0 0 auto", width: 60, zIndex: 5,
        background: "linear-gradient(to left, var(--bs-body-bg,#fff), transparent)",
        pointerEvents: "none",
      }} />

      {/* ── Track com scroll-snap ── */}
      <div
        ref={trackRef}
        style={{
          display:                "flex",
          gap:                    CARD_GAP,
          overflowX:              "auto",
          scrollSnapType:         "x mandatory",
          scrollbarWidth:         "none",     // Firefox
          msOverflowStyle:        "none",     // IE/Edge
          padding:                "8px 60px 16px",
          WebkitOverflowScrolling: "touch",
        }}
        // Hide scrollbar no Chrome/Safari via CSS class
        className="emply-track"
      >
        {list.map((data) => {
          const imgSrc   = data.profileImageUrl || IMAGES.team1;
          const isRemote = typeof data.profileImageUrl === "string" && data.profileImageUrl.startsWith("http");

          return (
            <div
              key={data.id}
              style={{ width: CARD_W, flexShrink: 0, scrollSnapAlign: "start" }}
              onMouseEnter={() => void prefetchPsychologistBySlug(queryClient, data.slug)}
              onFocus={() => void prefetchPsychologistBySlug(queryClient, data.slug)}
            >
              <div className="dz-team style-1 box-hover">
                <div className="dz-media bg-primary">
                  <div
                    className="position-relative w-100 overflow-hidden bg-primary"
                    style={{ aspectRatio: "1 / 1.12" }}
                  >
                    {isRemote ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={data.profileImageUrl!}
                        alt={data.displayName}
                        className="position-absolute top-0 start-0 w-100 h-100"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <Image
                        src={imgSrc}
                        alt={data.displayName}
                        fill
                        className="object-fit-cover"
                        sizes={`${CARD_W}px`}
                      />
                    )}
                  </div>
                  <Link
                    href={`/team-detail?slug=${encodeURIComponent(data.slug)}`}
                    className="btn btn-secondary"
                  >
                    <i className="feather icon-calendar m-r5" /> Agendar agora
                  </Link>
                </div>

                <div className="dz-content bg-primary">
                  <div className="clearfix">
                    <h3 className="dz-name">
                      <Link href={`/team-detail?slug=${encodeURIComponent(data.slug)}`}>
                        {data.displayName}
                      </Link>
                    </h3>
                    <span className="dz-position text-white">
                      {data.specialty || "Psicologia"}
                    </span>
                  </div>
                  <Link
                    href={`/team-detail?slug=${encodeURIComponent(data.slug)}`}
                    className="btn btn-square btn-primary"
                  >
                    <i className="feather text-primary icon-arrow-right" />
                  </Link>
                </div>

                <PsychologistSocialLinks links={data.socialLinks} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Dots ── */}
      {total > 1 && (
        <div className="d-flex justify-content-center gap-2 mt-2 pb-2">
          {list.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { setPaused(true); scrollTo(i); }}
              aria-label={`Ir para card ${i + 1}`}
              style={{
                width:        i === current ? 22 : 8,
                height:       8,
                borderRadius: 4,
                border:       "none",
                padding:      0,
                background:   i === current ? "var(--bs-primary,#2563eb)" : "#d1d5db",
                transition:   "all 0.3s ease",
                cursor:       "pointer",
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        .emply-track::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

export default EmpolyBlog;
