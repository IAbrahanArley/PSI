"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Form, Spinner, Table } from "react-bootstrap";
import { toast } from "sonner";
import Link from "next/link";

type PatientRow = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  careStatus: "ACTIVE" | "PAUSED" | "DISCHARGED" | null;
  clinicalSummary: string | null;
};

const statusLabel: Record<NonNullable<PatientRow["careStatus"]>, string> = {
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
  DISCHARGED: "Alta",
};

function statusVariant(s: PatientRow["careStatus"]) {
  if (s === "ACTIVE") return "success";
  if (s === "PAUSED") return "warning";
  if (s === "DISCHARGED") return "secondary";
  return "light";
}

async function jsonFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data as T;
}

export default function DashboardPsicologoPacientesPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientRow[]>([]);

  const load = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const url =
        search?.trim() ?
          `/api/psychologist/clinical/patients?q=${encodeURIComponent(search.trim())}`
        : "/api/psychologist/clinical/patients";
      const data = await jsonFetch<{ patients: PatientRow[] }>(url);
      setPatients(data.patients);
    } catch {
      toast.error("Não foi possível carregar os pacientes. Tente novamente.");
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 m-b30">
        <div>
          <h1 className="h4 mb-1 fw-semibold text-secondary">Pacientes</h1>
          <p className="small text-muted mb-0">
            Prontuário leve: pacientes com consulta agendada ou caso clínico. Use a busca por nome, e-mail ou telefone.
          </p>
        </div>
      </div>

      <Form
        className="row g-2 align-items-end m-b30"
        onSubmit={(ev) => {
          ev.preventDefault();
          load(q);
        }}
      >
        <div className="col-12 col-md-6 col-lg-5">
          <Form.Label className="small text-muted">Buscar</Form.Label>
          <Form.Control
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nome, e-mail ou telefone"
          />
        </div>
        <div className="col-auto">
          <Button type="submit" variant="primary" disabled={loading}>
            Buscar
          </Button>
        </div>
        <div className="col-auto">
          <Button type="button" variant="outline-secondary" disabled={loading} onClick={() => { setQ(""); load(); }}>
            Limpar
          </Button>
        </div>
      </Form>

      {loading ?
        <div className="card border-0 shadow-sm">
          <div className="card-body py-5 text-center">
            <Spinner animation="border" size="sm" className="me-2" />
            Carregando…
          </div>
        </div>
      : patients.length === 0 ?
        <div className="alert alert-light border">Nenhum paciente encontrado.</div>
      : <div className="card border-0 shadow-sm">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Nome</th>
                <th className="d-none d-md-table-cell">Contato</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id}>
                  <td className="fw-medium">{p.fullName}</td>
                  <td className="d-none d-md-table-cell small text-muted">
                    {[p.email, p.phone].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td>
                    <Badge bg={statusVariant(p.careStatus)} text={p.careStatus ? undefined : "dark"}>
                      {p.careStatus ? statusLabel[p.careStatus] : "—"}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Link
                      href={`/dashboard/psicologo/pacientes/${p.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Abrir prontuário
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      }
    </div>
  );
}
