"use client";

import CountUp from "react-countup";
import Link from "next/link";
import Image from "next/image";
import { Award, BadgeCheck, CheckCircle2 } from "lucide-react";
import type { TeamFeaturedPsychologist } from "@/actions/psychologists/types";
import { IMAGES } from "@/constant/theme";

type Props = {
  psychologist: TeamFeaturedPsychologist;
};

/**
 * Bloco de destaque publicitario na /team.
 * Layout proprio (sem as classes content-wrapper style-6 do tema, que aplicavam
 * translateX/margens negativas e quebravam o alinhamento entre 992px e 1199px).
 */
export function TeamFeaturedPsychologistSection({ psychologist }: Props) {
  const detailHref = `/team-detail?slug=${encodeURIComponent(psychologist.slug)}`;
  const isRemote =
    typeof psychologist.profileImageUrl === "string" && psychologist.profileImageUrl.startsWith("http");
  const skillShow = psychologist.skills.slice(0, 8);
  const bio =
    psychologist.bio?.trim() ||
    "Profissional em destaque na plataforma. Confira o perfil completo para mais informações.";
  const counterEnd = Math.min(Math.max(skillShow.length, 1), 40);

  return (
    <section
      className="featured-psy m-b50"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(76,29,116,0.97) 0%, rgba(123,63,160,0.95) 55%, rgba(150,82,196,0.93) 100%), url(${IMAGES.bg1.src})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="container">
        <div className="row align-items-center gy-4 gx-lg-5 featured-psy-row">
          {/* ── Foto ── */}
          <div className="col-lg-5 col-md-6">
            <div className="featured-psy-media">
              <div className="featured-psy-photo">
                {isRemote ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={psychologist.profileImageUrl!}
                    alt={psychologist.displayName}
                    className="w-100 h-100"
                    style={{ objectFit: "cover", objectPosition: "center top" }}
                  />
                ) : (
                  <Image
                    src={psychologist.profileImageUrl || IMAGES.about1png}
                    alt={psychologist.displayName}
                    fill
                    className="object-fit-cover"
                    style={{ objectPosition: "center top" }}
                    sizes="(max-width: 768px) 100vw, (max-width: 992px) 50vw, 40vw"
                  />
                )}

                {/* Selo "DESTAQUE" sobre a foto */}
                <span className="featured-psy-badge">
                  <Award size={14} className="me-1" />
                  Destaque
                </span>

                {/* Widget flutuante de competencias */}
                {skillShow.length > 0 && (
                  <div className="featured-psy-stat">
                    <span className="featured-psy-stat-num">
                      <CountUp start={0} end={counterEnd} duration={3} />+
                    </span>
                    <span className="featured-psy-stat-label">
                      Competências<br />cadastradas
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Conteudo ── */}
          <div className="col-lg-7 col-md-6">
            <div className="featured-psy-content">
              <h2 className="featured-psy-name text-white">{psychologist.displayName}</h2>

              <p className="featured-psy-bio text-white">
                <strong className="text-warning fw-semibold">
                  {psychologist.specialty || "Psicologia"}
                </strong>
                {" — "}
                {bio}
              </p>

              {skillShow.length > 0 && (
                <>
                  <h3 className="featured-psy-skills-title text-white">
                    <BadgeCheck size={18} className="me-2 text-warning" />
                    Competências
                  </h3>
                  <ul className="featured-psy-skills">
                    {skillShow.map((s) => (
                      <li key={s}>
                        <CheckCircle2 size={16} className="featured-psy-skill-icon" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <Link href={detailHref} className="btn btn-lg btn-primary btn-shadow featured-psy-cta">
                Ver perfil completo
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .featured-psy {
          padding: 56px 0;
          position: relative;
          overflow: hidden;
        }

        /* ── Foto ── */
        .featured-psy-media {
          position: relative;
          max-width: 420px;
          margin: 0 auto;
        }
        .featured-psy-photo {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1.15;
          border-radius: 20px;
          overflow: hidden;
          background: rgba(255,255,255,0.08);
          box-shadow: 0 24px 60px rgba(0,0,0,0.35);
        }
        .featured-psy-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          display: inline-flex;
          align-items: center;
          background: var(--bs-warning, #ffb800);
          color: #1a1a1a;
          font-size: 0.78rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 30px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          box-shadow: 0 4px 14px rgba(0,0,0,0.25);
          z-index: 2;
        }
        .featured-psy-stat {
          position: absolute;
          left: 16px;
          bottom: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(6px);
          border-radius: 16px;
          padding: 12px 18px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.25);
          z-index: 2;
          max-width: calc(100% - 32px);
        }
        .featured-psy-stat-num {
          font-size: 2.2rem;
          font-weight: 800;
          line-height: 1;
          color: var(--bs-primary, #6a3093);
        }
        .featured-psy-stat-label {
          font-size: 0.82rem;
          font-weight: 600;
          line-height: 1.2;
          color: #333;
        }

        /* ── Conteudo ── */
        .featured-psy-content { padding: 8px 0; }
        .featured-psy-name {
          font-size: clamp(1.6rem, 1.1rem + 2vw, 2.6rem);
          font-weight: 700;
          margin-bottom: 12px;
          line-height: 1.15;
        }
        .featured-psy-bio {
          font-size: 0.98rem;
          line-height: 1.6;
          opacity: 0.92;
          margin-bottom: 22px;
        }
        .featured-psy-skills-title {
          display: flex;
          align-items: center;
          font-size: 1.05rem;
          font-weight: 600;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px dashed rgba(255,255,255,0.3);
        }
        .featured-psy-skills {
          list-style: none;
          padding: 0;
          margin: 0 0 28px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px 24px;
        }
        .featured-psy-skills li {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fff;
          font-weight: 500;
          font-size: 0.92rem;
        }
        .featured-psy-skill-icon {
          color: var(--bs-warning, #ffb800);
          flex-shrink: 0;
        }
        .featured-psy-cta { border-radius: 30px; font-weight: 600; }

        /* ── Responsivo ── */
        @media (max-width: 991px) {
          .featured-psy { padding: 44px 0; }
          .featured-psy-row { row-gap: 32px !important; }
          .featured-psy-media { max-width: 360px; }
          .featured-psy-content { text-align: center; }
          .featured-psy-skills-title { justify-content: center; }
          .featured-psy-skills {
            max-width: 460px;
            margin-left: auto;
            margin-right: auto;
          }
        }
        @media (max-width: 575px) {
          .featured-psy { padding: 36px 0; }
          .featured-psy-media { max-width: 300px; }
          .featured-psy-skills {
            grid-template-columns: 1fr;
            gap: 10px;
            text-align: left;
            max-width: 280px;
          }
          .featured-psy-stat-num { font-size: 1.8rem; }
          .featured-psy-stat-label { font-size: 0.74rem; }
          .featured-psy-cta { width: 100%; }
        }
      `}</style>
    </section>
  );
}
