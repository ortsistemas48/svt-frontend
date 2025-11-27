"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Send, Info, X } from "lucide-react";

type SupportTicket = {
  id: number;
  workshop_id: number;
  created_by_user_id: string;
  full_name: string | null;
  phone: string | null;
  subject: string;
  description: string;
  status: "Pendiente" | "Abierto" | "Resuelto" | "Cerrado" | string;
  created_at?: string | null;
};

type TicketMessage = {
  id: number;
  ticket_id: number;
  sender_user_id: string | null;
  sender_role: "user" | "admin" | "system" | string | null;
  content: string;
  created_at?: string | null;
};

export default function AdminTicketChatPage() {
  const params = useParams<{ ticketId: string }>();
  const router = useRouter();
  const ticketId = useMemo(() => Number(params?.ticketId), [params]);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false); // Para mobile/tablet: controla si mostrar lista o chat

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

  // Info modal state
  type WorkshopDetail = {
    id?: number;
    name?: string;
    razon_social?: string;
    city?: string;
    province?: string;
    address?: string | null;
    cuit?: string | null;
    phone?: string | null;
    plant_number?: number;
    disposition_number?: string;
  };
  const [infoOpen, setInfoOpen] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [workshopDetail, setWorkshopDetail] = useState<WorkshopDetail | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);

  // Left list - all tickets
  useEffect(() => {
    setTicketsLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/tickets/admin?status=all`, { credentials: "include" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { tickets: SupportTicket[] };
        setTickets(data.tickets || []);
      } catch {
        setTickets([]);
      } finally {
        setTicketsLoading(false);
      }
    })();
  }, []);

  // Load current ticket + messages
  useEffect(() => {
    if (!ticketId || Number.isNaN(ticketId)) {
      // Si no hay ticketId válido en mobile, mostrar la lista
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setShowChat(false);
      }
      return;
    }
    setLoading(true);
    // En mobile/tablet, mostrar el chat cuando hay un ticketId en la URL
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setShowChat(true);
    }
    (async () => {
      try {
        const [ticketRes, msgsRes] = await Promise.all([
          fetch(`/api/tickets/admin/${ticketId}`, { credentials: "include" }),
          fetch(`/api/tickets/admin/${ticketId}/messages?limit=500`, { credentials: "include" }),
        ]);
        if (ticketRes.ok) {
          const { ticket } = (await ticketRes.json()) as { ticket: SupportTicket };
          setCurrentTicket(ticket);
        } else {
          setCurrentTicket(null);
        }
        if (msgsRes.ok) {
          const { messages } = (await msgsRes.json()) as { messages: TicketMessage[] };
          setMessages(messages || []);
          setTimeout(scrollToBottom, 50);
        } else {
          setMessages([]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [ticketId]);

  // Poll
  useEffect(() => {
    if (!ticketId || Number.isNaN(ticketId)) return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/tickets/admin/${ticketId}/messages?limit=500`, { credentials: "include" });
        if (!res.ok) return;
        const { messages } = (await res.json()) as { messages: TicketMessage[] };
        setMessages(messages || []);
      } catch {}
    }, 6000);
    return () => clearInterval(iv);
  }, [ticketId]);

  async function markAsResolved() {
    if (!ticketId || Number.isNaN(ticketId) || resolving) return;
    try {
      setResolving(true);
      setResolveError(null);
      const res = await fetch(`/api/tickets/admin/${ticketId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Resuelto" }),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "No se pudo marcar como resuelto");
      }
      setCurrentTicket((prev) => (prev ? { ...prev, status: "Resuelto" } : prev));
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: "Resuelto" } : t)));
    } catch (e: any) {
      setResolveError(e?.message || "Error al actualizar el estado");
    } finally {
      setResolving(false);
    }
  }

  async function openInfoModal() {
    setInfoOpen(true);
    setInfoError(null);
    setWorkshopDetail(null);
    if (!currentTicket?.workshop_id) return;
    try {
      setLoadingInfo(true);
      const res = await fetch(`/api/workshops/${currentTicket.workshop_id}`, { credentials: "include" });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || `No se pudo cargar el taller #${currentTicket.workshop_id}`);
      }
      const data = await res.json().catch(() => ({}));
      setWorkshopDetail(data || {});
    } catch (e: any) {
      setInfoError(e?.message || "Error cargando información del taller");
    } finally {
      setLoadingInfo(false);
    }
  }

  async function handleSend() {
    const value = text.trim();
    if (!value || sending) return;
    try {
      setSending(true);
      // optimistic admin bubble
      const optimistic: TicketMessage = {
        id: Date.now(),
        ticket_id: ticketId,
        sender_user_id: null,
        sender_role: "admin",
        content: value,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setText("");
      setTimeout(scrollToBottom, 20);

      const res = await fetch(`/api/tickets/admin/${ticketId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const msgsRes = await fetch(`/api/tickets/admin/${ticketId}/messages?limit=500`, { credentials: "include" });
      if (msgsRes.ok) {
        const { messages } = (await msgsRes.json()) as { messages: TicketMessage[] };
        setMessages(messages || []);
        setTimeout(scrollToBottom, 50);
      }
    } finally {
      setSending(false);
    }
  }

  const selectedId = ticketId;

  return (
    <div className="py-3 sm:py-4 md:py-6 max-w-7xl mx-auto px-1 sm:px-2 md:px-4 lg:px-6">
      {/* Desktop: side-by-side layout */}
      <div className="hidden lg:grid lg:grid-cols-[320px_1fr] gap-4">
        {/* Left: tickets list */}
        <aside className="bg-white rounded-lg sm:rounded-[14px] border border-gray-200 h-[72vh] flex flex-col">
          <div className="px-3 sm:px-4 py-2 sm:py-3">
            <button
              onClick={() => router.push(`/admin-dashboard/support`)}
              className="w-full inline-flex items-center gap-2 justify-start text-xs sm:text-sm text-[#0040B8] font-medium border border-[#0040B8] rounded-[4px] px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-[#0040B8]/5 focus:outline-none focus:ring-2 focus:ring-[#0040B8]/30"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              Volver a tickets
            </button>
          </div>

          <div className="overflow-auto p-2 sm:p-3 space-y-2">
            {ticketsLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div key={`s-${i}`} className="w-full text-left rounded-lg sm:rounded-[14px] border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 bg-white">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <div className="h-3 w-16 sm:w-20 bg-gray-200 rounded animate-pulse mb-1.5 sm:mb-2" />
                    <div className="h-3 sm:h-4 w-32 sm:w-48 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}

            {!ticketsLoading && tickets.map((t) => {
              const isActive = t.id === selectedId;
              const isResolved = (t.status || "").toLowerCase() === "resuelto";
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setLoading(true);
                    setMessages([]);
                    setCurrentTicket(null);
                    router.push(`/admin-dashboard/support/${t.id}`);
                  }}
                  className={`w-full text-left rounded-lg sm:rounded-[14px] border px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 transition-colors ${
                    isActive
                      ? "border-[#0040B8] bg-[#0040B8]/5"
                      : isResolved
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <img src="/images/icons/msgIcon.svg" alt="" className="w-7 h-7 sm:w-8 sm:h-8" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] sm:text-xs text-gray-500">Asunto:</div>
                    <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{t.subject}</div>
                  </div>
                  {isResolved && (
                    <span className="ml-auto inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 flex-shrink-0">
                      Resuelto
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right: chat */}
        <section className="bg-white rounded-lg sm:rounded-[14px] border border-gray-200 h-[72vh] flex flex-col">
          {/* Header */}
          <div className="px-3 sm:px-4 md:px-5 py-2 sm:py-3 md:py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                  <span className="text-xs sm:text-sm font-semibold">U</span>
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{currentTicket?.full_name || "Cargando..."}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={openInfoModal}
                className="inline-flex items-center gap-1 sm:gap-2 rounded-[4px] border border-gray-300 text-gray-700 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-50"
                title="Ver información de la persona y taller"
              >
                <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Info</span>
              </button>
              {(currentTicket?.status || "").toLowerCase() !== "resuelto" && (
                <button
                  type="button"
                  onClick={markAsResolved}
                  disabled={resolving}
                  className="inline-flex items-center gap-1 sm:gap-2 rounded-[4px] border border-[#0040B8] text-[#0040B8] text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-[#0040B8]/5 disabled:opacity-60"
                  title="Marcar ticket como resuelto"
                >
                  {resolving ? "Marcando..." : "Resuelto"}
                </button>
              )}
            </div>
          </div>

          {resolveError && (
            <div className="px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 text-[10px] sm:text-xs text-rose-700">{resolveError}</div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-auto px-2 sm:px-3 md:px-5 py-2 sm:py-3 md:py-4 space-y-2 sm:space-y-3">
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl p-3 ${i % 2 === 0 ? "bg-[#0040B8]/20" : "bg-gray-200/60"}`}>
                      <div className="w-56 h-4 bg-white/40 animate-pulse rounded mb-2" />
                      <div className="w-40 h-4 bg-white/30 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && (
              <>
                {(() => {
                  const desc = (currentTicket?.description || "").trim();
                  const hasInitial = Boolean(desc) && messages.some((m) => (m.content || "").trim() === desc);
                  const initial: TicketMessage | null =
                    currentTicket && desc && !hasInitial
                      ? { id: -1, ticket_id: currentTicket.id, sender_user_id: String(currentTicket.created_by_user_id || ""), sender_role: "user", content: desc, created_at: currentTicket.created_at || undefined }
                      : null;
                  const toRender = initial ? [initial, ...messages] : messages;

                  return toRender.map((m) => {
                    const mine = (m.sender_role || "") === "admin";
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] sm:max-w-[70%] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm ${mine ? "bg-[#0040B8] text-white" : "bg-gray-100 text-gray-900"}`}>
                          {m.content}
                        </div>
                      </div>
                    );
                  });
                })()}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 border-t">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-[14px] px-2 sm:px-3 py-1.5 sm:py-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Escribí tu mensaje..."
                className="flex-1 bg-transparent outline-none text-xs sm:text-sm py-0.5 sm:py-1"
              />
              <button
                onClick={handleSend}
                disabled={sending || !text.trim()}
                className="p-1.5 sm:p-2 rounded-full text-white bg-[#0040B8] hover:bg-[#0035a0] disabled:opacity-60 flex-shrink-0"
                title="Enviar"
                type="button"
              >
                <Send className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Mobile/Tablet: Lista primero, luego chat */}
      <div className="lg:hidden">
        {!showChat ? (
          /* Lista de tickets - Mobile/Tablet */
          <aside className="bg-white rounded-lg border border-gray-200 min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-10rem)] flex flex-col">
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b">
              <button
                onClick={() => router.push(`/admin-dashboard/support`)}
                className="w-full inline-flex items-center gap-2 justify-start text-xs sm:text-sm text-[#0040B8] font-medium border border-[#0040B8] rounded-[4px] px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-[#0040B8]/5"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                Volver a tickets
              </button>
            </div>

            <div className="overflow-auto p-2 sm:p-3 space-y-2">
              {ticketsLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={`s-${i}`} className="w-full text-left rounded-lg border border-gray-200 px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 bg-white">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <div className="h-3 w-16 sm:w-20 bg-gray-200 rounded animate-pulse mb-1.5 sm:mb-2" />
                      <div className="h-3 sm:h-4 w-32 sm:w-48 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                ))}

              {!ticketsLoading && tickets.map((t) => {
                const isActive = t.id === selectedId;
                const isResolved = (t.status || "").toLowerCase() === "resuelto";
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setLoading(true);
                      setMessages([]);
                      setCurrentTicket(null);
                      router.push(`/admin-dashboard/support/${t.id}`);
                      setShowChat(true);
                    }}
                    className={`w-full text-left rounded-lg border px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 transition-colors ${
                      isActive
                        ? "border-[#0040B8] bg-[#0040B8]/5"
                        : isResolved
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <img src="/images/icons/msgIcon.svg" alt="" className="w-7 h-7 sm:w-8 sm:h-8" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] sm:text-xs text-gray-500">Asunto:</div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{t.subject}</div>
                    </div>
                    {isResolved && (
                      <span className="ml-auto inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 flex-shrink-0">
                        Resuelto
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </aside>
        ) : (
          /* Chat - Mobile/Tablet */
          <section className="bg-white rounded-lg border border-gray-200 min-h-[calc(100vh-8rem)] sm:min-h-[calc(100vh-10rem)] flex flex-col">
            {/* Header con botón volver */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-between">
              <button
                onClick={() => {
                  setShowChat(false);
                  setCurrentTicket(null);
                  setMessages([]);
                  router.push(`/admin-dashboard/support`);
                }}
                className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#0040B8] font-medium hover:underline"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Volver a tickets</span>
                <span className="sm:hidden">Volver</span>
              </button>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={openInfoModal}
                  className="inline-flex items-center gap-1 sm:gap-2 rounded-[4px] border border-gray-300 text-gray-700 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-gray-50"
                  title="Ver información de la persona y taller"
                >
                  <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Info</span>
                </button>
                {(currentTicket?.status || "").toLowerCase() !== "resuelto" && (
                  <button
                    type="button"
                    onClick={markAsResolved}
                    disabled={resolving}
                    className="inline-flex items-center gap-1 sm:gap-2 rounded-[4px] border border-[#0040B8] text-[#0040B8] text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 hover:bg-[#0040B8]/5 disabled:opacity-60"
                    title="Marcar ticket como resuelto"
                  >
                    {resolving ? "Marcando..." : "Resuelto"}
                  </button>
                )}
              </div>
            </div>

            {/* Nombre del usuario */}
            <div className="px-3 sm:px-4 py-2 border-b flex items-center gap-2">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                <span className="text-xs sm:text-sm font-semibold">U</span>
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{currentTicket?.full_name || "Cargando..."}</div>
              </div>
            </div>

            {resolveError && (
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs text-rose-700">{resolveError}</div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-auto px-2 sm:px-3 py-2 sm:py-3 space-y-2 sm:space-y-3">
              {loading && (
                <div className="space-y-2 sm:space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] rounded-xl sm:rounded-2xl p-2 sm:p-3 ${i % 2 === 0 ? "bg-[#0040B8]/20" : "bg-gray-200/60"}`}>
                        <div className="w-32 sm:w-56 h-3 sm:h-4 bg-white/40 animate-pulse rounded mb-1.5 sm:mb-2" />
                        <div className="w-24 sm:w-40 h-3 sm:h-4 bg-white/30 animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!loading && (
                <>
                  {(() => {
                    const desc = (currentTicket?.description || "").trim();
                    const hasInitial = Boolean(desc) && messages.some((m) => (m.content || "").trim() === desc);
                    const initial: TicketMessage | null =
                      currentTicket && desc && !hasInitial
                        ? { id: -1, ticket_id: currentTicket.id, sender_user_id: String(currentTicket.created_by_user_id || ""), sender_role: "user", content: desc, created_at: currentTicket.created_at || undefined }
                        : null;
                    const toRender = initial ? [initial, ...messages] : messages;

                    return toRender.map((m) => {
                      const mine = (m.sender_role || "") === "admin";
                      return (
                        <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] sm:max-w-[70%] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm ${mine ? "bg-[#0040B8] text-white" : "bg-gray-100 text-gray-900"}`}>
                            {m.content}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Composer */}
            <div className="px-2 sm:px-3 py-2 sm:py-3 border-t">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-50 border border-gray-200 rounded-lg sm:rounded-[14px] px-2 sm:px-3 py-1.5 sm:py-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Escribí tu mensaje..."
                  className="flex-1 bg-transparent outline-none text-xs sm:text-sm py-0.5 sm:py-1"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !text.trim()}
                  className="p-1.5 sm:p-2 rounded-full text-white bg-[#0040B8] hover:bg-[#0035a0] disabled:opacity-60 flex-shrink-0"
                  title="Enviar"
                  type="button"
                >
                  <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Info Modal */}
      {infoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setInfoOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-lg sm:rounded-[14px] shadow-xl border border-gray-200 max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-3 sm:px-4 md:px-5 py-2 sm:py-3 md:py-4 border-b">
              <h3 className="text-sm sm:text-base font-semibold">Información del usuario y del taller</h3>
              <button
                className="p-1.5 sm:p-2 rounded hover:bg-gray-100"
                onClick={() => setInfoOpen(false)}
                aria-label="Cerrar"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-3 sm:px-4 md:px-5 py-3 sm:py-4 overflow-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="border border-gray-200 rounded-lg sm:rounded-[14px]">
                  <div className="px-3 sm:px-4 py-2 sm:py-3 border-b">
                    <div className="text-xs sm:text-sm font-semibold text-gray-900">Persona</div>
                  </div>
                  <div className="divide-y">
                    <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
                      <span className="text-gray-500">Nombre</span>
                      <span className="text-gray-900 text-right break-words">{currentTicket?.full_name || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
                      <span className="text-gray-500">Teléfono</span>
                      <span className="text-gray-900">{currentTicket?.phone || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg sm:rounded-[14px]">
                  <div className="px-3 sm:px-4 py-2 sm:py-3 border-b flex items-center justify-between">
                    <div className="text-xs sm:text-sm font-semibold text-gray-900">Taller</div>
                    {loadingInfo && <div className="text-[10px] sm:text-xs text-gray-500">Cargando...</div>}
                  </div>
                  {infoError ? (
                    <div className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-rose-700">{infoError}</div>
                  ) : (
                    <div className="divide-y">
                      <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
                        <span className="text-gray-500">Nombre</span>
                        <span className="text-gray-900 text-right break-words">{workshopDetail?.name || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
                        <span className="text-gray-500">Razón social</span>
                        <span className="text-gray-900 text-right break-words">{workshopDetail?.razon_social || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
                        <span className="text-gray-500">Ciudad</span>
                        <span className="text-gray-900">{workshopDetail?.city || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
                        <span className="text-gray-500">Provincia</span>
                        <span className="text-gray-900">{workshopDetail?.province || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
                        <span className="text-gray-500">Dirección</span>
                        <span className="text-gray-900 text-right break-words">{workshopDetail?.address || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
                        <span className="text-gray-500">CUIT</span>
                        <span className="text-gray-900">{workshopDetail?.cuit || "-"}</span>
                      </div>
                      <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
                        <span className="text-gray-500">Teléfono</span>
                        <span className="text-gray-900">{workshopDetail?.phone || "-"}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="px-3 sm:px-4 md:px-5 py-2 sm:py-3 border-t flex items-center justify-end bg-gray-50 rounded-b-lg sm:rounded-b-[10px]">
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-[4px] border border-gray-300 bg-white text-xs sm:text-sm hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


