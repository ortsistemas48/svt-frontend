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
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${color}`}>
        <span>{status}</span>
      </span>
    );
  }

  return (
    <div className="py-10 max-w-5xl mx-auto">
      {/* Toolbar: search + actions */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Busca por nombre o asunto"
            className="w-full pl-9 pr-3 py-4 rounded-[4px] border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-[4px] bg-blue-700 text-white text-sm px-4 py-4 hover:bg-blue-800"
          onClick={() => setPage(1)}
          title="Filtrar"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtrar
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-[4px] border border-gray-300 text-gray-800 text-sm px-4 py-4 hover:bg-gray-50"
          onClick={() => loadTickets()}
          title="Actualizar"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* List */}
      <div className="mt-4 space-y-3">
        {loading && (
          <div className="bg-white rounded-[14px] border border-gray-200 px-6 py-4 text-sm text-gray-500">Cargando...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-[14px] border border-gray-200 px-6 py-4 text-sm text-gray-500">
            No hay tickets abiertos.
          </div>
        )}

        {!loading &&
          visible.map((t) => (
            <div
              key={t.id}
              onClick={() => router.push(`/admin-dashboard/support/${t.id}`)}
              className="hover:bg-gray-50 transition-colors duration-300 hover:cursor-pointer bg-white rounded-[14px] border border-gray-200 px-6 py-4 flex items-center justify-between gap-4 relative"
            >
              <div className="flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img src="/images/icons/msgIcon.svg" alt="Ticket" className="w-10 h-10" />
              </div>

              <div className="min-w-0 w-[30%] flex flex-col gap-1 pl-1">
                <div className="text-xs text-gray-500 leading-none">Asunto:</div>
                <div className="text-sm text-gray-900 font-medium truncate">{t.subject}</div>
              </div>

              <div className="min-w-0 w-[24%] flex flex-col gap-1">
                <div className="text-xs text-gray-500 leading-none">Nombre:</div>
                <div className="text-sm text-gray-900 truncate">{t.full_name || "-"}</div>
              </div>

              <div className="flex flex-col items-center text-center gap-1">
                <div className="text-xs text-gray-500 leading-none">Fecha de creación:</div>
                <div className="text-sm text-gray-800">{t.created_at ? new Date(t.created_at).toLocaleString() : "-"}</div>
              </div>

              <div className="flex flex-col items-center text-center gap-1 ">
                <StatusPill status={t.status} />
              </div>

              <button
                title="Ver"
                onClick={(e) => { e.stopPropagation(); router.push(`/admin-dashboard/support/${t.id}`); }}
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-gray-500"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}

        {/* Paginación */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-gray-500">
              Mostrando {startIdx + 1}-{endIdx} de {filtered.length}
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
                    className={`w-8 h-8 text-sm rounded-[4px] border ${active ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 text-gray-700"}`}
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

      {/* Resueltos (sección inferior) */}
      <div className="mt-20 bg-white rounded-[14px] border border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">Tickets resueltos</div>
          <div className="text-xs text-gray-500">Todos los tickets resueltos aparecerán aquí</div>
        </div>
        <button
          onClick={() => router.push("/admin-dashboard/support/resolved")}
          className="inline-flex items-center gap-2 rounded-[4px] bg-blue-700 text-white text-sm font-medium px-6 py-3.5 hover:bg-blue-800"
        >
          Tickets resueltos
        </button>
      </div>
    </div>
  );
}

