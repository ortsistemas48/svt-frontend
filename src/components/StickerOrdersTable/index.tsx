// components/StickerOrdersTable/index.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, Eye, RefreshCw } from "lucide-react";
import TableTemplate, { TableHeader } from "@/components/TableTemplate";
import RefreshButton from "@/components/RefreshButton";

type StickerOrder = {
  id: number;
  name?: string | null;
  workshop_id: number;
  created_at?: string | null;
  updated_at?: string | null;
  // cualquier otro campo que venga en so.*, lo dejamos flexible
  [key: string]: any;
  // agregado por el SELECT
  available_count: number;
};

const TABLE_FILTERS = ["Todos", "Con disponibles", "Sin disponibles"];

export default function StickerOrdersTable() {
  const { id } = useParams(); // workshop id desde la ruta /dashboard/[id]
  const router = useRouter();

  const [orders, setOrders] = useState<StickerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // búsqueda y paginación en cliente
  const [q, setQ] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const perPage = 6;

  const headers: TableHeader[] = [
    { label: "Nombre" },
    { label: "Creación" },
    { label: "Disponibles" },
    { label: "Cantidad Inicial" },
  ];

  const fetchOrders = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const usp = new URLSearchParams({ workshop_id: String(id) });
      const res = await fetch(
        `/api/stickers/list-orders?${usp.toString()}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "No se pudieron traer los grupos de obleas");
      }
      const data: StickerOrder[] = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setOrders([]);
      setErrorMsg(err?.message || "Error al cargar grupos de obleas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // filtro en cliente
  const filtered = useMemo(() => {
    let list = orders;

    if (searchQuery.trim()) {
      const s = searchQuery.trim().toLowerCase();
      list = list.filter((o) => {
        const byId = String(o.id).includes(s);
        const byName = (o.name || "").toLowerCase().includes(s);
        return byId || byName;
      });
    }

    if (statusFilter === "Con disponibles") {
      list = list.filter((o) => (o.available_count ?? 0) > 0);
    } else if (statusFilter === "Sin disponibles") {
      list = list.filter((o) => (o.available_count ?? 0) === 0);
    }

    return list;
  }, [orders, searchQuery, statusFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pageItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  // reseteo de página si cambian filtros o búsqueda
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const toneForAvailable = (available: number, initial?: number) => {
    if (!available || available <= 0) {
      return { text: "text-red-700", bg: "bg-red-50" };
    }

    // si tenemos cantidad inicial, usamos ratio
    if (typeof initial === "number" && initial > 0) {
      const ratio = available / initial; // ej 0.18 = pocas
      if (ratio <= 0.2) return { text: "text-yellow-800", bg: "bg-yellow-50" }; // pocas
      return { text: "text-green-700", bg: "bg-green-50" }; // muchas
    }

    // fallback por valores absolutos si no hay initial
    if (available <= 25) return { text: "text-yellow-800", bg: "bg-yellow-50" };
    return { text: "text-green-700", bg: "bg-green-50" };
  };

  return (
    <div>
      {/* Mensajes */}
      {errorMsg && (
        <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-3 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMsg}
        </div>
      )}
    
      {/* Search y filtros */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3 px-[1.5px] pt-1">
          <input
            disabled={loading}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0040B8] disabled:cursor-not-allowed disabled:bg-gray-100 sm:px-4 sm:py-3 sm:text-base"
            placeholder="Buscar grupos de obleas por nombre"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearchQuery(q);
                setPage(1);
              }
            }}
          />
          <button
            disabled={loading}
            onClick={() => {
              setSearchQuery(q);
              setPage(1);
            }}
            className="flex items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 sm:px-4 sm:py-3 sm:text-base"
          >
            <Search size={16} />
            <span className="hidden sm:inline">Buscar</span>
          </button>
          <button
            disabled={loading}
            onClick={() => {
              setShowFilters(!showFilters);
              setPage(1);
            }}
            className="bg-[#0040B8] flex items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#0040B8] hover:border-[#0040B8] disabled:opacity-50 sm:px-4 sm:py-3 sm:text-base"
          >
            <SlidersHorizontal size={16} className="text-white" />
            <span className="hidden sm:inline text-white">Filtrar</span>
          </button>
            <RefreshButton loading={loading} fetchApps={fetchOrders} />
          
        </div>
      </div>

      {/* Panel de filtros simple */}
      {showFilters && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            {TABLE_FILTERS.map((opt) => {
              const active = statusFilter === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setStatusFilter(opt)}
                  className={[
                    "rounded-full px-3 py-1 text-sm border",
                    active
                      ? "bg-[#0040B8] text-white border-[#0040B8]"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="stk-table overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <TableTemplate<StickerOrder>
              headers={headers}
              items={pageItems}
              isLoading={loading}
              emptyMessage="No hay grupos de obleas para mostrar"
              rowsPerSkeleton={perPage}
              renderRow={(item) => {
                const created = item.created_at ? new Date(item.created_at) : null;
                const date = created ? created.toLocaleDateString("es-AR") : "-";
                const time = created
                  ? created.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
                  : "-";
                const tone = toneForAvailable(item.available_count ?? 0);

                return (
                  <tr key={item.id} className="transition-colors hover:bg-gray-50">
                    <td className="p-3 text-center">
                      <div className="mx-auto max-w-[200px] truncate text-sm font-medium sm:text-base">
                        {item.name || "-"}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="text-sm sm:text-base">{date}</div>
                      <div className="text-xs text-gray-600 sm:text-sm">{time}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium sm:text-sm ${tone.text} ${tone.bg}`}
                      >
                        {item.available_count ?? 0}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium sm:text-sm text-gray-800 bg-[#f3f3f3]`}
                      >
                        {item.amount ?? 0}
                      </span>
                    </td>
                  </tr>
                );
              }}
              renderSkeletonRow={(cols, i) => (
                <tr key={`sk-row-${i}`} className="min-h-[60px] animate-pulse">
                  <td className="p-3 text-center">
                    <Sk className="mx-auto h-4 w-8" />
                  </td>
                  <td className="p-3 text-center">
                    <Sk className="mx-auto h-4 w-32" />
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Sk className="h-4 w-24" />
                      <Sk className="h-3 w-20" />
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <Sk className="mx-auto h-5 w-10 rounded-full" />
                  </td>
                  <td className="p-0">
                    <div className="flex h-full min-h-[48px] items-center justify-center gap-3 px-3">
                      <Sk className="h-5 w-5 rounded" />
                    </div>
                  </td>
                </tr>
              )}
            />
          </div>
        </div>
      </div>

      {/* Paginación y refresco */}
      <div className="mt-6 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
        {total > perPage && (
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <span className="hidden sm:inline">Anterior</span>
              <span className="sm:hidden">‹</span>
            </button>
            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 sm:text-sm">
              Página {page} de {totalPages}
            </span>
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">›</span>
            </button>
          </div>
        )}

      </div>

      {/* Estilos globales para que la tabla se vea igual que en InspectionTable */}
      <style jsx global>{`
        .stk-table thead {
          background-color: #fff !important;
        }
        .stk-table table {
          border-collapse: collapse;
          width: 100%;
        }
        .stk-table thead tr {
          border-bottom: 1px solid rgb(229 231 235);
        }
        .stk-table tbody > tr {
          border-top: 1px solid rgb(229 231 235);
        }
      `}</style>
    </div>
  );
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-gray-200/80 ${className}`} />;
}
