"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { CurriculumContent, CurriculumItem, CurriculumSection } from "@/lib/types/psychologist-curriculum";
import { emptyCurriculum } from "@/lib/types/psychologist-curriculum";
import { BootstrapSkeleton } from "@/components/BootstrapSkeleton";
import PsychologistCatalogSpecialtiesField from "@/component/PsychologistCatalogSpecialtiesField";
import { CityAutocomplete, type CityOption } from "@/component/CityAutocomplete";
import { usePsychologistProfile, useSavePsychologistProfile } from "@/hooks/psychologist/data";

type AwardDraft = { title: string; link: string; imageUrl: string };

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function PsychologistProfileEditor() {
  const [notFound, setNotFound] = useState(false);

  const [professionalName, setProfessionalName] = useState("");
  const [bio, setBio] = useState("");
  const [crp, setCrp] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");

  const [catalogSpecialtyIds, setCatalogSpecialtyIds] = useState<string[]>([]);

  // Location
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cityKey, setCityKey] = useState(""); // normalised key for autocomplete value

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [awards, setAwards] = useState<AwardDraft[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumContent>(emptyCurriculum());
  const { data: profileData, isLoading: loading } = usePsychologistProfile();
  const saveProfileMutation = useSavePsychologistProfile();

  useEffect(() => {
    if (profileData === null) {
      setNotFound(true);
      return;
    }
    if (!profileData) return;
    setNotFound(false);
    setProfessionalName(profileData.psychologist?.professionalName ?? "");
    setBio(profileData.psychologist?.bio ?? "");
    setCrp(profileData.psychologist?.crp ?? "");
    setProfileImageUrl(profileData.psychologist?.profileImageUrl ?? "");
    const loadedCity = profileData.psychologist?.city ?? "";
    const loadedState = profileData.psychologist?.state ?? "";
    setCity(loadedCity);
    setState(loadedState);
    setCityKey(loadedCity ? loadedCity.toLowerCase().trim() : "");
    setCatalogSpecialtyIds(
      Array.isArray(profileData.catalogSpecialtyIds) ? profileData.catalogSpecialtyIds : []
    );
    setSkills(Array.isArray(profileData.skills) ? profileData.skills : []);
    setAwards(
      Array.isArray(profileData.awards)
        ? profileData.awards.map((a) => ({ title: a.title ?? "", link: a.link ?? "", imageUrl: a.imageUrl ?? "" }))
        : []
    );
    setCurriculum(profileData.curriculum?.sections ? (profileData.curriculum as CurriculumContent) : emptyCurriculum());
  }, [profileData]);

  async function uploadFile(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/psychologist/upload", { method: "POST", body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error("Nao foi possivel enviar a imagem. Tente novamente.");
      return null;
    }
    return typeof data.url === "string" ? data.url : null;
  }

  async function onProfilePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) {
      setProfileImageUrl(url);
      toast.success("Foto enviada. Salve o perfil para confirmar.");
    }
    e.target.value = "";
  }

  async function onAwardImage(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) {
      setAwards((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], imageUrl: url };
        return next;
      });
      toast.success("Imagem do prêmio enviada.");
    }
    e.target.value = "";
  }

  function addSkill() {
    const t = skillInput.trim();
    if (!t) return;
    setSkills((s) => [...s, t]);
    setSkillInput("");
  }

  function addAward() {
    setAwards((a) => [...a, { title: "", link: "", imageUrl: "" }]);
  }

  function updateCurriculumItem(sectionId: string, itemId: string, patch: Partial<CurriculumItem>) {
    setCurriculum((c) => ({
      sections: c.sections.map((sec) =>
        sec.id !== sectionId
          ? sec
          : {
              ...sec,
              items: sec.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
            }
      ),
    }));
  }

  function addCurriculumItem(sectionId: string) {
    setCurriculum((c) => ({
      sections: c.sections.map((sec) =>
        sec.id !== sectionId
          ? sec
          : {
              ...sec,
              items: [
                ...sec.items,
                {
                  id: newId(),
                  title: "",
                  subtitle: "",
                  period: "",
                  description: "",
                },
              ],
            }
      ),
    }));
  }

  function removeCurriculumItem(sectionId: string, itemId: string) {
    setCurriculum((c) => ({
      sections: c.sections.map((sec) =>
        sec.id !== sectionId
          ? sec
          : { ...sec, items: sec.items.filter((it) => it.id !== itemId) }
      ),
    }));
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await saveProfileMutation.mutateAsync({
          professionalName,
          bio,
          crp,
          profileImageUrl,
          city: city.trim() || null,
          state: state.trim() || null,
          catalogSpecialtyIds,
          skills,
          awards: awards.filter((a) => a.title.trim()),
          curriculum,
      });
      toast.success("Perfil salvo com sucesso!");
    } catch {
      toast.error("Nao foi possivel salvar o perfil. Revise os campos e tente novamente.");
    }
  }

  function LoadingSkeleton() {
    return (
      <div className="container-fluid px-0">
        <div className="m-b20"><BootstrapSkeleton height="2.25rem" className="w-50" /></div>
        <div className="m-b30"><BootstrapSkeleton height="1.25rem" className="w-75" /></div>

        {[0, 1, 2].map((section) => (
          <div key={section} className="card border-0 shadow-sm m-b30">
            <div className="card-header bg-white">
              <BootstrapSkeleton height="1.25rem" className="w-25" />
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4 text-center">
                  <div className="placeholder-glow d-inline-block mx-auto">
                    <span
                      className="placeholder rounded-circle d-block"
                      style={{ width: 140, height: 140 }}
                      aria-hidden
                    />
                  </div>
                </div>
                <div className="col-md-8">
                  <div className="m-b10"><BootstrapSkeleton height="2.5rem" /></div>
                  <div className="m-b10"><BootstrapSkeleton height="2.5rem" /></div>
                  <BootstrapSkeleton height="6rem" />
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="card border-0 shadow-sm m-b30">
          <div className="card-header bg-white">
            <BootstrapSkeleton height="1.25rem" className="w-25" />
          </div>
          <div className="card-body">
            {[0, 1, 2].map((i) => (
              <div key={i} className="m-b10">
                <BootstrapSkeleton height="4rem" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (notFound) {
    return (
      <div className="alert alert-info">
        Nao encontramos um cadastro de psicologo vinculado a esta conta.

      </div>
    );
  }

  return (
    <form onSubmit={onSave} className="container-fluid px-0">
      <h1 className="title  m-b20">Perfil profissional</h1>
      <p className="text-muted m-b30">
        Atualize seus dados publicos, competencias e historico para fortalecer sua apresentacao para novos pacientes.
      </p>

      <div className="card border-0 shadow-sm m-b30">
        <div className="card-header bg-white fw-semibold">Dados principais</div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4 text-center">
              <div className="mb-2">
                {profileImageUrl ? (
                  <img
                    src={profileImageUrl}
                    alt="Foto de perfil"
                    className="rounded-circle border object-fit-cover"
                    style={{ width: 140, height: 140 }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-light border d-inline-flex align-items-center justify-content-center text-muted"
                    style={{ width: 140, height: 140 }}
                  >
                    Sem foto
                  </div>
                )}
              </div>
              <label className="btn btn-outline-primary btn-sm">
                Enviar foto
                <input type="file" accept="image/*" className="d-none" onChange={onProfilePhoto} />
              </label>
              <input
                type="hidden"
                name="profileImageUrl"
                value={profileImageUrl}
                readOnly
              />
            </div>
            <div className="col-md-8">
              <div className="mb-3">
                <label className="form-label">Nome profissional (como aparece no perfil)</label>
                <input
                  className="form-control"
                  value={professionalName}
                  onChange={(e) => setProfessionalName(e.target.value)}
                  placeholder="Ex.: Dra. Maria Silva"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">CRP</label>
                <input
                  className="form-control"
                  value={crp}
                  onChange={(e) => setCrp(e.target.value)}
                  placeholder="Ex.: 06/123456"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Cidade de atendimento presencial</label>
                <CityAutocomplete
                  value={cityKey}
                  onSelect={(opt: CityOption | null) => {
                    if (opt) {
                      setCity(opt.city);
                      setState(opt.state);
                      setCityKey(opt.key);
                    } else {
                      setCity("");
                      setState("");
                      setCityKey("");
                    }
                  }}
                  placeholder="Ex.: São Paulo — SP"
                  showBadge={false}
                  disabled={saveProfileMutation.isPending}
                />
                <div className="form-text text-muted">
                  Usada na busca pública por cidade. Deixe em branco se atender apenas online.
                </div>
              </div>
              <div className="mb-0">
                <label className="form-label">Sobre mim</label>
                <textarea
                  className="form-control"
                  rows={5}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte sua trajetória, abordagens e o que busca oferecer aos pacientes."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm m-b30">
        <div className="card-header bg-white fw-semibold">Especialidades</div>
        <div className="card-body">
          <PsychologistCatalogSpecialtiesField
            helper="Essas especialidades aparecem na busca pública quando o paciente escolher o mesmo item no catálogo."
            value={catalogSpecialtyIds}
            onChange={setCatalogSpecialtyIds}
            disabled={saveProfileMutation.isPending}
          />
        </div>
      </div>

      <div className="card border-0 shadow-sm m-b30">
        <div className="card-header bg-white fw-semibold">Skills / competências</div>
        <div className="card-body">
          <div className="input-group m-b15">
            <input
              className="form-control"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              placeholder="Ex.: TCC, escuta ativa, grupos terapêuticos"
            />
            <button type="button" className="btn btn-outline-primary" onClick={addSkill}>
              Adicionar
            </button>
          </div>
          <ul className="list-group">
            {skills.map((s, i) => (
              <li
                key={`${s}-${i}`}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                {s}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => setSkills((x) => x.filter((_, j) => j !== i))}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card border-0 shadow-sm m-b30">
        <div className="card-header bg-white fw-semibold d-flex justify-content-between align-items-center">
          <span>Prêmios e destaques</span>
          <button type="button" className="btn btn-sm btn-primary" onClick={addAward}>
            Adicionar prêmio
          </button>
        </div>
        <div className="card-body">
          {awards.length === 0 && <p className="text-muted small mb-0">Nenhum prêmio cadastrado.</p>}
          {awards.map((a, idx) => (
            <div key={idx} className="border rounded p-3 m-b15">
              <div className="row g-2">
                <div className="col-md-6">
                  <label className="form-label small">Título</label>
                  <input
                    className="form-control form-control-sm"
                    value={a.title}
                    onChange={(e) =>
                      setAwards((prev) => {
                        const n = [...prev];
                        n[idx] = { ...n[idx], title: e.target.value };
                        return n;
                      })
                    }
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small">Link (opcional)</label>
                  <input
                    className="form-control form-control-sm"
                    value={a.link}
                    onChange={(e) =>
                      setAwards((prev) => {
                        const n = [...prev];
                        n[idx] = { ...n[idx], link: e.target.value };
                        return n;
                      })
                    }
                    placeholder="https://"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small">Imagem do prêmio</label>
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    {a.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.imageUrl} alt="" className="rounded border" style={{ maxHeight: 72 }} />
                    ) : null}
                    <label className="btn btn-outline-secondary btn-sm mb-0">
                      Upload
                      <input
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={(e) => void onAwardImage(idx, e)}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => setAwards((prev) => prev.filter((_, j) => j !== idx))}
                    >
                      Remover prêmio
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card border-0 shadow-sm m-b30">
        <div className="card-header bg-white fw-semibold">Currículo</div>
        <div className="card-body">
          <p className="text-muted small">
            Organize por seções. Em cada seção você pode incluir vários itens (cargo, instituição, período,
            descrição).
          </p>
          {curriculum.sections.map((sec: CurriculumSection) => (
            <div key={sec.id} className="m-b25">
              <h6 className="text-secondary m-b15">{sec.title}</h6>
              {sec.items.map((item) => (
                <div key={item.id} className="border rounded p-3 m-b10 bg-white">
                  <div className="row g-2">
                    <div className="col-md-6">
                      <input
                        className="form-control form-control-sm"
                        placeholder="Título / cargo"
                        value={item.title}
                        onChange={(e) => updateCurriculumItem(sec.id, item.id, { title: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <input
                        className="form-control form-control-sm"
                        placeholder="Instituição / subtítulo"
                        value={item.subtitle ?? ""}
                        onChange={(e) =>
                          updateCurriculumItem(sec.id, item.id, { subtitle: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-4">
                      <input
                        className="form-control form-control-sm"
                        placeholder="Período"
                        value={item.period ?? ""}
                        onChange={(e) =>
                          updateCurriculumItem(sec.id, item.id, { period: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-12">
                      <textarea
                        className="form-control form-control-sm"
                        rows={2}
                        placeholder="Descrição (opcional)"
                        value={item.description ?? ""}
                        onChange={(e) =>
                          updateCurriculumItem(sec.id, item.id, { description: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-12">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeCurriculumItem(sec.id, item.id)}
                      >
                        Remover item
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => addCurriculumItem(sec.id)}
              >
                + Adicionar item em {sec.title}
              </button>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-lg" disabled={saveProfileMutation.isPending}>
        {saveProfileMutation.isPending ? "Salvando…" : "Salvar perfil"}
      </button>
    </form>
  );
}
