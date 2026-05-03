"use client";

import Link from "next/link";
import Image from "next/image";
import type { PublicPsychologist } from "@/actions/psychologists/types";
import { IMAGES } from "@/constant/theme";
import PsychologistSocialLinks from "@/component/PsychologistSocialLinks";

/** Mesmos atrasos do `EmpolyBlog` para manter o ritmo das animações WOW. */
const DELAYS = ["0.2s", "0.4s", "0.6s", "0.8s", "1.0s", "1.2s", "1.4s", "1.6s"];

export type TeamPsychologistCardProps = {
  psychologist: PublicPsychologist;
  /** Índice na lista (define `data-wow-delay`). */
  index: number;
  isActive: boolean;
  onActivate: () => void;
  /** Texto do botão sobre a foto (ex.: "Ver perfil"). */
  ctaLabel?: string;
};

/**
 * Card de psicólogo na grade `/team` — layout, proporção da mídia e redes iguais ao `EmpolyBlog`
 * (links sociais genéricos para troca futura por URLs reais).
 */
export function TeamPsychologistCard({
  psychologist,
  index,
  isActive,
  onActivate,
  ctaLabel = "Ver perfil",
}: TeamPsychologistCardProps) {
  const delay = DELAYS[index % DELAYS.length];
  const detailHref = `/team-detail?slug=${encodeURIComponent(psychologist.slug)}`;
  const imgSrc = psychologist.profileImageUrl || IMAGES.team1;
  const isRemote =
    typeof psychologist.profileImageUrl === "string" && psychologist.profileImageUrl.startsWith("http");

  return (
    <div className="col-xl-3 col-sm-6 wow fadeInUp" data-wow-delay={delay} data-wow-duration="0.8s">
      <div
        className={`dz-team style-1 box-hover ${isActive ? "active" : ""}`}
        onMouseEnter={onActivate}
      >
        <div className="dz-media bg-primary">
          <div
            className="position-relative w-100 overflow-hidden bg-primary"
            style={{ aspectRatio: "1 / 1.12" }}
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
                src={imgSrc}
                alt={psychologist.displayName}
                fill
                className="object-fit-cover"
                sizes="(max-width: 576px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            )}
          </div>
          <Link href={detailHref} className="btn btn-secondary">
            <i className="feather icon-calendar m-r5" /> {ctaLabel}
          </Link>
        </div>
        <div className="dz-content bg-primary">
          <div className="clearfix">
            <h3 className="dz-name">
              <Link href={detailHref}>{psychologist.displayName}</Link>
            </h3>
            <span className="dz-position text-white">{psychologist.specialty || "Psicologia"}</span>
          </div>
          <Link href={detailHref} className="btn btn-square btn-primary">
            <i className="feather text-primary icon-arrow-right" />
          </Link>
        </div>
        <PsychologistSocialLinks links={psychologist.socialLinks} />
      </div>
    </div>
  );
}
