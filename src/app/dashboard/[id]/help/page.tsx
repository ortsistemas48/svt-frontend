/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, PlusCircle, CheckCircle2, Clock, XCircle } from "lucide-react";

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

export default function HelpTicketsPage() {
  const params = useParams<{ id: string }>();
  const workshopId = useMemo(() => Number(params?.id), [params]);
  const router = useRouter();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  async function loadTickets() {
    if (!workshopId || Number.isNaN(workshopId)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/workshop/${workshopId}`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { tickets: SupportTicket[] };
      setTickets(data.tickets || []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workshopId]);

  useEffect(() => {
    // Reset or clamp page when tickets change
    const totalPages = Math.max(1, Math.ceil(tickets.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [tickets]);

  const totalPages = Math.max(1, Math.ceil(tickets.length / PAGE_SIZE));
  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, tickets.length);
  const visible = tickets.slice(startIdx, endIdx);

  async function handleCreateTicket(ev: React.FormEvent) {
    ev.preventDefault();
    if (!subject.trim() || !description.trim()) {
      alert("Completá asunto y descripción");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(`/api/tickets/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshop_id: workshopId,
          full_name: fullName || undefined,
          phone: phone || undefined,
          subject,
          description,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "No se pudo crear el ticket");
      }
      setOpen(false);
      setSubject("");
      setDescription("");
      setPhone("");
      setFullName("");
      await loadTickets();
    } catch (e: any) {
      alert(e?.message || "Error al crear el ticket");
    } finally {
      setSubmitting(false);
    }
  }

  function StatusPill({ status }: { status: SupportTicket["status"] }) {
    const color =
      status === "Pendiente"
        ? "bg-yellow-100 text-yellow-700"
        : status === "Abierto"
        ? "bg-blue-100 text-blue-700"
        : status === "Resuelto"
        ? "bg-green-100 text-green-700"
        : "bg-gray-100 text-gray-700";

    const Icon =
      status === "Resuelto"
        ? CheckCircle2
        : status === "Cerrado"
        ? XCircle
        : Clock;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${color}`}>
        <Icon className="w-4 h-4" />
        <span>{status}</span>
      </span>
    );
  }

  return (
    <div className="py-10 max-w-5xl mx-auto">
      <div className="bg-white rounded-[14px] border border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-md font-semibold text-gray-800">Tus tickets</div>
            <div className="text-sm text-gray-500">Aquí aparecen los tickets que has abierto recientemente</div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-[4px] bg-blue-700 text-white text-sm font-medium px-4 py-3 hover:bg-blue-800"
          >
            <PlusCircle className="w-4 h-4" />
            Abrir nuevo ticket
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading && (
          <div className="bg-white rounded-[14px] border border-gray-200 px-6 py-4 text-sm text-gray-500">Cargando...</div>
        )}

        {!loading && tickets.length === 0 && (
          <div className="bg-white rounded-[14px] border border-gray-200 px-6 py-4 text-sm text-gray-500">
            No tenés tickets creados.
          </div>
        )}

        {!loading &&
          visible.map((t) => (
          <div
            key={t.id}
            onClick={() => router.push(`/dashboard/${workshopId}/help/${t.id}`)}
            className="hover:bg-gray-50 transition-colors duration-300 hover:cursor-pointer bg-white rounded-[14px] border border-gray-200 px-6 py-4 flex items-center justify-between gap-4 relative"
          >
              <div className="flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img src="/images/icons/msgIcon.svg" alt="Ticket" className="w-10 h-10" />
              </div>

              <div className="min-w-0 w-[40%] flex flex-col gap-1 pl-1">
                <div className="text-sm text-gray-500 leading-none mb-1">Asunto:</div>
                <div className="text-sm text-gray-900 font-medium truncate">{t.subject}</div>
              </div>

              <div className="flex flex-col items-center text-center gap-1 mx-2 md:absolute md:left-1/2 md:-translate-x-1/2 md:w-[260px]">
                <div className="text-sm text-gray-500 leading-none">Fecha de creación</div>
                <div className="text-sm text-gray-800">
                  {t.created_at ? new Date(t.created_at).toLocaleString() : "-"}
                </div>
              </div>

              <div className="flex flex-col items-center text-center gap-1 mx-2 ">
                <StatusPill status={t.status} />
              </div>

              <button
                title="Ver"
                onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/${workshopId}/help/${t.id}`)}}
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}

        {/* Paginación */}
        {!loading && tickets.length > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-500">
              Mostrando {startIdx + 1}-{endIdx} de {tickets.length}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm rounded-[4px] border border-gray-300 disabled:opacity-50"
              >
                Anterior
              </button>
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const active = p === page;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 text-sm rounded-[4px] border ${
                      active ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm rounded-[4px] border border-gray-300 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => (!submitting ? setOpen(false) : null)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 right-0 w-full sm:w-[420px] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-out translate-x-0">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div className="text-base font-semibold text-[#0040B8]">Abrir ticket</div>
              <button
                onClick={() => (!submitting ? setOpen(false) : null)}
                className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-[#808080] mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-[#DEDEDE] rounded-[4px] px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Tu nombre y apellido"
                />
              </div>
              <div>
                <label className="block text-xs text-[#808080] mb-1">Teléfono (Opcional)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-[#DEDEDE] rounded-[4px] px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Ej: 11 1234 5678"
                />
              </div>
              <div>
                <label className="block text-xs text-[#808080] mb-1">Asunto</label>
                <input
                  required
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-[#DEDEDE] rounded-[4px] px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Contanos el tema del ticket"
                />
              </div>
              <div>
                <label className="block text-xs text-[#808080] mb-1">Describe tu problema...</label>
                <textarea
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-[#DEDEDE] rounded-[4px] px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  placeholder="Brindá el mayor detalle posible"
                />
              </div>
              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-[4px] bg-blue-700 text-white text-sm font-medium px-4 py-3 hover:bg-blue-800 disabled:opacity-60"
                >
                  {submitting ? "Creando..." : "Abrir nuevo ticket"}
                </button>
                <button
                  type="button"
                  onClick={() => (!submitting ? setOpen(false) : null)}
                  className="w-full rounded-[4px] border border-red-300 text-red-600 text-sm font-medium px-4 py-3 hover:bg-red-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

