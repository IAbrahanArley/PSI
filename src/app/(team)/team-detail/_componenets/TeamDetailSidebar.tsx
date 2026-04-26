"use client";

import Link from "next/link";
import Table from "react-bootstrap/Table";
import type { PsychologistDetail } from "@/actions/psychologists/types";
import { digitsOnly } from "@/lib/utils";

type Props = {
  data: PsychologistDetail | null | undefined;
  isLoading: boolean;
};

function telHref(phone: string): string {
  const d = digitsOnly(phone);
  return d ? `tel:+${d}` : "#";
}

function waHref(whatsapp: string): string {
  const d = digitsOnly(whatsapp);
  return d ? `https://wa.me/${d}` : "#";
}

export function TeamDetailSidebar({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <>
        <div className="widget widget_schedule bg-secondary text-white wow fadeInUp" data-wow-delay="0.2s" data-wow-duration="0.7s">
          <div className="widget-title">
            <h4 className="title text-white">Horário de atendimento</h4>
          </div>
          <p className="text-white small px-3 pb-3 mb-0">Carregando…</p>
        </div>
        <div className="widget widget_info bg-light wow fadeInUp" data-wow-delay="0.3s" data-wow-duration="0.7s">
          <p className="text-muted small p-3 mb-0">Carregando contatos…</p>
        </div>
      </>
    );
  }

  if (!data) {
    return null;
  }

  const { weeklySchedule, addresses, contactEmail, phone, whatsapp, city, state } = data;

  return (
    <>
      <div className="widget widget_schedule bg-secondary text-white wow fadeInUp" data-wow-delay="0.2s" data-wow-duration="0.7s">
        <div className="widget-title">
          <h4 className="title text-white">Horário de atendimento</h4>
        </div>
        {weeklySchedule.length === 0 ? (
          <p className="text-white small px-3 pb-3 mb-0 opacity-90">
            Nenhum horário cadastrado na agenda. Entre em contato para combinar disponibilidade.
          </p>
        ) : (
          <Table className="table table-border-bottom m-b0 text-white">
            <tbody>
              {weeklySchedule.map((row) => (
                <tr key={row.weekday}>
                  <th scope="row" className="text-white small fw-normal border-secondary border-opacity-25">
                    {row.label}
                  </th>
                  <td className="text-end small border-secondary border-opacity-25">{row.rangesText}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>

      <div className="widget widget_info bg-light wow fadeInUp" data-wow-delay="0.3s" data-wow-duration="0.7s">
        {addresses.length > 0 ? (
          <div className="icon-bx-wraper style-1 m-b20">
            <div className="icon-bx bg-primary">
              <span className="icon-cell">
                <i className="feather icon-map-pin" />
              </span>
            </div>
            <div className="icon-content">
              <h5 className="dz-title fw-semibold">Endereços de atendimento</h5>
              <ul className="list-unstyled m-b0 small">
                {addresses.map((a) => (
                  <li key={a.id} className="m-b15">
                    <strong className="d-block">{a.label}</strong>
                    <span className="fw-normal text-body">{a.formatted}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="icon-bx-wraper style-1 m-b20">
            <div className="icon-bx bg-primary">
              <span className="icon-cell">
                <i className="feather icon-map-pin" />
              </span>
            </div>
            <div className="icon-content">
              <h5 className="dz-title fw-semibold">Endereço</h5>
              <p className="fw-normal small text-muted m-b0">
                {[city, state].filter(Boolean).length > 0
                  ? [city, state].filter(Boolean).join(" · ")
                  : "Endereço não informado no cadastro."}
              </p>
            </div>
          </div>
        )}

        {phone ? (
          <div className="icon-bx-wraper style-1 m-b20">
            <div className="icon-bx bg-primary">
              <span className="icon-cell">
                <i className="feather icon-phone" />
              </span>
            </div>
            <div className="icon-content">
              <h5 className="dz-title fw-semibold">Telefone</h5>
              <p className="fw-normal m-b0">
                <Link href={telHref(phone)} className="text-body">
                  {phone}
                </Link>
              </p>
            </div>
          </div>
        ) : null}

        {whatsapp ? (
          <div className="icon-bx-wraper style-1 m-b20">
            <div className="icon-bx bg-primary">
              <span className="icon-cell">
                <i className="fab fa-whatsapp" />
              </span>
            </div>
            <div className="icon-content">
              <h5 className="dz-title fw-semibold">WhatsApp</h5>
              <p className="fw-normal m-b0">
                <Link href={waHref(whatsapp)} className="text-body" target="_blank" rel="noopener noreferrer">
                  {whatsapp}
                </Link>
              </p>
            </div>
          </div>
        ) : null}

        {contactEmail ? (
          <div className="icon-bx-wraper style-1 m-b15">
            <div className="icon-bx bg-primary">
              <span className="icon-cell">
                <i className="feather icon-mail" />
              </span>
            </div>
            <div className="icon-content">
              <h5 className="dz-title fw-semibold">E-mail</h5>
              <p className="fw-normal m-b0">
                <Link href={`mailto:${encodeURIComponent(contactEmail)}`} className="text-body text-break">
                  {contactEmail}
                </Link>
              </p>
            </div>
          </div>
        ) : null}

        {!phone && !whatsapp && !contactEmail ? (
          <p className="small text-muted m-b0 px-1">Telefone e e-mail não informados no cadastro.</p>
        ) : null}
      </div>
    </>
  );
}
