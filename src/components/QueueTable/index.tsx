// components/QueueTable/index.tsx
"use client";
import { useEffect, useState } from "react";
import { Play, Search, SlidersHorizontal } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Application } from "@/app/types";
import TableTemplate, { TableHeader } from "@/components/TableTemplate";
import TableFilters from "../TableFilters";
import RefreshButton from "../RefreshButton";

const STATUS_TONES: Record<Application["status"], { text: string; bg: string }> = {
  Completado: { text: "text-green-700", bg: "bg-green-50" },
  "En curso": { text: "text-blue-700", bg: "bg-blue-50" },
  Pendiente: { text: "text-red-700", bg: "bg-red-50" },
  "A Inspeccionar": { text: "text-amber-700", bg: "bg-amber-50" },
  "Emitir CRT": { text: "text-violet-700", bg: "bg-violet-100" },
  "Segunda Inspección": { text: "text-amber-700", bg: "bg-amber-50" },
};
const DEFAULT_TONE = { text: "text-gray-700", bg: "bg-gray-100" };
const TABLE_FILTERS = ["Todos", "En curso", "A Inspeccionar", "Segunda Inspección", "Emitir CRT"];
export default function QueueTable() {
  const { id } = useParams();
  const router = useRouter();
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(""); // Displayed search value
  const [searchQuery, setSearchQuery] = useState(""); // Actual search query used for API
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [total, setTotal] = useState(0);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("Todos"); // Empty means all statuses

  const headers: TableHeader[] = [
    { label: "CRT" },
    { label: "Vehículo" },
    { label: "Titular" },
    { label: "Fecha de creación" },
    { label: "Estado" },
    { label: "Acciones" },
  ];

  const fetchApps = async () => {
    try {
      setLoading(true);
      const usp = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
        status_in: "A Inspeccionar,En curso,Emitir CRT,Segunda Inspección",
      });
      if (searchQuery.trim()) usp.set("q", searchQuery.trim());
      if (statusFilter === "Todos") usp.delete("status");
      else if (statusFilter) usp.set("status", statusFilter);

      const res = await fetch(
        `/api/applications/workshop/${id}/full?${usp.toString()}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Error al traer aplicaciones");
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error(err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="p-4 sm:p-6">
      {/* Search and filters section */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <input
            disabled={loading}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0040B8] disabled:cursor-not-allowed disabled:bg-gray-100 sm:px-4 sm:py-3 sm:text-base"
            placeholder="Busca revisiones por su: CRT, DNI del propietario o Dominio"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
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
          <RefreshButton loading={loading} fetchApps={fetchApps} />
        </div>
      </div>

      {/* Filter overlay */}
      {showFilters && <TableFilters tableFilters={TABLE_FILTERS} statusFilter={statusFilter} setStatusFilter={setStatusFilter} setShowFilters={setShowFilters} setPage={setPage} />}

      {/* Card con borde propio, header blanco y líneas pegadas a los bordes */}
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <TableTemplate<Application>
            headers={headers}
            items={items}
            isLoading={loading}
            emptyMessage="No hay aplicaciones para mostrar."
            rowsPerSkeleton={perPage}
            /* 2) Header blanco, 4) líneas a los bordes */
            theadClassName="bg-white"
            tableClassName="w-full border-collapse"
            renderRow={(item) => {
              const d = new Date(item.date);
              const date = d.toLocaleDateString("es-AR");
              const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
              const tone = STATUS_TONES[item.status] || DEFAULT_TONE;

              return (
                <tr key={item.application_id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-center text-sm sm:text-base font-mono">{item.application_id}</td>
                  <td className="p-3 text-center">
                    <div className="font-medium text-sm sm:text-base">{item.car?.license_plate || "-"}</div>
                    <div className="text-xs sm:text-sm text-gray-600 truncate max-w-[120px] sm:max-w-[160px] mx-auto">
                      {item.car?.brand} {item.car?.model}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="font-medium text-sm sm:text-base max-w-[120px] sm:max-w-[160px] truncate mx-auto">
                      {item.owner?.first_name || "-"} {item.owner?.last_name || ""}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">{item.owner?.dni || "-"}</div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="text-sm sm:text-base">{date}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{time}</div>
                  </td>

                  {/* 1) Pill de estado con texto y fondo del mismo tono, más claro */}
                  <td className="p-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs sm:text-sm font-medium ${tone.text} ${tone.bg}`}>
                      {item.status}
                    </span>
                  </td>

                  <td className="p-0">
                    <div className="flex justify-center items-center gap-2 sm:gap-3 h-full min-h-[48px] px-2 sm:px-3">
                      <button
                        type="button"
                        className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Abrir inspección"
                        onClick={() => router.push(`/dashboard/${id}/inspections/${item.application_id}`)}
                      >
                        <Play size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }}
            renderSkeletonRow={(cols, i) => (
              <tr key={`sk-row-${i}`} className="animate-pulse min-h-[60px]">
                <td className="p-3 text-center"><Sk className="h-4 w-8 mx-auto" /></td>
                <td className="p-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Sk className="h-4 w-16" />
                    <Sk className="h-3 w-24" />
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Sk className="h-4 w-40" />
                    <Sk className="h-3 w-24" />
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <Sk className="h-4 w-24" />
                    <Sk className="h-3 w-20" />
                  </div>
                </td>
                <td className="p-3 text-center">
                  <Sk className="h-6 w-20 rounded-full mx-auto" />
                </td>
                <td className="p-0">
                  <div className="flex justify-center items-center gap-3 h-full min-h-[48px] px-3">
                    <Sk className="h-5 w-5 rounded" />
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      </div>

      {/* Pagination and refresh button section */}
      <div className="mt-6 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
        {!loading && total > perPage && (
          <div className="flex items-center gap-2">
            <button
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <span className="hidden sm:inline">Anterior</span>
              <span className="sm:hidden">‹</span>
            </button>
            <span className="text-gray-600 px-2 py-1 bg-gray-100 rounded text-xs sm:text-sm">
              Página {page} de {totalPages}
            </span>
            <button
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">›</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200/80 rounded ${className}`} />;
}
