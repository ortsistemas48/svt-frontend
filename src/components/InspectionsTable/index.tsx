// components/InspectionTable/index.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { Play, Pencil, Trash2, X, Search, SlidersHorizontal } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Application } from "@/app/types";
import TableTemplate, { TableHeader } from "@/components/TableTemplate";
import TableFilters from "../TableFilters";
import RefreshButton from "../RefreshButton";

const STATUS_TONES: Record<Application["status"], { text: string; bg: string }> = {
  Completado: { text: "text-green-700", bg: "bg-green-50" },
  "En curso": { text: "text-blue-700", bg: "bg-blue-50" },
  "Segunda Inspección": { text: "text-amber-700", bg: "bg-amber-50" },
  Pendiente: { text: "text-red-700", bg: "bg-red-50" },
  "A Inspeccionar": { text: "text-amber-700", bg: "bg-amber-50" },
  "Emitir CRT": { text: "text-violet-700", bg: "bg-violet-100" },
};
const DEFAULT_TONE = { text: "text-gray-700", bg: "bg-gray-100" };
const TABLE_FILTERS = ["Todos", "Pendiente", "En curso", "Completado", "A Inspeccionar", "Emitir CRT", "Segunda Inspección"];
export default function InspectionTable() {
  const { id } = useParams();
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(""); 
  const [searchQuery, setSearchQuery] = useState(""); 
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [total, setTotal] = useState(0);

  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const router = useRouter();

  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState(false);
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
      setErrorMsg("No se pudieron cargar las aplicaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const deleteSummary = useMemo(() => {
    if (!deleteTarget) return null;
    const lp = deleteTarget.car?.license_plate || "-";
    const owner = `${deleteTarget.owner?.first_name || "-"} ${deleteTarget.owner?.last_name || ""}`.trim();
    return { lp, owner, id: deleteTarget.application_id };
  }, [deleteTarget]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      setErrorMsg(null);

      const res = await fetch(
        `/api/applications/${deleteTarget.application_id}/soft-delete`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "No se pudo eliminar el trámite");
      }

      setSuccessMsg(`Trámite #${deleteTarget.application_id} eliminado`);
      setDeleteTarget(null);
      await fetchApps();
    } catch (e: any) {
      setErrorMsg(e?.message || "Error eliminando el trámite");
    } finally {
      setDeleting(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  return (
    <div className="">
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

      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3 px-[1.5px] pt-1">
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

      {showFilters && <TableFilters tableFilters={TABLE_FILTERS} statusFilter={statusFilter} setStatusFilter={setStatusFilter} setShowFilters={setShowFilters} setPage={setPage} />}

      <div className="insp-table overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <TableTemplate<Application>
              headers={headers}
              items={items}
              isLoading={loading}
              emptyMessage="No hay aplicaciones para mostrar."
              rowsPerSkeleton={perPage}
              renderRow={(item) => {
                const d = new Date(item.date);
                const date = d.toLocaleDateString("es-AR");
                const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
                const tone = STATUS_TONES[item.status] || DEFAULT_TONE;

                return (
                  <tr key={item.application_id} className="transition-colors hover:bg-gray-50">
                    <td className="p-3 text-center">
                      <div className="text-sm font-mono font-medium sm:text-base">{item.application_id || "-"}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="text-sm font-medium sm:text-base">{item.car?.license_plate || "-"}</div>
                      <div className="mx-auto max-w-[120px] truncate text-xs text-gray-600 sm:max-w-[160px] sm:text-sm">
                        {item.car?.brand} {item.car?.model}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="mx-auto max-w-[120px] truncate text-sm font-medium sm:max-w-[160px] sm:text-base">
                        {item.owner?.first_name || "-"} {item.owner?.last_name || ""}
                      </div>
                      <div className="text-xs text-gray-600 sm:text-sm">{item.owner?.dni || "-"}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="text-sm sm:text-base">{date}</div>
                      <div className="text-xs text-gray-600 sm:text-sm">{time}</div>
                    </td>

                    <td className="p-3 text-center">
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium sm:text-sm ${tone.text} ${tone.bg}`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="p-0">
                      <div className="flex h-full min-h-[48px] items-center justify-center gap-2 px-2 sm:gap-3 sm:px-3">
                        {(item.status !== "Pendiente" && item.status !== "Completado") && (
                          <button
                            type="button"
                            className="cursor-pointer rounded p-1 text-[#0040B8] transition-colors hover:bg-blue-50 hover:opacity-80"
                            title="Abrir revisión"
                            onClick={() => router.push(`/dashboard/${id}/inspections/${item.application_id}`)}
                          >
                            <Play size={16} />
                          </button>
                        )}
                        {item.status === "Pendiente" && (
                          <button
                            type="button"
                            className="cursor-pointer rounded p-1 text-[#0040B8] transition-colors hover:bg-blue-50 hover:opacity-80"
                            title="Editar revisión"
                            onClick={() => router.push(`/dashboard/${id}/applications/create-applications/${item.application_id}`)}
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }}
              renderSkeletonRow={(cols, i) => (
                <tr key={`sk-row-${i}`} className="min-h-[60px] animate-pulse">
                  <td className="p-3 text-center"><Sk className="mx-auto h-4 w-8" /></td>
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
                  <td className="p-0">
                    <div className="flex h-full min-h-[48px] items-center justify-center gap-3 px-3">
                      <Sk className="h-5 w-5 rounded" />
                      <Sk className="h-5 w-5 rounded" />
                      <Sk className="h-5 w-5 rounded" />
                    </div>
                  </td>
                </tr>
              )}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
        {!loading && total > perPage && (
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
              Página {page} de {Math.max(1, Math.ceil(total / perPage))}
            </span>
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
              onClick={() => setPage((p) => Math.min(Math.ceil(total / perPage), p + 1))}
              disabled={page >= totalPages}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">›</span>
            </button>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-red-200 bg-red-50 p-2">
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Eliminar trámite</h3>
                      <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                        Esta acción marca el trámite como eliminado, no lo borra de forma definitiva
                      </p>
                    </div>
                  </div>
                  <button
                    className="rounded-md p-1 hover:bg-gray-100"
                    onClick={() => !deleting && setDeleteTarget(null)}
                    aria-label="Cerrar"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm text-gray-700">
                    Confirmás eliminar el trámite #{deleteSummary?.id}
                    {deleteSummary?.lp && deleteSummary.lp !== "-" ? `, patente ${deleteSummary.lp}` : ""}?
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleting}
                  >
                    Cancelar
                  </button>
                  <button
                    className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .insp-table thead { background-color: #fff !important; }
        .insp-table table { border-collapse: collapse; width: 100%; }
        .insp-table thead tr { border-bottom: 1px solid rgb(229 231 235); }
        .insp-table tbody > tr { border-top: 1px solid rgb(229 231 235); }
      `}</style>
    </div>
  );
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-gray-200/80 ${className}`} />;
}
