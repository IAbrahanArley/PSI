"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MapPin, Monitor, Send, X } from "lucide-react";
import type { PsyCard } from "@/app/api/public/assistant/chat/route";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "user" | "assistant";

type ChatMessage = {
  id:       string;
  role:     Role;
  content:  string;
  loading?: boolean;
  psychologists?: PsyCard[];
};

// ─── Quick-start suggestions ──────────────────────────────────────────────────

const STARTERS = [
  { label: "Encontrar um psicólogo", msg: "Quero encontrar um psicólogo." },
  { label: "Como funciona?",         msg: "Como funciona o agendamento na plataforma?" },
  { label: "Sou psicólogo",          msg: "Sou psicólogo e quero me cadastrar. Como funciona?" },
  { label: "Preciso de ajuda agora", msg: "Estou passando por um momento difícil e preciso de ajuda urgente." },
];

// ─── Welcome message ──────────────────────────────────────────────────────────

const WELCOME: ChatMessage = {
  id:      "welcome",
  role:    "assistant",
  content: "Olá! 👋 Sou o **Mindzinho**, assistente da plataforma.\n\nPosso te ajudar a:\n- Encontrar o psicólogo ideal para você\n- Tirar dúvidas sobre como funciona a plataforma\n\nComo posso ajudar?",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() { return Math.random().toString(36).slice(2, 10); }

/** Converts **bold** markdown to <strong> and \n to <br> */
function renderMarkdown(text: string) {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n- /g, "\n• ")
    .replace(/\n/g, "<br />");
  return { __html: html };
}

// ─── PsychologistCard ─────────────────────────────────────────────────────────

