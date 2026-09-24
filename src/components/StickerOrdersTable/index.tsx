// components/StickerOrdersTable/index.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Search, RefreshCcw } from "lucide-react";

export type StickerOrder = {
  id: number;
  name?: string | null;
  workshop_id: number;
  created_at?: string | null;
  updated_at?: string | null;
  amount?: number | null;
  // cualquier otro campo que venga en so.*, lo dejamos flexible
  [key: string]: any;
  // agregado por el SELECT
  available_count: number;
};

const TABLE_FILTERS = ["Todos", "Con disponibles", "Sin disponibles"] as const;
type Filter = (typeof TABLE_FILTERS)[number];

const PER_PAGE = 8;

// Tono según cuánto queda del pack
const toneFor = (available: number, initial: number) => {
  if (!available || available <= 0) return { bar: "bg-red-500", text: "text-red-700" };
  if (initial > 0 && available / initial <= 0.2) return { bar: "bg-amber-500", text: "text-amber-800" };
  return { bar: "bg-[#0040B8]", text: "text-gray-900" };
};

export default function StickerOrdersTable({
  orders,
  loading,
  onRefresh,
}: {
  orders: StickerOrder[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const { id } = useParams();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<Filter>("Todos");
  const [page, setPage] = useState(1);

  // filtro en cliente, la búsqueda se aplica mientras se escribe
  const filtered = useMemo(() => {
    let list = orders;
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter((o) => String(o.id).includes(s) || (o.name || "").toLowerCase().includes(s));
    }
    if (statusFilter === "Con disponibles") list = list.filter((o) => (o.available_count ?? 0) > 0);
    else if (statusFilter === "Sin disponibles") list = list.filter((o) => (o.available_count ?? 0) === 0);
    return list;
  }, [orders, q, statusFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PER_PAGE;
    return filtered.slice(start, start + PER_PAGE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter]);

  const hasOrders = orders.length > 0;

  return (
    <section aria-labelledby="packs-title">
      <div className="mb-3 sm:mb-4 flex flex-col gap-1">
        <h2 id="packs-title" className="text-base sm:text-2xl font-semibold text-gray-900">
          Tus packs
          {!loading && hasOrders && <span className="ml-2 text-xl font-normal text-gray-500">{orders.length}</span>}
        </h2>
        <p className="text-sm text-gray-500">Cada pack agrupa las obleas que cargaste juntas.</p>
      </div>

      {/* Búsqueda y filtros */}
      {(loading || hasOrders) && (
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Buscar packs por nombre</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              disabled={loading}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar packs por nombre"
              className="w-full rounded-[4px] border border-gray-300 py-2.5 pl-9 pr-3 text-sm sm:text-base focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0040B8] disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </label>

          <div className="flex gap-2">
            <div role="group" aria-label="Filtrar packs" className="flex flex-1 rounded-[4px] border border-gray-300 p-0.5">
              {TABLE_FILTERS.map((f) => {
                const active = statusFilter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    disabled={loading}
                    aria-pressed={active}
                    onClick={() => setStatusFilter(f)}
                    className={`flex-1 whitespace-nowrap rounded-[3px] px-2.5 sm:px-3 py-2 text-xs sm:text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0040B8] disabled:opacity-50 ${
                      active ? "bg-[#0040B8] text-white" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={onRefresh}
              title="Refrescar"
              className="flex items-center justify-center gap-2 rounded-[4px] border border-[#0040B8] px-3 text-sm font-medium text-[#0040B8] transition-colors hover:bg-[#0040B8] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0040B8] focus-visible:ring-offset-2 disabled:opacity-50"
            >
              <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="overflow-hidden rounded-[14px] border border-gray-200 bg-white">
        {loading ? (
          <ul aria-busy="true">
            {[...Array(4)].map((_, i) => (
              <li key={i} className="flex animate-pulse flex-col gap-3 border-t border-gray-100 first:border-t-0 p-4 md:flex-row md:items-center">
                <div className="h-4 w-40 rounded bg-gray-200/80" />
                <div className="h-2 flex-1 rounded-full bg-gray-200/80" />
              </li>
            ))}
          </ul>
        ) : !hasOrders ? (
          <div className="flex flex-col items-center px-4 py-12 text-center">
            <p className="text-base font-medium text-gray-900">Todavía no cargaste obleas</p>
            <p className="mt-1 max-w-[48ch] text-sm text-gray-500">
              Cargá tu primer pack con el rango de números que recibiste para poder usarlas en las revisiones.
            </p>
            <Link
              href={`/dashboard/${id}/stickers/assign-stickers`}
              className="mt-4 inline-flex items-center rounded-[4px] bg-[#0040B8] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#003080] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0040B8] focus-visible:ring-offset-2"
            >
              Cargar pack
            </Link>
          </div>
        ) : pageItems.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm sm:text-base text-gray-600">Ningún pack coincide con la búsqueda o el filtro.</p>
            <button
              type="button"
              onClick={() => {
                setQ("");
                setStatusFilter("Todos");
              }}
              className="mt-2 text-sm font-medium text-[#0040B8] underline underline-offset-2 hover:no-underline"
            >
              Mostrar todos los packs
            </button>
          </div>
        ) : (
          <>
            {/* Encabezado de columnas, solo desktop */}
            <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,3fr)] gap-6 border-b border-gray-200 px-5 py-3 text-sm text-gray-500">
              <span>Pack</span>
              <span>Cargado</span>
              <span>Disponibles</span>
            </div>
            <ul>
              {pageItems.map((item) => {
                const created = item.created_at ? new Date(item.created_at) : null;
                const date = created ? created.toLocaleDateString("es-AR") : "-";
                const time = created
                  ? created.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
                  : "";
                const available = Number(item.available_count) || 0;
                const initial = Number(item.amount) || 0;
                const pct = initial > 0 ? Math.min(100, Math.round((available / initial) * 100)) : 0;
                const tone = toneFor(available, initial);

                return (
                  <li
                    key={item.id}
                    className="grid gap-3 border-t border-gray-100 first:border-t-0 px-4 py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,3fr)] md:items-center md:gap-6 md:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm sm:text-base font-medium text-gray-900">
                        {item.name || `Pack #${item.id}`}
                      </p>
                      <p className="text-xs text-gray-500 md:hidden">
                        Cargado el {date} {time && `a las ${time}`}
                      </p>
                    </div>

                    <div className="hidden md:block text-sm text-gray-700">
                      {date}
                      {time && <span className="block text-xs text-gray-500">{time}</span>}
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200"
                        role="meter"
                        aria-valuemin={0}
                        aria-valuemax={initial}
                        aria-valuenow={available}
                        aria-label={`Obleas disponibles del pack ${item.name || item.id}`}
                      >
                        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`w-[9.5rem] flex-shrink-0 text-right text-sm tabular-nums ${tone.text}`}>
                        {available === 0 ? (
                          "Sin disponibles"
                        ) : (
                          <>
                            <span className="font-semibold">{available.toLocaleString("es-AR")}</span>
                            <span className="text-gray-500"> de {initial.toLocaleString("es-AR")}</span>
                          </>
                        )}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Paginación */}
      {!loading && total > PER_PAGE && (
        <div className="mt-5 flex items-center justify-center gap-2 text-sm">
          <button
            className="rounded-[4px] border border-gray-300 px-3 py-2 text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </button>
          <span className="px-2 py-1 text-xs text-gray-600 sm:text-sm">
            Página {page} de {totalPages}
          </span>
          <button
            className="rounded-[4px] border border-gray-300 px-3 py-2 text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
    </section>
  );
}
