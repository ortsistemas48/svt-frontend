// components/QueueTable/index.tsx
"use client";
import { useEffect, useState, useMemo } from "react";
import { Play, Search, SlidersHorizontal, Undo2, X } from "lucide-react";
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
export default function QueueTable({ externalSearchQuery = "" }: { externalSearchQuery?: string }) {
  const { id } = useParams();
  const router = useRouter();
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(""); // Displayed search value
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || ""); // Actual search query used for API
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [total, setTotal] = useState(0);
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("Todos"); // Empty means all statuses

  // Revert states
  const [revertTarget, setRevertTarget] = useState<Application | null>(null);
  const [reverting, setReverting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
      if (!res.ok) throw new Error("Error al traer revisiones");
      const data = await res.json();
      // Filtrar duplicados por application_id para evitar keys duplicadas
      const uniqueItems = (data.items ?? []).reduce((acc: Application[], item: Application) => {
        if (!acc.find(existing => existing.application_id === item.application_id)) {
          acc.push(item);
        }
        return acc;
      }, []);
      setItems(uniqueItems);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error(err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRevertToPending = async () => {
    if (!revertTarget) return;
    try {
      setReverting(true);
      setErrorMsg(null);

      const res = await fetch(
        `/api/applications/${revertTarget.application_id}/revert-to-pending`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "No se pudo revertir el estado del trámite");
      }

      setSuccessMsg(`Trámite #${revertTarget.application_id} revertido a Pendiente`);
      setRevertTarget(null);
      await fetchApps();
    } catch (e: any) {
      setErrorMsg(e?.message || "Error revirtiendo el estado del trámite");
    } finally {
      setReverting(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  useEffect(() => {
    fetchApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page, searchQuery, statusFilter]);

  // Sincronizar searchQuery externo
  useEffect(() => {
    if (externalSearchQuery !== undefined && externalSearchQuery !== searchQuery) {
      setSearchQuery(externalSearchQuery);
      setQ(externalSearchQuery);
      setPage(1);
    }
  }, [externalSearchQuery]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const revertSummary = useMemo(() => {
    if (!revertTarget) return null;
    const lp = revertTarget.car?.license_plate || "-";
    const owner = `${revertTarget.owner?.first_name || "-"} ${revertTarget.owner?.last_name || ""}`.trim();
    return { lp, owner, id: revertTarget.application_id };
  }, [revertTarget]);

  return (
    <div className="p-0 sm:p-4 md:p-6">
      {errorMsg && (
        <div className="mb-3 rounded-[4px] border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-3 rounded-[4px] border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMsg}
        </div>
      )}
      {/* Search and filters section */}
      <div className="hidden sm:flex mb-4 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1">
            <input
              disabled={loading}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-[4px] border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0040B8] disabled:cursor-not-allowed disabled:bg-gray-100 sm:px-4 sm:py-3 sm:pr-12 sm:text-base"
              placeholder="Busca revisiones por su: CRT, DNI, CUIT, Razón Social o Dominio"
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
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors duration-200 disabled:opacity-50 sm:right-3"
              type="button"
            >
              <Search size={16} />
            </button>
          </div>
          <button
            disabled={loading}
            onClick={() => {
              setShowFilters(!showFilters);
              setPage(1);
            }}
            className="bg-[#0040B8] flex items-center justify-center gap-2 rounded-[4px] border border-gray-300 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#0040B8] hover:border-[#0040B8] disabled:opacity-50 sm:px-4 sm:py-3 sm:text-base"
          >
            <SlidersHorizontal size={16} className="text-white" />
            <span className="hidden sm:inline text-white">Filtrar</span>
          </button>
          <RefreshButton loading={loading} fetchApps={fetchApps} />
        </div>
      </div>

      {/* Filter overlay */}
      {showFilters && <div className="hidden sm:block"><TableFilters tableFilters={TABLE_FILTERS} statusFilter={statusFilter} setStatusFilter={setStatusFilter} setShowFilters={setShowFilters} setPage={setPage} /></div>}

      {/* Vista de cards para mobile/tablet */}
      <div className="xl:hidden space-y-3 sm:space-y-4 px-1 sm:px-0">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: perPage }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 sm:p-4 animate-pulse bg-gray-50">
                <Sk className="h-4 w-20 mb-2" />
                <Sk className="h-3 w-full mb-2" />
                <Sk className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm sm:text-base text-gray-500">
            No hay revisiones para mostrar.
          </div>
        ) : (
          items.map((item, index) => {
            const d = new Date(item.date);
            const date = d.toLocaleDateString("es-AR");
            const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
            const tone = STATUS_TONES[item.status] || DEFAULT_TONE;
            const ownerText = item.owner?.cuit ? item.owner?.razon_social : item.owner?.first_name + " " + item.owner?.last_name;
            const identityText = item.owner?.cuit ? item.owner?.cuit : item.owner?.dni;
            const uniqueKey = `${item.application_id}-${index}-${item.date}`;

            return (
              <div key={uniqueKey} className="border border-gray-200 rounded-lg p-3 sm:p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="text-xs sm:text-sm text-gray-600">CRT: <span className="font-semibold text-gray-900">{item.application_id}</span></div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${tone.text} ${tone.bg}`}>
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 text-xs sm:text-sm">
                  <div>
                    <div className="text-gray-600 mb-1">Vehículo</div>
                    <div className="font-medium">{item.car?.license_plate || "-"}</div>
                    <div className="text-gray-500">{item.car?.brand} {item.car?.model}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Titular</div>
                    <div className="font-medium">{ownerText}</div>
                    <div className="text-gray-500">{identityText || "-"}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Fecha de creación</div>
                    <div className="font-medium">{date}</div>
                    <div className="text-gray-500">{time}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#0040B8] px-4 py-2 text-xs sm:text-sm font-medium text-white hover:bg-[#00379f] transition-colors"
                    onClick={() => router.push(`/dashboard/${id}/inspections/${item.application_id}`)}
                  >
                    <Play size={14} />
                    Abrir inspección
                  </button>
                  {item.status === "A Inspeccionar" && (
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-[4px] border border-amber-300 bg-amber-50 px-4 py-2 text-xs sm:text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                      onClick={() => setRevertTarget(item)}
                    >
                      <Undo2 size={14} />
                      Revertir a Pendiente
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tabla para desktop */}
      <div className="hidden xl:block rounded-xl sm:rounded-[14px] border border-gray-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <TableTemplate<Application>
            headers={headers}
            items={items}
            isLoading={loading}
            emptyMessage="No hay revisiones para mostrar."
            rowsPerSkeleton={perPage}
            /* 2) Header blanco, 4) líneas a los bordes */
            theadClassName="bg-white"
            tableClassName="w-full border-collapse"
            renderRow={(item, index) => {
              const d = new Date(item.date);
              const date = d.toLocaleDateString("es-AR");
              const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
              const tone = STATUS_TONES[item.status] || DEFAULT_TONE;
              const ownerText = item.owner?.cuit ? item.owner?.razon_social : item.owner?.first_name + " " + item.owner?.last_name;
              const identityText = item.owner?.cuit ? item.owner?.cuit : item.owner?.dni;
              // Usar key compuesta para garantizar unicidad (application_id + índice + fecha como fallback)
              const uniqueKey = `${item.application_id}-${index}-${item.date}`;
              return (
                <tr key={uniqueKey} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-center text-sm sm:text-base">{item.application_id}</td>
                  <td className="p-3 text-center">
                    <div className="font-medium text-sm sm:text-base">{item.car?.license_plate || "-"}</div>
                    <div className="text-xs sm:text-sm text-gray-600 truncate max-w-[120px] sm:max-w-[160px] mx-auto">
                      {item.car?.brand} {item.car?.model}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="font-medium text-sm sm:text-base max-w-[120px] sm:max-w-[160px] truncate mx-auto">
                      {ownerText}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">{identityText || "-"}</div>
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
                      {item.status === "A Inspeccionar" && (
                        <button
                          type="button"
                          className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Revertir a Pendiente"
                          onClick={() => setRevertTarget(item)}
                        >
                          <Undo2 size={16} />
                        </button>
                      )}
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
      <div className="mt-4 sm:mt-6 flex flex-col items-center justify-center gap-3 text-xs sm:text-sm px-1 sm:px-0">
        {!loading && total > perPage && (
          <div className="flex items-center gap-2">
            <button
              className="px-2 sm:px-3 md:px-4 py-2 border border-gray-300 rounded-[4px] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
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
              className="px-2 sm:px-3 md:px-4 py-2 border border-gray-300 rounded-[4px] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">›</span>
            </button>
          </div>
        )}
      </div>

      {revertTarget && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={() => !reverting && setRevertTarget(null)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-2">
                      <Undo2 className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Revertir a Pendiente</h3>
                      <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                        Esta acción cambiará el estado de la revisión de 'A Inspeccionar' a 'Pendiente'. La revisión deberá ser procesada nuevamente.
                      </p>
                    </div>
                  </div>
                  <button
                    className="rounded-[4px] p-1 hover:bg-gray-100"
                    onClick={() => !reverting && setRevertTarget(null)}
                    aria-label="Cerrar"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <div className="mt-4 rounded-[4px] border border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm text-gray-700">
                    Confirmás revertir el trámite #{revertSummary?.id}
                    {revertSummary?.lp && revertSummary.lp !== "-" ? `, patente ${revertSummary.lp}` : ""} a estado 'Pendiente'?
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    className="rounded-[4px] border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    onClick={() => setRevertTarget(null)}
                    disabled={reverting}
                  >
                    Cancelar
                  </button>
                  <button
                    className="rounded-[4px] bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 disabled:opacity-60"
                    onClick={handleRevertToPending}
                    disabled={reverting}
                  >
                    {reverting ? "Revirtiendo..." : "Revertir"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200/80 rounded ${className}`} />;
}
