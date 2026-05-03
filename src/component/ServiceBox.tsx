"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { HomeCatalogSpecialtyCard } from "@/types/home-catalog-specialty";

const DELAYS = ["0.2s", "0.4s", "0.6s", "0.8s"];

type Props = {
  items: HomeCatalogSpecialtyCard[];
};

export default function ServiceBox({ items }: Props) {
  const [active, setActive] = useState<string | null>(null);

  const hasItems = items.length > 0;
  const list = useMemo(() => items, [items]);

  if (!hasItems) {
    return (
      <div className="row">
        <div className="col-12 text-center text-muted py-4">
          <p className="mb-0">Em breve você verá nossas especialidades aqui.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      {list.map((data, i) => (
        <div
          className="col-xl-3 col-md-6 m-b30 wow fadeInUp"
          data-wow-delay={DELAYS[i % DELAYS.length]}
          data-wow-duration="0.8s"
          key={data.id}
        >
          <div
            className={`icon-bx-wraper style-3 box-hover ${active === data.id ? "active" : ""}`}
            onMouseEnter={() => setActive(data.id)}
            onMouseLeave={() => setActive(null)}
          >
            <div className="icon-bx-head">
              <div className="icon-bx">
                <span className="icon-cell d-flex align-items-center justify-content-center overflow-hidden rounded-circle bg-light border">
                  {data.imageUrl ? (
                    <Image
                      src={data.imageUrl}
                      alt=""
                      width={88}
                      height={88}
                      className="object-fit-cover rounded-circle"
                    />
                  ) : (
                    <i className="feather icon-heart fs-3 text-secondary" aria-hidden />
                  )}
                </span>
              </div>
              <div className="icon-content mt-3">
                <h3 className={`dz-title ${active === data.id ? "text-white" : "text-secondary"}`}>{data.name}</h3>
                <p className={active === data.id ? "text-white opacity-75" : "text-muted"}>
                  {(data.description?.trim()) || "Atendimento especializado para o seu cuidado."}
                </p>
              </div>
            </div>
            <div className="icon-bx-footer">
              <span className="text-badge">
                <i className="fa fa-circle text-primary" /> {data.psychologistCount} Especialista
                {data.psychologistCount === 1 ? "" : "s"}
              </span>
              <Link
                href={`/team?especialidade=${encodeURIComponent(data.slug)}`}
                className="btn btn-square btn-primary rounded-circle"
                aria-label={`Ver especialistas — ${data.name}`}
              >
                <i className="feather icon-arrow-up-right" />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