function PsychologistCard({ psy }: { psy: PsyCard }) {
  const initial = psy.displayName.charAt(0).toUpperCase();
  const location = [psy.city, psy.state].filter(Boolean).join(", ");

  return (
    <div
      className="card border-0 rounded-3 mb-2"
      style={{ background: "#f8faff", border: "1px solid #e2e8f0 !important" }}
    >
      <div className="card-body p-3 d-flex align-items-center gap-3">
        {/* Photo */}
        {psy.profileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={psy.profileImageUrl}
            alt={psy.displayName}
            className="rounded-circle flex-shrink-0 object-fit-cover"
            style={{ width: 46, height: 46 }}
          />
        ) : (
          <div
            className="rounded-circle bg-primary d-flex align-items-center justify-content-center flex-shrink-0 text-white fw-bold"
            style={{ width: 46, height: 46, fontSize: "1.1rem" }}
          >
            {initial}
          </div>
        )}

        {/* Info */}
        <div className="flex-grow-1 min-w-0">
          <div className="fw-semibold text-truncate" style={{ fontSize: "0.88rem" }}>
            {psy.displayName}
          </div>
          <div className="text-primary" style={{ fontSize: "0.78rem" }}>
            {psy.specialty}
          </div>
          <div className="d-flex align-items-center gap-2 mt-1 flex-wrap" style={{ fontSize: "0.72rem", color: "#6b7280" }}>
            {location && (
              <span className="d-flex align-items-center gap-1">
                <MapPin size={10} /> {location}
              </span>
            )}
            {psy.offersOnline && (
              <span className="d-flex align-items-center gap-1">
                <Monitor size={10} /> Online
              </span>
            )}
            {psy.sessionPrice && (
              <span>R$ {Number(psy.sessionPrice).toFixed(0)}/sessão</span>
            )}
          </div>
        </div>

        {/* Button */}
        <Link
          href={`/team-detail?slug=${psy.slug}`}
          className="btn btn-primary btn-sm flex-shrink-0 fw-semibold"
          style={{ fontSize: "0.78rem", borderRadius: 8 }}
        >
          Agendar
        </Link>
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <div className="d-flex justify-content-end mb-2">
        <div
          className="px-3 py-2 text-white rounded-3"
          style={{ background: "var(--bs-primary, #2563eb)", maxWidth: "82%", fontSize: "0.87rem", lineHeight: 1.5, borderBottomRightRadius: "4px !important" }}
        >
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-start mb-2">
      <div style={{ maxWidth: "92%" }}>
        {msg.loading ? (
          <div className="px-3 py-2 rounded-3 bg-white shadow-sm" style={{ border: "1px solid #e5e7eb" }}>
            <span className="text-muted d-flex align-items-center gap-2" style={{ fontSize: "0.85rem" }}>
              <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }} />
              Mindzinho está pensando…
            </span>
          </div>
        ) : (
          <>
            <div
              className="px-3 py-2 rounded-3 bg-white shadow-sm"
              style={{ border: "1px solid #e5e7eb", fontSize: "0.87rem", lineHeight: 1.6 }}
              dangerouslySetInnerHTML={renderMarkdown(msg.content)}
            />
            {msg.psychologists && msg.psychologists.length > 0 && (
              <div className="mt-2">
                <p className="small text-muted mb-2" style={{ fontSize: "0.75rem" }}>
                  ✨ Profissionais encontrados para você:
                </p>
                {msg.psychologists.map((psy) => (
                  <PsychologistCard key={psy.id} psy={psy} />
                ))}
              </div>
            )}
            {msg.psychologists?.length === 0 && (
              <div className="mt-2 p-2 rounded-3 text-center" style={{ background: "#fff7ed", fontSize: "0.78rem", color: "#92400e" }}>
                Nenhum profissional encontrado com esses critérios. Tente ampliar a busca.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export default function FloatingPsychologistChatTeaser() {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input,    setInput]    = useState("");
  const [sending,  setSending]  = useState(false);
  const [pulse,    setPulse]    = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);

  // Stop pulsing after first open
  useEffect(() => {
    if (open) setPulse(false);
  }, [open]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = { id: genId(), role: "user", content: trimmed };
    const loadingMsg: ChatMessage = { id: genId(), role: "assistant", content: "", loading: true };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setInput("");
    setSending(true);

    // Build conversation history for API (exclude welcome + loading)
    const history = [...messages, userMsg]
      .filter((m) => m.id !== "welcome" && !m.loading)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res  = await fetch("/api/public/assistant/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: history }),
      });
      const data = await res.json() as { reply?: string; error?: string; psychologists?: PsyCard[] };

      const replyContent = res.ok
        ? (data.reply ?? "Desculpe, não consegui processar. Tente novamente.")
        : (data.error ?? "Erro ao conectar. Tente novamente.");

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, loading: false, content: replyContent, psychologists: data.psychologists }
            : m,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, loading: false, content: "Erro de conexão. Verifique sua internet e tente novamente." }
            : m,
        ),
      );
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  function handleStarterClick(msg: string) {
    void sendMessage(msg);
  }

  const showStarters = messages.length === 1; // only welcome message

  return (
    <>
      {/* ── Chat panel ── */}
      {open && (
        <div
          role="dialog"
          aria-label="Assistente Mindzinho"
          aria-modal="true"
          className="mindzinho-chat-panel"
          style={{
            position:     "fixed",
            right:        20,
            bottom:       20,
            width:        "min(390px, calc(100vw - 40px))",
            height:       "min(580px, calc(100vh - 40px))",
            zIndex:       1060,
            display:      "flex",
            flexDirection: "column",
            borderRadius: 20,
            overflow:     "hidden",
            boxShadow:    "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)",
            background:   "#f1f5f9",
          }}
        >
          {/* Header */}
          <div
            className="d-flex align-items-center gap-3 px-4 py-3"
            style={{ background: "var(--bs-primary, #2563eb)", flexShrink: 0 }}
          >
            <div
              className="rounded-circle overflow-hidden flex-shrink-0 bg-white d-flex align-items-center justify-content-center"
              style={{ width: 40, height: 40 }}
            >
              <video
                src="/assets/Mindzinho.mp4"
                autoPlay muted loop playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div className="flex-grow-1">
              <div className="text-white fw-semibold" style={{ fontSize: "0.95rem", lineHeight: 1.2 }}>
                Mindzinho
              </div>
              <div className="d-flex align-items-center gap-1" style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.8)" }}>
                <span
                  className="rounded-circle"
                  style={{ width: 7, height: 7, background: "#4ade80", display: "inline-block" }}
                />
                Assistente online
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm p-1 text-white border-0"
              style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8 }}
              onClick={() => setOpen(false)}
              aria-label="Fechar chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-grow-1 px-3 py-3"
            style={{ overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column" }}
          >
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {/* Quick starters */}
            {showStarters && (
              <div className="mt-1 mb-2 d-flex flex-wrap gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    className="btn btn-sm btn-outline-primary rounded-pill"
                    style={{ fontSize: "0.78rem", fontWeight: 500 }}
                    onClick={() => handleStarterClick(s.msg)}
                    disabled={sending}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="px-3 py-3 border-top"
            style={{ background: "#fff", flexShrink: 0 }}
          >
            <div className="d-flex align-items-end gap-2">
              <textarea
                ref={inputRef}
                className="form-control form-control-sm"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem…"
                disabled={sending}
                style={{ resize: "none", borderRadius: 12, fontSize: "0.88rem", lineHeight: 1.5, maxHeight: 96, overflowY: "auto" }}
              />
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: 38, height: 38, borderRadius: 12, padding: 0 }}
                onClick={() => void sendMessage(input)}
                disabled={sending || !input.trim()}
                aria-label="Enviar"
              >
                {sending
                  ? <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14 }} />
                  : <Send size={15} />
                }
              </button>
            </div>
            <p className="text-muted mb-0 mt-1 text-center" style={{ fontSize: "0.68rem" }}>
              Não substitui atendimento profissional · CVV: 188 (24h)
            </p>
          </div>
        </div>
      )}

      {/* ── Floating trigger button — hidden while chat is open ── */}
      {!open && (
      <div className="mindzinho-fab-wrap">

        {/* Pulse ring */}
        {pulse && (
          <span
            aria-hidden
            style={{
              position:     "absolute",
              inset:        -6,
              borderRadius: "50%",
              background:   "var(--bs-primary, #2563eb)",
              opacity:      0.25,
              animation:    "mindzinhoPulse 1.8s ease-out infinite",
            }}
          />
        )}

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir assistente Mindzinho"
          aria-expanded={false}
          style={{
            width:        72,
            height:       72,
            borderRadius: "50%",
            padding:      0,
            border:       "none",
            cursor:       "pointer",
            overflow:     "hidden",
            boxShadow:    "0 4px 20px rgba(0,0,0,0.2)",
            transition:   "box-shadow 0.2s ease",
            position:     "relative",
            background:   "#fff",
          }}
        >
          <video
            src="/assets/Mindzinho.mp4"
            autoPlay muted loop playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </button>

        {/* Tooltip */}
        {pulse && (
          <div
            aria-hidden
            style={{
              position:    "absolute",
              right:       80,
              bottom:      12,
              background:  "#1e293b",
              color:       "#fff",
              fontSize:    "0.75rem",
              padding:     "5px 10px",
              borderRadius: 8,
              whiteSpace:  "nowrap",
              pointerEvents: "none",
              boxShadow:   "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            Olá! Posso ajudar? 👋
            {/* Arrow */}
            <span
              style={{
                position:   "absolute",
                right:      -5,
                top:        "50%",
                transform:  "translateY(-50%)",
                width:      0,
                height:     0,
                borderTop:   "5px solid transparent",
                borderBottom: "5px solid transparent",
                borderLeft:  "6px solid #1e293b",
              }}
            />
          </div>
        )}
      </div>
      )}

      {/* Styles + pulse animation */}
      <style>{`
        @keyframes mindzinhoPulse {
          0%   { transform: scale(1);   opacity: 0.35; }
          70%  { transform: scale(1.5); opacity: 0;    }
          100% { transform: scale(1.5); opacity: 0;    }
        }

        /* Botão flutuante — posição base */
        .mindzinho-fab-wrap {
          position: fixed;
          right: 20px;
          bottom: 20px;
          z-index: 1055;
        }

        /* Painel de chat — posição base */
        .mindzinho-chat-panel {
          bottom: 20px !important;
          height: min(580px, calc(100vh - 40px)) !important;
        }

        /* Mobile ≤575px: barra inferior do tema tem 60px → sobe 80px (60+20) */
        @media (max-width: 575px) {
          .mindzinho-fab-wrap {
            bottom: 80px;
          }
          .mindzinho-chat-panel {
            bottom: 80px !important;
            height: min(580px, calc(100vh - 100px)) !important;
          }
        }
      `}</style>
    </>
  );
}
