"use client";

import CountUp from "react-countup";
import Link from "next/link";
import Image from "next/image";
import type { TeamFeaturedPsychologist } from "@/actions/psychologists/types";
import { IMAGES } from "@/constant/theme";

type Props = {
  psychologist: TeamFeaturedPsychologist;
};

/**
 * Bloco largo estilo MeetDr — dados vindos do banco (destaque publicitário na /team).
 */
export function TeamFeaturedPsychologistSection({ psychologist }: Props) {
  const detailHref = `/team-detail?slug=${encodeURIComponent(psychologist.slug)}`;
  const isRemote =
    typeof psychologist.profileImageUrl === "string" && psychologist.profileImageUrl.startsWith("http");
  const skillShow = psychologist.skills.slice(0, 10);
  const bio =
    psychologist.bio?.trim() ||
    "Profissional em destaque na plataforma. Confira o perfil completo para mais informações.";
  const counterEnd = Math.min(Math.max(skillShow.length, 1), 40);

  return (
    <section
      className="clearfix overlay-primary-dark overlay-opacity-95 p-t50 bg-img-fix m-b50"
      style={{ backgroundImage: `url(${IMAGES.bg1})` }}
    >
      <div className="container">
        <div className="row content-wrapper style-6 align-items-end">
          <div className="col-xl-6 col-lg-5 wow fadeInLeft" data-wow-delay="0.2s" data-wow-duration="0.8s">
            <div className="content-media">
              <div className="dz-media position-relative">
                <div
                  className="position-relative w-100 overflow-hidden rounded"
                  style={{ aspectRatio: "1 / 1.05", maxHeight: 480, minHeight: 280 }}
                >
                  {isRemote ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={psychologist.profileImageUrl!}
                      alt={psychologist.displayName}
                      className="position-absolute top-0 start-0 w-100 h-100"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <Image
                      src={psychologist.profileImageUrl || IMAGES.about1png}
                      alt={psychologist.displayName}
                      fill
                      className="object-fit-cover"
                      sizes="(max-width: 992px) 100vw, 50vw"
                    />
                  )}
                </div>
                <div
                  className="item1"
                  data-bottom-top="transform: translateY(-50px)"
                  data-top-bottom="transform: translateY(50px)"
                >
                  <div className="info-widget style-10 move-3">
                    <span className="content-text text-primary">
                      <span className="counter">
                        <CountUp start={0} end={counterEnd} duration={4} />
                      </span>
                      +
                    </span>
                    <h3 className="title m-b0 text-white">
                      Competências <br /> cadastradas
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-6 col-lg-7 m-b30 align-self-center">
            <div className="section-head style-1 m-b30">
              <span className="badge bg-warning text-dark mb-2">Destaque</span>
              <h2 className="title wow fadeInUp text-white" data-wow-delay="0.2s" data-wow-duration="0.8s">
                {psychologist.displayName}
              </h2>
              <p className="fw-normal text-white wow fadeInUp" data-wow-delay="0.4s" data-wow-duration="0.8s">
                <strong className="text-warning fw-semibold">{psychologist.specialty || "Psicologia"}</strong>
                {" — "}
                {bio}
              </p>
            </div>
            <h3
              className="text-primary title-dashed-separator wow fadeInUp"
              data-wow-delay="0.6s"
              data-wow-duration="0.8s"
            >
              Competências
            </h3>
            {skillShow.length > 0 ? (
              <ul
                className="list-check-circle text-white fw-medium grid-2 m-b30 wow fadeInUp"
                data-wow-delay="0.8s"
                data-wow-duration="0.8s"
              >
                {skillShow.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            ) : (
              <p className="text-white-50 small m-b30">Competências serão exibidas quando cadastradas no perfil.</p>
            )}
            <Link href={detailHref} className="btn btn-lg btn-primary btn-shadow">
              Ver perfil completo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
