/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Paperclip, Send, Settings } from "lucide-react";
import { useUser } from "@/context/UserContext";

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

export default function TicketChatPage() {
  const params = useParams<{ id: string; ticketId: string }>();
  const router = useRouter();
  const { user } = useUser();

  const workshopId = useMemo(() => Number(params?.id), [params]);
  const ticketId = useMemo(() => Number(params?.ticketId), [params]);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    if (!workshopId || Number.isNaN(workshopId)) return;
    // Load my tickets for the sidebar
    (async () => {
      try {
        setTicketsLoading(true);
        const res = await fetch(`/api/tickets/workshop/${workshopId}`, { credentials: "include" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { tickets: SupportTicket[] };
        setTickets(data.tickets || []);
      } catch {
        setTickets([]);
      } finally {
        setTicketsLoading(false);
      }
    })();
  }, [workshopId]);

  useEffect(() => {
    if (!ticketId || Number.isNaN(ticketId)) return;
    setLoading(true);
    (async () => {
      try {
        const [ticketRes, msgsRes] = await Promise.all([
          fetch(`/api/tickets/${ticketId}`, { credentials: "include" }),
          fetch(`/api/tickets/${ticketId}/messages?limit=500`, { credentials: "include" }),
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

  // Poll every 6s for new messages
  useEffect(() => {
    if (!ticketId || Number.isNaN(ticketId)) return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/tickets/${ticketId}/messages?limit=500`, { credentials: "include" });
        if (!res.ok) return;
        const { messages } = (await res.json()) as { messages: TicketMessage[] };
        setMessages(messages || []);
      } catch {
        // ignore
      }
    }, 6000);
    return () => clearInterval(iv);
  }, [ticketId]);

  async function handleSend() {
    const value = text.trim();
    if (!value || sending) return;
    if ((currentTicket?.status || "").toLowerCase() === "resuelto") return;
    try {
      setSending(true);
      // Optimistic append
      const optimistic: TicketMessage = {
        id: Date.now(),
        ticket_id: ticketId,
        sender_user_id: String(user.id),
        sender_role: "user",
        content: value,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      setText("");
      setTimeout(scrollToBottom, 20);

      const res = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: value }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // refresh
      const msgsRes = await fetch(`/api/tickets/${ticketId}/messages?limit=500`, { credentials: "include" });
      if (msgsRes.ok) {
        const { messages } = (await msgsRes.json()) as { messages: TicketMessage[] };
        setMessages(messages || []);
        setTimeout(scrollToBottom, 50);
      }
    } catch (e) {
      // fallback: keep the text so the user can retry
    } finally {
      setSending(false);
    }
  }

  const selectedId = ticketId;

  return (
    <div className="py-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-[320px_1fr] gap-4">
        {/* Left: tickets list */}
        <aside className="bg-white rounded-[10px] border border-gray-200 h-[72vh] flex flex-col">
          <div className="px-4 py-3">
            <button
              onClick={() => router.push(`/dashboard/${workshopId}/help`)}
              className="w-full inline-flex items-center gap-2 justify-start text-sm text-[#0040B8] font-medium border border-[#0040B8] rounded-[4px] px-4 py-2 hover:bg-[#0040B8]/5 focus:outline-none focus:ring-2 focus:ring-[#0040B8]/30"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver a tus tickets
            </button>
          </div>

          <div className="overflow-auto p-3 space-y-2">
            {ticketsLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`s-${i}`}
                  className="w-full text-left rounded-[10px] border border-gray-200 px-4 py-3 flex items-center gap-3 bg-white"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
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
                    // Navegar inmediatamente y mostrar skeletons mientras se carga
                    setLoading(true);
                    setMessages([]);
                    setCurrentTicket(null);
                    router.push(`/dashboard/${workshopId}/help/${t.id}`);
                  }}
                  className={`w-full text-left rounded-[10px] border px-4 py-3 flex items-center gap-3 transition-colors ${
                    isActive
                      ? "border-[#0040B8] bg-[#0040B8]/5"
                      : isResolved
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <img src="/images/icons/msgIcon.svg" alt="" className="w-8 h-8" />
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500">Asunto:</div>
                    <div className="text-sm font-medium text-gray-900 truncate">{t.subject}</div>
                  </div>
                  {isResolved && (
                    <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                      Resuelto
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right: chat */}
        <section className="bg-white rounded-[10px] border border-gray-200 h-[72vh] flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                  <span className="text-sm font-semibold">
                    S
                  </span>
                </div>
                <span className="absolute -right-0 -bottom-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Soporte
                </div>
                <div className="text-xs text-gray-500">Online</div>
              </div>
            </div>
            {/* <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500" title="Opciones">
              <Settings className="w-4 h-4" />
            </button> */}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
            {(currentTicket?.status || "").toLowerCase() === "resuelto" && (
              <div className="px-4 py-2 rounded-[8px] border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs">
                Este ticket fue marcado como Resuelto. No podés enviar nuevos mensajes.
              </div>
            )}
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
                  // Aseguramos que el mensaje inicial del ticket (description) también aparezca
                  const desc = (currentTicket?.description || "").trim();
                  const hasInitial = Boolean(desc) && messages.some((m) => (m.content || "").trim() === desc);
                  const initial: TicketMessage | null =
                    currentTicket && desc && !hasInitial
                      ? {
                          id: -1,
                          ticket_id: currentTicket.id,
                          sender_user_id: String(currentTicket.created_by_user_id || ""),
                          sender_role: "user",
                          content: desc,
                          created_at: currentTicket.created_at || undefined,
                        }
                      : null;
                  const toRender = initial ? [initial, ...messages] : messages;

                  return toRender.map((m) => {
                    const mine =
                      (m.sender_user_id != null && String(m.sender_user_id) === String(user.id)) ||
                      ((m.sender_user_id == null || m.sender_user_id === undefined) && (m.sender_role || "") === "user");
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                            mine ? "bg-[#0040B8] text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
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
          <div className="px-4 py-3 border-t">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-[10px] px-3 py-2">
              {/* <button className="p-2 rounded-full hover:bg-gray-200/50 text-gray-500" title="Adjuntar archivo" type="button">
                <Paperclip className="w-4 h-4" />
              </button> */}
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && (currentTicket?.status || "").toLowerCase() !== "resuelto") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={(currentTicket?.status || "").toLowerCase() === "resuelto" ? "Este ticket está resuelto. Ya no se pueden enviar mensajes." : "Escribe tu mensaje aquí..."}
                disabled={(currentTicket?.status || "").toLowerCase() === "resuelto"}
                className="flex-1 bg-transparent outline-none text-sm py-1"
              />
              <button
                onClick={handleSend}
                disabled={sending || !text.trim() || (currentTicket?.status || "").toLowerCase() === "resuelto"}
                className="p-2 rounded-full text-white bg-[#0040B8] hover:bg-[#0035a0] disabled:opacity-60"
                title="Enviar"
                type="button"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


