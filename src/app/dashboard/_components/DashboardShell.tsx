"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabaseClient } from "@/lib/db/supabase/client";
import type { UserRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import {
  Bot,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  Home,
  LogOut,
  MapPin,
  Menu,
  Search,
  Settings,
  Share2,
  Smile,
  UserRound,
  Users,
  X,
} from "lucide-react";

type Props = {
  children: React.ReactNode;
  userEmail: string | null;
  userAvatarUrl?: string | null;
  role: UserRole | null;
};

export function DashboardShell({ children, userEmail, userAvatarUrl, role }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPsychologist = role === "PSYCHOLOGIST";
  const isPatient = role === "PATIENT";
  const isAdmin = role === "ADMIN";

  const isActive = useCallback((href: string) => pathname === href, [pathname]);
  const isRouteOrChild = useCallback(
    (href: string) => pathname === href || pathname.startsWith(`${href}/`),
    [pathname],
  );

  const isAgendaActive = isRouteOrChild("/dashboard/psicologo/agenda");
  const isPsychologistPatientsActive = isRouteOrChild("/dashboard/psicologo/pacientes");
  const isPsychologistProfileActive = isRouteOrChild("/dashboard/psicologo/perfil");
  const isPsychologistAddressesActive = isRouteOrChild("/dashboard/psicologo/enderecos");
  const isPsychologistSocialActive = isRouteOrChild("/dashboard/psicologo/redes-sociais");
  const isPsychologistAssinaturaActive = isRouteOrChild("/dashboard/psicologo/assinatura");
  const isPsychologistSubActive =
    isPsychologistProfileActive ||
    isPsychologistAddressesActive ||
    isPsychologistSocialActive ||
    isPsychologistAssinaturaActive;
  const isPatientHomeActive        = isActive("/dashboard/paciente");
  const isPatientAnamneseActive    = isRouteOrChild("/dashboard/paciente/anamnese");
  const isPatientPsychsActive      = isRouteOrChild("/dashboard/paciente/psicologos");
  const isPatientPerfilActive      = isRouteOrChild("/dashboard/paciente/perfil");
  const isPatientHumorActive       = isRouteOrChild("/dashboard/paciente/humor");
  const isPatientAssistenteActive  = isRouteOrChild("/dashboard/paciente/assistente");
  const isPatientConsultasActive   = isRouteOrChild("/dashboard/paciente/consultas");
  const isPatientDashboardActive = isRouteOrChild("/dashboard/paciente");
  const isAdminDashboardActive = isRouteOrChild("/dashboard/admin");

  const [psychologistMenuOpen, setPsychologistMenuOpen] = useState(isPsychologistSubActive);

  useEffect(() => {
    if (isPsychologistSubActive) setPsychologistMenuOpen(true);
  }, [isPsychologistSubActive]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);
  const initial = (userEmail?.charAt(0) ?? "?").toUpperCase();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        toast.error("Nao foi possivel encerrar a sessao agora.");
        return;
      }
      toast.success("Sessao encerrada com sucesso.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Nao foi possivel encerrar a sessao agora.");
    } finally {
      setLoggingOut(false);
    }
  };

  const NavItem = ({
    href,
    label,
    active,
    icon,
  }: {
    href: string;
    label: string;
    active: boolean;
    icon?: React.ReactNode;
  }) => (
    <Link
      href={href}
      onClick={closeMobile}
      className={cn(
        "list-group-item list-group-item-action border-0 d-flex align-items-center gap-2 py-2 px-3 small",
        active && "active",
      )}
    >
      {icon}
      {label}
    </Link>
  );

  function MenuContent({ mobile = false }: { mobile?: boolean }) {
    return (
      <div className="d-flex flex-column h-100 bg-white">
        <div className="border-bottom p-3 d-flex align-items-start justify-content-between gap-2">
          <div>
            <Link href="/dashboard" className="text-decoration-none" onClick={closeMobile}>
              <span className="h5 mb-0 text-secondary fw-bold">Mindzinho</span>
            </Link>
            <p className="small text-muted mb-0 mt-1">Painel</p>
          </div>
          {mobile ? (
            <button
              type="button"
              className="btn btn-light btn-sm d-inline-flex align-items-center justify-content-center"
              onClick={closeMobile}
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          ) : null}
        </div>

        <nav className="flex-grow-1 p-2 list-group list-group-flush">
          {!isPatient ? (
            <NavItem href="/dashboard" label="Inicio" active={isActive("/dashboard")} icon={<Home size={16} />} />
          ) : null}

          {isPsychologist ? (
            <>
              <NavItem
                href="/dashboard/psicologo/agenda"
                label="Agenda"
                active={isAgendaActive}
                icon={<CalendarDays size={16} />}
              />
              <NavItem
                href="/dashboard/psicologo/pacientes"
                label="Pacientes"
                active={isPsychologistPatientsActive}
                icon={<FileText size={16} />}
              />
              <div className="mb-1">
                <button
                  type="button"
                  className={cn(
                    "btn w-100 text-start d-flex align-items-center justify-content-between py-2 px-3 small rounded-0 border-0",
                    isPsychologistSubActive ? "btn-primary" : "btn-light",
                  )}
                  onClick={() => setPsychologistMenuOpen((prev) => !prev)}
                  aria-expanded={psychologistMenuOpen}
                >
                  <span className="d-flex align-items-center gap-2">
                    <UserRound size={16} />
                    Psicologo
                  </span>
                  <ChevronDown
                    size={16}
                    className="flex-shrink-0"
                    style={{
                      transition: "transform 0.2s",
                      transform: psychologistMenuOpen ? "rotate(180deg)" : "none",
                    }}
                  />
                </button>
                {psychologistMenuOpen ? (
                  <div className="ms-2 ps-2 border-start border-2 mt-1" style={{ borderColor: "var(--bs-border-color)" }}>
                    <div className="list-group list-group-flush">
                      <NavItem
                        href="/dashboard/psicologo/perfil"
                        label="Perfil"
                        active={isPsychologistProfileActive}
                        icon={<UserRound size={16} />}
                      />
                      <NavItem
                        href="/dashboard/psicologo/enderecos"
                        label="Enderecos"
                        active={isPsychologistAddressesActive}
                        icon={<MapPin size={16} />}
                      />
                      <NavItem
                        href="/dashboard/psicologo/redes-sociais"
                        label="Redes sociais"
                        active={isPsychologistSocialActive}
                        icon={<Share2 size={16} />}
                      />
                      <NavItem
                        href="/dashboard/psicologo/assinatura"
                        label="Assinatura"
                        active={isPsychologistAssinaturaActive}
                        icon={<CreditCard size={16} />}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}

          {isPatient ? (
            <>
              <NavItem
                href="/dashboard/paciente"
                label="Inicio"
                active={isPatientHomeActive}
                icon={<Home size={16} />}
              />
              <NavItem
                href="/dashboard/paciente/anamnese"
                label="Minha anamnese"
                active={isPatientAnamneseActive}
                icon={<ClipboardList size={16} />}
              />
              <NavItem
                href="/dashboard/paciente/psicologos"
                label="Encontrar psicologo"
                active={isPatientPsychsActive}
                icon={<Search size={16} />}
              />
              <NavItem
                href="/dashboard/paciente/consultas"
                label="Minhas consultas"
                active={isPatientConsultasActive}
                icon={<CalendarCheck size={16} />}
              />
              <NavItem
                href="/dashboard/paciente/humor"
                label="Diario de humor"
                active={isPatientHumorActive}
                icon={<Smile size={16} />}
              />
              <NavItem
                href="/dashboard/paciente/assistente"
                label="Assistente IA"
                active={isPatientAssistenteActive}
                icon={<Bot size={16} />}
              />
              <NavItem
                href="/dashboard/paciente/perfil"
                label="Meu perfil"
                active={isPatientPerfilActive}
                icon={<UserRound size={16} />}
              />
            </>
          ) : null}

          {isAdmin ? (
            <NavItem
              href="/dashboard/admin"
              label="Administracao"
              active={isAdminDashboardActive}
              icon={<Settings size={16} />}
            />
          ) : null}
        </nav>

        <div className="border-top p-3 mt-auto">
          <div className="d-flex align-items-center gap-3 mb-3">
            {userAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userAvatarUrl}
                alt=""
                width={40}
                height={40}
                className="rounded-circle border object-fit-cover"
              />
            ) : (
              <div
                className="d-flex align-items-center justify-content-center rounded-circle border bg-primary text-white fw-semibold"
                style={{ width: 40, height: 40 }}
              >
                {initial}
              </div>
            )}
            <div className="text-truncate flex-grow-1 small text-muted" title={userEmail ?? undefined}>
              {userEmail ?? "Usuario"}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
            disabled={loggingOut}
            onClick={handleLogout}
          >
            <LogOut size={14} />
            {loggingOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" data-dashboard>
      <header className="position-sticky top-0 border-bottom bg-white py-2 px-3 d-lg-none" style={{ zIndex: 1030 }}>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center justify-content-center"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu size={18} />
        </button>
        <span className="ms-3 small fw-semibold text-secondary">Painel</span>
      </header>

      <div className="d-flex min-vh-100">
        <aside
          className="d-none d-lg-block border-end bg-white flex-shrink-0"
          style={{ width: 280, minHeight: "100vh" }}
        >
          <MenuContent />
        </aside>

        {mobileOpen ? (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-lg-none" style={{ zIndex: 1050 }}>
            <button
              type="button"
              aria-label="Fechar menu"
              className="position-absolute top-0 start-0 w-100 h-100 border-0"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={closeMobile}
            />
            <aside
              className="position-fixed top-0 start-0 bottom-0 bg-white border-end shadow d-flex flex-column"
              style={{ width: "min(86vw, 320px)", zIndex: 1051 }}
            >
              <MenuContent mobile />
            </aside>
          </div>
        ) : null}

        <main className="flex-grow-1 p-3 p-lg-4">{children}</main>
      </div>
    </div>
  );
}
