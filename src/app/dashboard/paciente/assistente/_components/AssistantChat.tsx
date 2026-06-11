"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bot,
  MessageCircle,
  Plus,
  Send,
  Trash2,
  Phone,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Role = "user" | "assistant";

type Message = {
  id:      string;
  role:    Role;
  content: string;
  streaming?: boolean;
};

type Conversation = {
  id:        string;
  title:     string;
  updatedAt: string;
};

// ─── Sugestões de início de conversa ─────────────────────────────────────────

const STARTERS = [
  "Estou me sentindo ansioso ultimamente",
  "Como posso lidar com o estresse do trabalho?",
  "Quero aprender técnicas de respiração",
  "Não estou conseguindo dormir bem",
  "Estou passando por um momento difícil",
  "O que é mindfulness e como praticar?",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// ─── Parsing do SSE da Anthropic ─────────────────────────────────────────────

function extractTextDelta(line: string): string {
  if (!line.startsWith("data: ")) return "";
  const jsonStr = line.slice(6);
  try {
    const obj = JSON.parse(jsonStr) as Record<string, unknown>;
    // Evento custom com conv_id
    if (obj.type === "conv_id") return "";
    // Evento de texto da Anthropic
    if (
      obj.type === "content_block_delta" &&
      obj.delta &&
      typeof obj.delta === "object" &&
      (obj.delta as Record<string, unknown>).type === "text_delta"
    ) {
      return String((obj.delta as Record<string, unknown>).text ?? "");
    }
  } catch { /* ignora linhas malformadas */ }
  return "";
}

function extractConvId(line: string): string | null {
  if (!line.startsWith("data: ")) return null;
  try {
    const obj = JSON.parse(line.slice(6)) as Record<string, unknown>;
    if (obj.type === "conv_id" && typeof obj.id === "string") return obj.id;
  } catch { /* ignora */ }
  return null;
}

// ─── AssistantChat ────────────────────────────────────────────────────────────

export function AssistantChat() {
  // ── Estado ───────────────────────────────────────────────────────────────

  const [conversations,    setConversations]    = useState<Conversation[]>([]);
  const [activeConvId,     setActiveConvId]     = useState<string | null>(null);
  const [messages,         setMessages]         = useState<Message[]>([]);
  const [input,            setInput]            = useState("");
  const [streaming,        setStreaming]         = useState(false);
  const [loadingConvs,     setLoadingConvs]     = useState(true);
  const [loadingMessages,  setLoadingMessages]  = useState(false);
  const [showSidebar,      setShowSidebar]      = useState(true); // mobile toggle
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const abortRef       = useRef<AbortController | null>(null);

  // ── Carrega lista de conversas ────────────────────────────────────────────

  async function loadConversations() {
    setLoadingConvs(true);
    try {
      const res  = await fetch("/api/patient/assistant/conversations", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConversations(data.conversations ?? []);
    } catch {
      toast.error("Não foi possível carregar o histórico.");
    } finally {
      setLoadingConvs(false);
    }
  }

  useEffect(() => { void loadConversations(); }, []);

  // ── Scroll automático ─────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Abre uma conversa existente ───────────────────────────────────────────

  async function openConversation(convId: string) {
    setActiveConvId(convId);
    setLoadingMessages(true);
    setShowSidebar(false); // fecha sidebar no mobile
    try {
      const res  = await fetch(`/api/patient/assistant/conversations/${convId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages(
        (data.messages ?? []).map((m: { id: string; role: Role; content: string }) => ({
          id:      m.id,
          role:    m.role,
          content: m.content,
        })),
      );
    } catch {
      toast.error("Não foi possível carregar a conversa.");
    } finally {
      setLoadingMessages(false);
    }
  }

  // ── Nova conversa ─────────────────────────────────────────────────────────

  function newConversation() {
    setActiveConvId(null);
    setMessages([]);
    setShowSidebar(false);
    inputRef.current?.focus();
  }

  // ── Envia mensagem + streaming ────────────────────────────────────────────

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    setInput("");

    const userMsg: Message = { id: genId(), role: "user", content };
    const assistantId = genId();

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setStreaming(true);

    // Histório para contexto (últimas 20 mensagens + nova)
    const history = [...messages, userMsg]
      .slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    let fullResponse = "";
    let resolvedConvId = activeConvId;

    try {
      const res = await fetch("/api/patient/assistant/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          conversationId: activeConvId ?? undefined,
          messages:       history,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Erro desconhecido." }));
        toast.error(err.error ?? "Erro ao chamar o assistente.");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        return;
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          // Verifica conv_id customizado
          const newId = extractConvId(line);
          if (newId && !resolvedConvId) {
            resolvedConvId = newId;
            setActiveConvId(newId);
          }

          const delta = extractTextDelta(line);
          if (delta) {
            fullResponse += delta;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: fullResponse } : m,
              ),
            );
          }
        }
      }

      // Remove flag de streaming
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)),
      );

      // Salva a resposta do assistente no banco
      if (resolvedConvId && fullResponse) {
        void fetch("/api/patient/assistant/messages", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            conversationId: resolvedConvId,
            role:           "assistant",
            content:        fullResponse,
          }),
        });
      }

      // Atualiza lista de conversas
      await loadConversations();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Erro de conexão. Tente novamente.");
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setStreaming(false);
    }
  }

  // ── Apaga conversa específica ─────────────────────────────────────────────

  async function deleteConversation(id: string) {
    try {
      await fetch(`/api/patient/assistant/conversations/${id}`, { method: "DELETE" });
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
      await loadConversations();
    } catch {
      toast.error("Não foi possível apagar a conversa.");
    }
  }

  // ── Apaga todo o histórico ────────────────────────────────────────────────

  async function deleteAll() {
    try {
      await fetch("/api/patient/assistant/conversations", { method: "DELETE" });
      setConversations([]);
      setActiveConvId(null);
      setMessages([]);
      setShowDeleteAllModal(false);
      toast.success("Histórico apagado.");
    } catch {
      toast.error("Não foi possível apagar o histórico.");
    }
  }

  // ── Enter para enviar ─────────────────────────────────────────────────────

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const isEmpty = messages.length === 0;

  return (
    <div style={{ height: "calc(100vh - 120px)", minHeight: 500 }} className="d-flex flex-column">

      {/* ── Cabeçalho ───────────────────────────────────────────────────── */}
      <div className="d-flex align-items-center gap-2 mb-1">
        <Bot size={22} className="text-primary" />
        <h1 className="title mb-0">Assistente Mindzinho</h1>
      </div>

      {/* ── Aviso de segurança ───────────────────────────────────────────── */}
      <div
        className="alert border-0 d-flex align-items-start gap-2 py-2 px-3 mb-3 rounded-3"
        style={{ background: "#fef3c7", fontSize: "0.8rem" }}
      >
        <AlertTriangle size={14} className="text-warning flex-shrink-0 mt-1" />
        <span className="text-warning-emphasis">
          <strong>Não sou um terapeuta.</strong> Em situações de crise, ligue{" "}
          <a href="tel:188" className="fw-bold text-danger text-decoration-none">
            <Phone size={11} className="me-1" />188
          </a>{" "}
          (CVV — 24h, gratuito) ou procure emergência.
        </span>
      </div>

      {/* ── Layout principal ─────────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm flex-grow-1 overflow-hidden" style={{ minHeight: 0 }}>
        <div className="d-flex h-100" style={{ minHeight: 0 }}>

          {/* ── Sidebar de conversas ─────────────────────────────────────── */}
          <aside
            className={`border-end flex-shrink-0 d-flex flex-column ${showSidebar ? "d-flex" : "d-none d-lg-flex"}`}
            style={{ width: 220, background: "#fafafa" }}
          >
            {/* Header da sidebar */}
            <div className="p-2 border-bottom d-flex gap-1">
              <button
                type="button"
                className="btn btn-primary btn-sm flex-grow-1 d-flex align-items-center justify-content-center gap-1 fw-semibold"
                onClick={newConversation}
                style={{ borderRadius: 8, fontSize: "0.8rem" }}
              >
                <Plus size={13} /> Nova conversa
              </button>
              {conversations.length > 0 && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  title="Apagar todo o histórico"
                  onClick={() => setShowDeleteAllModal(true)}
                  style={{ borderRadius: 8 }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Lista de conversas */}
            <div className="flex-grow-1 overflow-auto p-1">
              {loadingConvs ? (
                <p className="text-muted small p-2">Carregando…</p>
              ) : conversations.length === 0 ? (
                <p className="text-muted small p-2">Nenhuma conversa ainda.</p>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`d-flex align-items-start gap-1 rounded-2 p-2 mb-1 cursor-pointer ${
                      activeConvId === conv.id ? "bg-primary bg-opacity-10" : "hover-bg"
                    }`}
                    style={{ cursor: "pointer" }}
                    onClick={() => void openConversation(conv.id)}
                  >
                    <MessageCircle
                      size={13}
                      className={`flex-shrink-0 mt-1 ${activeConvId === conv.id ? "text-primary" : "text-muted"}`}
                    />
                    <div className="flex-grow-1 min-width-0">
                      <p
                        className={`mb-0 text-truncate fw-semibold ${activeConvId === conv.id ? "text-primary" : ""}`}
                        style={{ fontSize: "0.78rem" }}
                      >
                        {conv.title}
                      </p>
                      <p className="mb-0 text-muted" style={{ fontSize: "0.68rem" }}>
                        {formatDate(conv.updatedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-muted p-0 flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); void deleteConversation(conv.id); }}
                      title="Apagar conversa"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* LGPD note */}
            <div className="p-2 border-top" style={{ fontSize: "0.68rem", color: "#9ca3af" }}>
              Conversas protegidas pela LGPD. Você pode excluí-las a qualquer momento.
            </div>
          </aside>

          {/* ── Área de chat ──────────────────────────────────────────────── */}
          <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0, minHeight: 0 }}>

            {/* Barra superior mobile */}
            <div className="d-flex d-lg-none align-items-center gap-2 p-2 border-bottom">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                onClick={() => setShowSidebar((v) => !v)}
                style={{ borderRadius: 8, fontSize: "0.8rem" }}
              >
                <ChevronLeft size={14} />
                Conversas
              </button>
              {activeConvId && (
                <span className="text-muted small text-truncate flex-grow-1">
                  {conversations.find((c) => c.id === activeConvId)?.title ?? "Conversa"}
                </span>
              )}
            </div>

            {/* Mensagens */}
            <div className="flex-grow-1 overflow-auto p-3 p-md-4" style={{ minHeight: 0 }}>

              {loadingMessages ? (
                <div className="text-center text-muted py-5">
                  <span className="spinner-border spinner-border-sm me-2" />
                  Carregando conversa…
                </div>
              ) : isEmpty ? (
                /* Estado vazio com sugestões */
                <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center px-3">
                  <div
                    className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 mb-3"
                    style={{ width: 64, height: 64 }}
                  >
                    <Bot size={28} className="text-primary" />
                  </div>
                  <h2 className="fw-bold mb-1" style={{ fontSize: "1.15rem", color: "#1a1a2e" }}>
                    Olá! Como posso ajudar?
                  </h2>
                  <p className="text-muted mb-4" style={{ fontSize: "0.85rem", maxWidth: 380 }}>
                    Estou aqui para oferecer apoio emocional, técnicas de bem-estar e
                    psicoeducação. Comece por um dos temas abaixo ou escreva o que quiser.
                  </p>
                  <div className="d-flex flex-wrap gap-2 justify-content-center" style={{ maxWidth: 480 }}>
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        style={{ borderRadius: 20, fontSize: "0.8rem" }}
                        onClick={() => void sendMessage(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Mensagens */
                <div className="d-flex flex-column gap-3">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  {/* Cursor de streaming */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-top p-3">
              <div className="d-flex gap-2 align-items-end">
                <textarea
                  ref={inputRef}
                  className="form-control"
                  rows={1}
                  placeholder="Digite sua mensagem… (Enter para enviar, Shift+Enter para nova linha)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  disabled={streaming}
                  style={{
                    borderRadius: 12,
                    fontSize: "0.9rem",
                    resize: "none",
                    minHeight: 44,
                    maxHeight: 120,
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{ width: 44, height: 44, borderRadius: 12 }}
                  onClick={() => void sendMessage()}
                  disabled={!input.trim() || streaming}
                >
                  {streaming ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal: confirmar apagar tudo ─────────────────────────────────── */}
      {showDeleteAllModal && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ background: "rgba(0,0,0,0.5)", zIndex: 1040 }}
            onClick={() => setShowDeleteAllModal(false)}
          />
          <div
            className="position-fixed top-50 start-50 translate-middle bg-white rounded-4 shadow-lg p-4"
            style={{ zIndex: 1050, width: "min(94vw, 400px)" }}
            role="dialog"
            aria-modal="true"
          >
            <div className="d-flex align-items-center gap-2 mb-3">
              <Trash2 size={20} className="text-danger" />
              <h5 className="mb-0 fw-bold">Apagar todo o histórico?</h5>
            </div>
            <p className="text-muted small mb-4">
              Todas as conversas e mensagens serão removidas permanentemente. Esta ação não pode ser desfeita.
            </p>
            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowDeleteAllModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => void deleteAll()}
              >
                Apagar tudo
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Estilos locais ────────────────────────────────────────────────── */}
      <style>{`
        .hover-bg:hover { background: #f3f4f6; }
        .cursor-blink {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: currentColor;
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: blink 1s step-end infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}

// ─── Bolha de mensagem ────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`d-flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 ${
          isUser ? "bg-primary text-white" : "bg-light border"
        }`}
        style={{ width: 32, height: 32, fontSize: "0.8rem", alignSelf: "flex-end" }}
      >
        {isUser ? "Eu" : <Bot size={16} className="text-primary" />}
      </div>

      {/* Balão */}
      <div
        className={`rounded-4 px-3 py-2 ${isUser ? "bg-primary text-white" : "bg-light"}`}
        style={{
          maxWidth: "75%",
          fontSize: "0.88rem",
          lineHeight: 1.6,
          borderRadius: isUser ? "18px 18px 4px 18px !important" : "18px 18px 18px 4px !important",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {message.content || (message.streaming ? "" : "…")}
        {message.streaming && <span className="cursor-blink" />}
      </div>
    </div>
  );
}
