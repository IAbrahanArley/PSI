"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { IMAGES } from "@/constant/theme";
import { usePublicPsychologists } from "@/hooks/psychologists/queries";

const DELAYS = ["0.2s", "0.4s", "0.6s", "0.8s", "1.0s", "1.2s", "1.4s", "1.6s"];

function EmpolyBlog() {
  const [active, setActive] = useState(1);
  const { data: list = [], isLoading: loading } = usePublicPsychologists(4);

  useEffect(() => {
    if (list[0]) setActive(1);
  }, [list]);

  if (loading) {
    return (
      <div className="row">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="col-xl-3 col-sm-6">
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

  if (list.length === 0) {
    return (
      <div className="row">
        <div className="col-12 text-center text-muted py-4">
          <p className="mb-0">Em breve você verá nossos psicólogos aqui.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="row">
        {list.map((data, i) => {
          const delay = DELAYS[i % DELAYS.length];
          const cardId = i + 1;
          const imgSrc = data.profileImageUrl || IMAGES.team1;
          const isRemote = typeof data.profileImageUrl === "string" && data.profileImageUrl.startsWith("http");

          return (
            <div
              className="col-xl-3 col-sm-6 wow fadeInUp"
              data-wow-delay={delay}
              data-wow-duration="0.8s"
              key={data.id}
            >
              <div
                className={`dz-team  style-1 box-hover ${active === cardId ? "active" : ""}`}
                onMouseEnter={() => setActive(cardId)}
              >
                <div className="dz-media bg-primary">
                  <div
                    className="position-relative w-100 overflow-hidden bg-primary"
                    style={{ aspectRatio: "1 / 1.12" }}
                  >
                    {isRemote ? (
                      <img
                        src={data.profileImageUrl!}
                        alt=""
                        className="position-absolute top-0 start-0 w-100 h-100"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <Image
                        src={imgSrc}
                        alt=""
                        fill
                        className="object-fit-cover"
                        sizes="(max-width: 576px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    )}
                  </div>
                  <Link href="/appointment" className="btn btn-secondary">
                    <i className="feather icon-calendar m-r5" /> Agendar agora
                  </Link>
                </div>
                <div className="dz-content bg-primary">
                  <div className="clearfix">
                    <h3 className="dz-name">
                      <Link href={`/team-detail?slug=${encodeURIComponent(data.slug)}`}>{data.displayName}</Link>
                    </h3>
                    <span className="dz-position text-white">{data.specialty || "Psicologia"}</span>
                  </div>
                  <Link href={`/team-detail?slug=${encodeURIComponent(data.slug)}`} className="btn btn-square btn-primary">
                    <i className="feather text-primary icon-arrow-right" />
                  </Link>
                </div>
                <ul className="dz-social">
                  <li>
                    <Link href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">
                      <i className="fa-brands fa-linkedin text-primary" />
                    </Link>
                  </li>
                  <li>
                    <Link href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">
                      <i className="fa-brands fa-instagram text-primary" />
                    </Link>
                  </li>
                  <li>
                    <Link href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
                      <i className="fa-brands fa-facebook-f text-primary" />
                    </Link>
                  </li>
                  <li>
                    <Link href="https://x.com" target="_blank" rel="noopener noreferrer">
                      <i className="fa-brands fa-x-twitter text-primary" />
                    </Link>
                  </li>
                  <li>
                    <Link href="https://www.youtube.com" target="_blank" rel="noopener noreferrer">
                      <i className="fa-brands fa-youtube text-primary" />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default EmpolyBlog;
