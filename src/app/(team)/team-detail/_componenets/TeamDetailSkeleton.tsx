"use client";

/**
 * Skeleton da pagina /team-detail — espelha o layout real (sidebar + conteudo)
 * para evitar o salto visual entre o estado de carregamento e o conteudo final.
 */
export function TeamDetailSkeleton() {
  return (
    <div className="row team-detail-skeleton placeholder-glow" aria-busy="true" aria-label="Carregando perfil">
      {/* ── Sidebar ── */}
      <div className="col-lg-4 m-b30">
        <aside className="side-bar">
          {/* Foto */}
          <div className="widget">
            <span
              className="placeholder d-block w-100 rounded-3"
              style={{ aspectRatio: "1 / 1.1" }}
            />
            {/* Redes sociais */}
            <div className="d-flex gap-2 mt-3 justify-content-center">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className="placeholder rounded-circle" style={{ width: 36, height: 36 }} />
              ))}
            </div>
          </div>

          {/* Widget de horario */}
          <div className="widget bg-light rounded-3 p-3 mt-3">
            <span className="placeholder col-7 d-block mb-3" style={{ height: 18 }} />
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="d-flex justify-content-between mb-2">
                <span className="placeholder col-4" style={{ height: 12 }} />
                <span className="placeholder col-5" style={{ height: 12 }} />
              </div>
            ))}
          </div>

          {/* Widget de contato */}
          <div className="widget bg-light rounded-3 p-3 mt-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="d-flex align-items-center gap-3 mb-3">
                <span className="placeholder rounded-3 flex-shrink-0" style={{ width: 44, height: 44 }} />
                <div className="flex-grow-1">
                  <span className="placeholder col-5 d-block mb-1" style={{ height: 12 }} />
                  <span className="placeholder col-8 d-block" style={{ height: 14 }} />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* ── Conteudo ── */}
      <div className="col-lg-8 ps-xl-5 m-b30">
        {/* Nome + especialidade + bio */}
        <span className="placeholder col-6 d-block mb-2" style={{ height: 34 }} />
        <span className="placeholder col-4 d-block mb-3" style={{ height: 18 }} />
        <span className="placeholder col-12 d-block mb-2" style={{ height: 12 }} />
        <span className="placeholder col-11 d-block mb-2" style={{ height: 12 }} />
        <span className="placeholder col-9 d-block mb-4" style={{ height: 12 }} />

        {/* Tabela */}
        <div className="rounded-3 overflow-hidden border mb-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="d-flex p-3"
              style={{ background: i % 2 === 0 ? "#f8f9fa" : "#fff", gap: 16 }}
            >
              <span className="placeholder col-3" style={{ height: 14 }} />
              <span className="placeholder col-6" style={{ height: 14 }} />
            </div>
          ))}
        </div>

        {/* Skills */}
        <span className="placeholder col-4 d-block mb-3" style={{ height: 20 }} />
        <div className="row mb-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="col-6 mb-2 d-flex align-items-center gap-2">
              <span className="placeholder rounded-circle" style={{ width: 16, height: 16 }} />
              <span className="placeholder col-7" style={{ height: 12 }} />
            </div>
          ))}
        </div>

        {/* Formulario de agendamento */}
        <div className="rounded-3 p-4" style={{ background: "#efe7f5" }}>
          <span className="placeholder col-5 d-block mb-3" style={{ height: 26 }} />
          <span className="placeholder col-8 d-block mb-4" style={{ height: 14 }} />
          <div className="d-flex gap-2 flex-wrap mb-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="placeholder rounded-3" style={{ width: 64, height: 72 }} />
            ))}
          </div>
          <div className="d-flex gap-2 flex-wrap mb-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="placeholder rounded-pill" style={{ width: 78, height: 38 }} />
            ))}
          </div>
          <span className="placeholder col-12 d-block rounded-3" style={{ height: 48 }} />
        </div>
      </div>
    </div>
  );
}
