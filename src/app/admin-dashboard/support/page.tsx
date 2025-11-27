"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, SlidersHorizontal, RefreshCw } from "lucide-react";

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

export default function AdminHelpTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  async function loadTickets() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tickets/admin?status=open`, { credentials: "include" });
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
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) => {
      const subj = (t.subject || "").toLowerCase();
      const name = (t.full_name || "").toLowerCase();
      return subj.includes(q) || name.includes(q);
    });
  }, [tickets, query]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = Math.min(startIdx + PAGE_SIZE, filtered.length);
  const visible = filtered.slice(startIdx, endIdx);

  function StatusPill({ status }: { status: SupportTicket["status"] }) {
    const color =
      status === "Pendiente"
        ? "bg-yellow-100 text-yellow-700"
        : status === "Abierto"
        ? "bg-blue-100 text-blue-700"
        : status === "Resuelto"
        ? "bg-green-100 text-green-700"
        : "bg-gray-100 text-gray-700";
    return (
      <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm font-medium ${color}`}>
        <span>{status}</span>
      </span>
    );
  }

  return (
    <div className="py-3 sm:py-6 md:py-10 max-w-5xl mx-auto px-1 sm:px-2 md:px-4 lg:px-6">
      {/* Toolbar: search + actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-2 sm:left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Busca por nombre o asunto"
            className="w-full pl-8 sm:pl-9 pr-2 sm:pr-3 py-2 sm:py-3 md:py-4 rounded-[4px] border border-gray-300 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="hidden sm:inline-flex items-center gap-2 rounded-[4px] bg-blue-700 text-white text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 md:py-4 hover:bg-blue-800"
            onClick={() => setPage(1)}
            title="Filtrar"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtrar
          </button>
          <button
            type="button"
            className="hidden sm:inline-flex items-center gap-2 rounded-[4px] border border-gray-300 text-gray-800 text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 md:py-4 hover:bg-gray-50"
            onClick={() => loadTickets()}
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* List */}
      <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
        {loading && (
          <div className="bg-white rounded-lg sm:rounded-[14px] border border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">Cargando...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-lg sm:rounded-[14px] border border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
            No hay tickets abiertos.
          </div>
        )}

        {/* Vista desktop */}
        {!loading &&
          visible.map((t) => (
            <div
              key={t.id}
              onClick={() => router.push(`/admin-dashboard/support/${t.id}`)}
              className="hidden md:flex hover:bg-gray-50 transition-colors duration-300 hover:cursor-pointer bg-white rounded-lg sm:rounded-[14px] border border-gray-200 px-4 md:px-6 py-3 md:py-4 items-center justify-between gap-3 md:gap-4 relative"
            >
              <div className="flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img src="/images/icons/msgIcon.svg" alt="Ticket" className="w-8 h-8 md:w-10 md:h-10" />
              </div>

              <div className="min-w-0 w-[30%] flex flex-col gap-1 pl-1">
                <div className="text-[10px] sm:text-xs text-gray-500 leading-none">Asunto:</div>
                <div className="text-xs sm:text-sm text-gray-900 font-medium truncate">{t.subject}</div>
              </div>

              <div className="min-w-0 w-[24%] flex flex-col gap-1">
                <div className="text-[10px] sm:text-xs text-gray-500 leading-none">Nombre:</div>
                <div className="text-xs sm:text-sm text-gray-900 truncate">{t.full_name || "-"}</div>
              </div>

              <div className="flex flex-col items-center text-center gap-1">
                <div className="text-[10px] sm:text-xs text-gray-500 leading-none">Fecha de creación:</div>
                <div className="text-xs sm:text-sm text-gray-800">{t.created_at ? new Date(t.created_at).toLocaleString() : "-"}</div>
              </div>

              <div className="flex flex-col items-center text-center gap-1">
                <StatusPill status={t.status} />
              </div>

              <button
                title="Ver"
                onClick={(e) => { e.stopPropagation(); router.push(`/admin-dashboard/support/${t.id}`); }}
                className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"
              >
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            </div>
          ))}

        {/* Vista mobile/tablet - Cards */}
        {!loading &&
          visible.map((t) => (
            <div
              key={t.id}
              onClick={() => router.push(`/admin-dashboard/support/${t.id}`)}
              className="md:hidden hover:bg-gray-50 transition-colors duration-300 hover:cursor-pointer bg-white rounded-lg border border-gray-200 p-3 sm:p-4 space-y-3 relative"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <img src="/images/icons/msgIcon.svg" alt="Ticket" className="w-8 h-8" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <div className="text-[10px] text-gray-500 leading-none mb-0.5">Asunto:</div>
                    <div className="text-xs sm:text-sm text-gray-900 font-medium break-words">{t.subject}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[10px] text-gray-500 leading-none mb-0.5">Nombre:</div>
                      <div className="text-xs text-gray-900 truncate">{t.full_name || "-"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 leading-none mb-0.5">Fecha:</div>
                      <div className="text-xs text-gray-800 truncate">{t.created_at ? new Date(t.created_at).toLocaleDateString() : "-"}</div>
                    </div>
                  </div>
                </div>

                <button
                  title="Ver"
                  onClick={(e) => { e.stopPropagation(); router.push(`/admin-dashboard/support/${t.id}`); }}
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <StatusPill status={t.status} />
                <div className="text-[10px] text-gray-500">
                  {t.created_at ? new Date(t.created_at).toLocaleTimeString() : ""}
                </div>
              </div>
            </div>
          ))}

        {/* Paginación */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 pt-2">
            <div className="text-[10px] sm:text-xs text-gray-500 text-center sm:text-left">
              Mostrando {startIdx + 1}-{endIdx} de {filtered.length}
            </div>
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-[4px] border border-gray-300 disabled:opacity-50"
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
                    className={`w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm rounded-[4px] border ${active ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700"}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-[4px] border border-gray-300 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resueltos (sección inferior) */}
      <div className="mt-8 sm:mt-12 md:mt-20 bg-white rounded-lg sm:rounded-[14px] border border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="text-xs sm:text-sm font-semibold text-gray-900">Tickets resueltos</div>
          <div className="text-[10px] sm:text-xs text-gray-500">Todos los tickets resueltos aparecerán aquí</div>
        </div>
        <button
          onClick={() => router.push("/admin-dashboard/support/resolved")}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[4px] bg-blue-700 text-white text-xs sm:text-sm font-medium px-4 sm:px-6 py-2 sm:py-3.5 hover:bg-blue-800"
        >
          Tickets resueltos
        </button>
      </div>
    </div>
  );
}

