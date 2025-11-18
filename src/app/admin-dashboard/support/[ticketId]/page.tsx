"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Send } from "lucide-react";

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

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });

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
    if (!ticketId || Number.isNaN(ticketId)) return;
    setLoading(true);
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
    <div className="py-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-[320px_1fr] gap-4">
        {/* Left: tickets list */}
        <aside className="bg-white rounded-[10px] border border-gray-200 h-[72vh] flex flex-col">
          <div className="px-4 py-3">
            <button
              onClick={() => router.push(`/admin-dashboard/help`)}
              className="w-full inline-flex items-center gap-2 justify-start text-sm text-[#0040B8] font-medium border border-[#0040B8] rounded-[4px] px-4 py-2 hover:bg-[#0040B8]/5 focus:outline-none focus:ring-2 focus:ring-[#0040B8]/30"
            >
              <ChevronLeft className="w-4 h-4" />
              Volver a tickets
            </button>
          </div>

          <div className="overflow-auto p-3 space-y-2">
            {ticketsLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div key={`s-${i}`} className="w-full text-left rounded-[10px] border border-gray-200 px-4 py-3 flex items-center gap-3 bg-white">
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}

            {!ticketsLoading && tickets.map((t) => {
              const isActive = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setLoading(true);
                    setMessages([]);
                    setCurrentTicket(null);
                    router.push(`/admin-dashboard/help/${t.id}`);
                  }}
                  className={`w-full text-left rounded-[10px] border px-4 py-3 flex items-center gap-3 transition-colors ${isActive ? "border-[#0040B8] bg-[#0040B8]/5" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                >
                  <img src="/images/icons/msgIcon.svg" alt="" className="w-8 h-8" />
                  <div className="min-w-0">
                    <div className="text-xs text-gray-500">Asunto:</div>
                    <div className="text-sm font-medium text-gray-900 truncate">{t.subject}</div>
                  </div>
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
                  <span className="text-sm font-semibold">U</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Usuario</div>
                <div className="text-xs text-gray-500">{currentTicket?.full_name || "Ticket"}</div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
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
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-[#0040B8] text-white" : "bg-gray-100 text-gray-900"}`}>
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
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Escribí tu mensaje para el usuario..."
                className="flex-1 bg-transparent outline-none text-sm py-1"
              />
              <button
                onClick={handleSend}
                disabled={sending || !text.trim()}
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


