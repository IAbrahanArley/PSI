"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

type CatalogRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
};

export default function AdminEspecialidadesPage() {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [creating, setCreating] = useState({
    name: "",
    description: "",
    slug: "",
    sortOrder: 0 as number | "",
    imageUrl: "",
  });

  async function reload() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/catalog-specialties", { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as { items?: CatalogRow[]; error?: string };
      if (!res.ok) throw new Error("Falha ao carregar o catalogo.");
      setRows(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      toast.error("Nao foi possivel carregar o catalogo. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/psychologist/upload", { method: "POST", body: fd, credentials: "include" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error("Nao foi possivel enviar a imagem.");
      return null;
    }
    return typeof data.url === "string" ? data.url : null;
  }, []);

  async function createItem(e: React.FormEvent) {
    e.preventDefault();
    if (!creating.name.trim()) {
      toast.error("Informe o nome da especialidade.");
      return;
    }
    setSavingId("__create__");
    try {
      const res = await fetch("/api/admin/catalog-specialties", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: creating.name.trim(),
          description: creating.description.trim() || null,
          slug: creating.slug.trim() || null,
          imageUrl: creating.imageUrl.trim() || null,
          sortOrder:
            typeof creating.sortOrder === "number" && Number.isFinite(creating.sortOrder) ? creating.sortOrder : 0,
          isActive: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error("Falha ao criar especialidade.");
      toast.success("Especialidade criada.");
      setCreating({
        name: "",
        description: "",
        slug: "",
        sortOrder: 0,
        imageUrl: "",
      });
      await reload();
    } catch (err) {
      toast.error("Nao foi possivel criar a especialidade. Tente novamente.");
    } finally {
      setSavingId(null);
    }
  }

  async function patchRow(id: string, patch: Partial<Pick<CatalogRow, "name" | "slug" | "description" | "imageUrl" | "sortOrder" | "isActive">>) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/catalog-specialties/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error("Falha ao salvar especialidade.");
      toast.success("Salvo.");
      await reload();
    } catch (err) {
      toast.error("Nao foi possivel salvar as alteracoes. Tente novamente.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 m-b20">
        <div>
          <h1 className="title text-secondary m-b0">Catálogo de especialidades</h1>
          <p className="text-muted small mb-0">Cadastre e organize as especialidades usadas nos filtros publicos.</p>
        </div>
        <Link href="/dashboard/admin" className="btn btn-outline-secondary btn-sm">
          Voltar ao admin
        </Link>
      </div>

      <div className="card border-0 shadow-sm m-b30">
        <div className="card-header bg-white fw-semibold">Nova especialidade</div>
        <div className="card-body">
          <form className="row g-3" onSubmit={createItem}>
            <div className="col-md-5">
              <label className="form-label small">Nome</label>
              <input
                className="form-control"
                value={creating.name}
                onChange={(e) => setCreating((x) => ({ ...x, name: e.target.value }))}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small">Slug opcional</label>
              <input
                className="form-control"
                value={creating.slug}
                onChange={(e) => setCreating((x) => ({ ...x, slug: e.target.value }))}
                placeholder="gerado pelo nome"
              />
            </div>
            <div className="col-md-2">
              <label className="form-label small">Ordem</label>
              <input
                type="number"
                className="form-control"
                value={creating.sortOrder}
                onChange={(e) =>
                  setCreating((x) => ({
                    ...x,
                    sortOrder: e.target.value === "" ? "" : Number.parseInt(e.target.value, 10),
                  }))
                }
              />
            </div>
            <div className="col-12">
              <label className="form-label small">Descrição</label>
              <textarea
                className="form-control"
                rows={2}
                value={creating.description}
                onChange={(e) => setCreating((x) => ({ ...x, description: e.target.value }))}
              />
            </div>
            <div className="col-md-8">
              <label className="form-label small">URL da imagem (após upload)</label>
              <input
                className="form-control"
                value={creating.imageUrl}
                onChange={(e) => setCreating((x) => ({ ...x, imageUrl: e.target.value }))}
              />
              <label className="btn btn-outline-secondary btn-sm mt-2 mb-0">
                Enviar imagem
                <input
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={async (ev) => {
                    const file = ev.target.files?.[0];
                    if (!file) return;
                    const url = await uploadFile(file);
                    if (url) setCreating((x) => ({ ...x, imageUrl: url }));
                    ev.target.value = "";
                  }}
                />
              </label>
            </div>
            <div className="col-12">
              <button type="submit" className="btn btn-primary" disabled={savingId === "__create__"}>
                {savingId === "__create__" ? "Salvando…" : "Cadastrar"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white fw-semibold d-flex justify-content-between align-items-center">
          <span>Itens cadastrados</span>
          <button type="button" className="btn btn-sm btn-outline-primary" disabled={loading} onClick={() => void reload()}>
            Atualizar
          </button>
        </div>
        <div className="table-responsive">
          <table className="table table-striped table-hover mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Nome</th>
                <th>Slug</th>
                <th>Ordem</th>
                <th className="text-center">Ativo</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-muted p-4">
                    Carregando…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-muted p-4">
                    Nenhuma especialidade cadastrada ainda.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <AdminCatalogRowEditor
                    key={r.id}
                    row={r}
                    saving={savingId === r.id}
                    onPatch={(patch) => void patchRow(r.id, patch)}
                    onUpload={uploadFile}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminCatalogRowEditor({
  row,
  saving,
  onPatch,
  onUpload,
}: {
  row: CatalogRow;
  saving: boolean;
  onPatch: (patch: Partial<Pick<CatalogRow, "name" | "slug" | "description" | "imageUrl" | "sortOrder" | "isActive">>) => void;
  onUpload: (file: File) => Promise<string | null>;
}) {
  const [name, setName] = useState(row.name);
  const [slug, setSlug] = useState(row.slug);
  const [description, setDescription] = useState(row.description ?? "");
  const [imageUrl, setImageUrl] = useState(row.imageUrl ?? "");
  const [sortOrder, setSortOrder] = useState(row.sortOrder);
  useEffect(() => {
    setName(row.name);
    setSlug(row.slug);
    setDescription(row.description ?? "");
    setImageUrl(row.imageUrl ?? "");
    setSortOrder(row.sortOrder);
  }, [row]);

  return (
    <>
      <tr>
        <td colSpan={5} className="bg-white border-start border-end border-warning border-4">
          <div className="row g-3 p-3">
            <div className="col-md-4">
              <label className="form-label small">Nome</label>
              <input className="form-control form-control-sm" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="col-md-3">
              <label className="form-label small">Slug</label>
              <input className="form-control form-control-sm" value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label className="form-label small">Ordem</label>
              <input
                type="number"
                className="form-control form-control-sm"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number.parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="col-md-3 d-flex align-items-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={saving}
                onClick={() =>
                  void onPatch({
                    name: name.trim(),
                    slug: slug.trim(),
                    description: description.trim() || null,
                    imageUrl: imageUrl.trim() || null,
                    sortOrder,
                    isActive: row.isActive,
                  })
                }
              >
                Salvar
              </button>
              <button
                type="button"
                className={`btn btn-sm ${row.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                disabled={saving}
                onClick={() => void onPatch({ isActive: !row.isActive })}
              >
                {row.isActive ? "Desativar" : "Reativar"}
              </button>
            </div>
            <div className="col-12">
              <label className="form-label small">Descrição</label>
              <textarea
                className="form-control form-control-sm"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="col-md-10">
              <label className="form-label small">Imagem URL</label>
              <input
                className="form-control form-control-sm"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <label className="btn btn-outline-secondary btn-sm mt-2 mb-0">
                Upload (bucket público do psicólogo)
                <input
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={async (ev) => {
                    const file = ev.target.files?.[0];
                    if (!file) return;
                    const url = await onUpload(file);
                    if (url) setImageUrl(url);
                    ev.target.value = "";
                  }}
                />
              </label>
            </div>
            <div className="col-md-2 d-flex align-items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {imageUrl?.trim() ? <img src={imageUrl.trim()} alt="" className="img-fluid rounded border" /> : null}
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}
