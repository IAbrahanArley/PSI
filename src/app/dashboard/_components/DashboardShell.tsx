"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabaseClient } from "@/lib/db/supabase/client";
import type { UserRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  ChevronDown,
  FileText,
  Home,
  LogOut,
  MapPin,
  Menu,
  Settings,
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

  const isActive = useCallback((href: string) => pathname === href, [pathname]);
  const isAgendaActive = pathname.startsWith("/dashboard/psicologo/agenda");
  /** Rotas do submenu (perfil, endereços) — agenda fica em item próprio. */
  const isPsychologistSubActive =
    pathname.startsWith("/dashboard/psicologo") && !isAgendaActive;
  const [psychologistMenuOpen, setPsychologistMenuOpen] = useState(isPsychologistSubActive);

  useEffect(() => {
    if (isPsychologistSubActive) setPsychologistMenuOpen(true);
  }, [isPsychologistSubActive]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        toast.error(error.message || "Não foi possível sair.");
        return;
      }
      toast.success("Você saiu da conta.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Erro ao encerrar sessão.");
    } finally {
      setLoggingOut(false);
    }
  };

  const [mobileOpen, setMobileOpen] = useState(false);
  const initial = (userEmail?.charAt(0) ?? "?").toUpperCase();
  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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

  const MenuContent = (
    <div className="d-flex flex-column h-100 bg-white">
      <div className="border-bottom p-3">
        <Link href="/dashboard" className="text-decoration-none" onClick={closeMobile}>
          <span className="h5 mb-0 text-secondary fw-bold">Mindzinho</span>
        </Link>
        <p className="small text-muted mb-0 mt-1">Painel</p>
      </div>

      <nav className="flex-grow-1 p-2 list-group list-group-flush">
        <NavItem href="/dashboard" label="Início" active={isActive("/dashboard")} icon={<Home size={16} />} />

        {(role === "ADMIN" || role === "PSYCHOLOGIST") && (
          <>
            <NavItem
              href="/dashboard/psicologo/agenda"
              label="Agenda"
              active={isAgendaActive}
              icon={<CalendarDays size={16} />}
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
                  Psicólogo
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
              {psychologistMenuOpen && (
                <div className="ms-2 ps-2 border-start border-2 mt-1" style={{ borderColor: "var(--bs-border-color)" }}>
                  <div className="list-group list-group-flush">
                    <NavItem
                      href="/dashboard/psicologo/perfil"
                      label="Perfil"
                      active={isActive("/dashboard/psicologo/perfil")}
                      icon={<UserRound size={16} />}
                    />
                    <NavItem
                      href="/dashboard/psicologo/enderecos"
                      label="Endereços"
                      active={isActive("/dashboard/psicologo/enderecos")}
                      icon={<MapPin size={16} />}
                    />
                    <NavItem
                      href="/dashboard/psicologo/pacientes"
                      label="Pacientes"
                      active={pathname.startsWith("/dashboard/psicologo/pacientes")}
                      icon={<FileText size={16} />}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {(role === "ADMIN" || role === "PATIENT") && (
          <NavItem
            href="/dashboard/paciente"
            label="Paciente"
            active={isActive("/dashboard/paciente")}
            icon={<Users size={16} />}
          />
        )}

        {role === "ADMIN" && (
          <NavItem
            href="/dashboard/admin"
            label="Administração"
            active={isActive("/dashboard/admin")}
            icon={<Settings size={16} />}
          />
        )}
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
            {userEmail ?? "Usuário"}
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

  return (
    <div className="min-vh-100" data-dashboard>
      <header className="sticky-top border-bottom bg-white py-2 px-3 d-lg-none" style={{ zIndex: 1030 }}>
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
        <aside className="d-none d-lg-block border-end bg-white" style={{ width: 280 }}>
          {MenuContent}
        </aside>

        {mobileOpen && (
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1050 }}>
            <button
              type="button"
              aria-label="Fechar menu"
              className="position-absolute top-0 start-0 w-100 h-100 border-0"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={closeMobile}
            />
            <aside className="position-absolute top-0 start-0 h-100 bg-white border-end shadow" style={{ width: 280 }}>
              <div className="d-flex justify-content-end border-bottom p-2">
                <button type="button" className="btn btn-light btn-sm" onClick={closeMobile} aria-label="Fechar menu">
                  <X size={18} />
                </button>
              </div>
              {MenuContent}
            </aside>
          </div>
        )}

        <main className="flex-grow-1 p-3 p-lg-4">{children}</main>
      </div>
    </div>
  );
}
