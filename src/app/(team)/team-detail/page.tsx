"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IMAGES } from "@/constant/theme";
//import Footer from "@/layout/Footer";
import Header from "@/layout/Header";
import Table from "react-bootstrap/Table";
import { TeamDetailBookingSection } from "./_componenets/TeamDetailBookingSection";
import { TeamDetailSidebar } from "./_componenets/TeamDetailSidebar";
import { TeamDetailSkeleton } from "./_componenets/TeamDetailSkeleton";
import Image from "next/image";
import { usePsychologistBySlug } from "@/hooks/psychologists/queries";
import PsychologistSocialLinks from "@/component/PsychologistSocialLinks";

function TeamDetailContent() {
    const searchParams = useSearchParams();
    const slug = searchParams.get("slug") ?? undefined;
    const { data, isLoading } = usePsychologistBySlug(slug);

    // ── Carregando: skeleton que espelha o layout ──
    if (isLoading) {
        return (
            <>
                <Header />
                <main className="page-content">
                    <section className="content-inner">
                        <div className="container">
                            <TeamDetailSkeleton />
                        </div>
                    </section>
                </main>
            </>
        );
    }

    // ── Perfil nao encontrado ──
    if (!data) {
        return (
            <>
                <Header />
                <main className="page-content">
                    <section className="content-inner">
                        <div className="container py-5 text-center">
                            <div className="mb-3" style={{ fontSize: "3rem" }}>🔍</div>
                            <h3 className="fw-semibold mb-2">Perfil não encontrado</h3>
                            <p className="text-muted mb-4">
                                Não conseguimos localizar este profissional. Ele pode ter saído da plataforma ou o link está incorreto.
                            </p>
                            <Link href="/team" className="btn btn-primary">
                                Ver todos os especialistas
                            </Link>
                        </div>
                    </section>
                </main>
            </>
        );
    }

    const displayName = data?.professionalName || data?.fullName || "Especialista";
    const primarySpecialty = data?.specialties[0] || "Psicologia";
    const bio = data?.bio || "Perfil em atualização.";
    const profileImageUrl = data?.profileImageUrl;
    const skills = data?.skills?.length ? data.skills : ["Escuta ativa", "Acolhimento", "Atendimento online"];
    const curriculumItems = data?.curriculum.sections.flatMap((sec) => sec.items).filter((it) => it.title) ?? [];
    const awardsText = data?.awards?.length
        ? data.awards.map((a) => a.title).join(" | ")
        : "Sem prêmios cadastrados";

    return (
        <>
            <Header />
            <main className="page-content">
                <section className="content-inner">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-4 m-b30">
                                <aside className="side-bar sticky-top">
                                    <div className="widget wow fadeInUp" data-wow-delay="0.1s" data-wow-duration="0.7s">
                                        <div className="dz-team style-5">
                                            <div className="dz-media">
                                                {profileImageUrl ? (
                                                    <img src={profileImageUrl} alt={displayName} className="w-100 h-auto" />
                                                ) : (
                                                    <Image src={IMAGES.teampmg2} alt={displayName} />
                                                )}
                                            </div>
                                            <PsychologistSocialLinks links={data?.socialLinks} iconClassName="" />
                                        </div>
                                    </div>
                                    <TeamDetailSidebar data={data} isLoading={false} />
                                </aside>
                            </div>
                            <div className="col-lg-8 ps-xl-5 m-b30">
                                <div className="section-head style-1 mb-30">
                                    <h2 className="titlev fw-semibold m-b0 wow fadeInUp" data-wow-delay="0.1s" data-wow-duration="0.7s">
                                        {displayName}
                                    </h2>
                                    <p className="text-primary m-b20 fw-normal font-16 wow fadeInUp" data-wow-delay="0.2s" data-wow-duration="0.7s">
                                        {data?.crp ? `CRP ${data.crp} (${primarySpecialty})` : primarySpecialty}
                                    </p>
                                    <p className="fw-normal m-b0 wow fadeInUp" data-wow-delay="0.3s" data-wow-duration="0.7s">{bio}</p>
                                </div>
                                <Table className="table table-striped table-striped-rounded m-b40 wow fadeInUp" data-wow-delay="0.4s" data-wow-duration="0.7s">
                                    <thead>
                                        <tr>
                                            <th>Especialidade</th>
                                            <td>{data?.specialties?.join(", ") || "Psicologia"}</td>
                                        </tr>
                                    </thead>
                                    <tbody className="border-top-0">
                                        <tr>
                                            <th>Formação</th>
                                            <td>
                                                {curriculumItems.find((it) => it.subtitle)?.subtitle || "Não informado"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th>Experiência</th>
                                            <td>{curriculumItems.find((it) => it.description)?.description || "Não informado"}</td>
                                        </tr>
                                        <tr>
                                            <th>Prêmios</th>
                                            <td>{awardsText}</td>
                                        </tr>
                                    </tbody>
                                </Table>
                                <h3 className="font-20 m-b15 wow fadeInUp" data-wow-delay="0.5s" data-wow-duration="0.7s">Professional Skills</h3>
                                <ul className="list-check-circle list-light text-secondary fw-medium grid-2 m-b40 wow fadeInUp" data-wow-delay="0.6s" data-wow-duration="0.7s">
                                    {skills.map((skill) => (
                                        <li key={skill}>{skill}</li>
                                    ))}
                                </ul>
                                <div className="form-wrapper style-1 wow fadeInUp" data-wow-delay="0.7s" data-wow-duration="0.7s">
                                    <div className="form-body bg-primary background-blend-burn" style={{ backgroundImage: `url(${IMAGES.bg2png})` }}>
                                        <div className="title-head">
                                            <h2 className="form-title m-b0">Faça um <span>Agendamento</span></h2>
                                            <p className="text-white opacity-90 mt-2 mb-0 small">
                                                Escolha o dia, um horário livre e preencha seus dados.
                                            </p>
                                        </div>
                                        <TeamDetailBookingSection slug={slug} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            {/* <Footer />             */}
        </>
    );
}

function TeamDetailFallback() {
    return (
        <>
            <Header />
            <main className="page-content">
                <section className="content-inner">
                    <div className="container">
                        <TeamDetailSkeleton />
                    </div>
                </section>
            </main>
        </>
    );
}

export default function TeamDetailPage() {
    return (
        <Suspense fallback={<TeamDetailFallback />}>
            <TeamDetailContent />
        </Suspense>
    );
}
