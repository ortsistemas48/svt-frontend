// components/InspectionTable/index.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pencil, Trash2, X, Search, SlidersHorizontal, EllipsisVertical } from "lucide-react";
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
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Application | null>(null);
  const detailCloseBtnRef = useRef<HTMLButtonElement | null>(null);

  const openDetail = (application: Application) => {
    setDetailTarget(application);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setTimeout(() => setDetailTarget(null), 200);
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "-";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "-";
    const date = dt.toLocaleDateString("es-AR");
    const time = dt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    return `${date} ${time}`;
  };

  const formatPersonName = (first?: string | null, last?: string | null) => {
    const parts = [first, last]
      .map((part) => (part || "").trim())
      .filter((part) => part.length > 0);
    return parts.length ? parts.join(" ") : "-";
  };

  const getResultTone = (result?: Application["result"] | null) => {
    switch (result) {
      case "Apto":
        return "text-blue-700";
      case "Condicional":
        return "text-amber-700";
      case "Rechazado":
        return "text-black";
      default:
        return "text-gray-900";
    }
  };

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
      if (!res.ok) throw new Error("Error al traer revisiones");
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error(err);
      setItems([]);
      setTotal(0);
      setErrorMsg("No se pudieron cargar las revisiones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page, searchQuery, statusFilter]);

  useEffect(() => {
    if (!detailOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [detailOpen]);

  useEffect(() => {
    if (!detailOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timeout = setTimeout(() => detailCloseBtnRef.current?.focus(), 0);
    return () => {
      clearTimeout(timeout);
      document.body.style.overflow = previousOverflow;
    };
  }, [detailOpen]);

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
        <div className="mb-3 rounded-[4px] border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-3 rounded-[4px] border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3 px-[1.5px] pt-1">
          <input
            disabled={loading}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 rounded-[4px] border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0040B8] disabled:cursor-not-allowed disabled:bg-gray-100 sm:px-4 sm:py-3 sm:text-base"
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
            className="flex items-center justify-center gap-2 rounded-[4px] border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 sm:px-4 sm:py-3 sm:text-base"
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
            className="bg-[#0040B8] flex items-center justify-center gap-2 rounded-[4px] border border-gray-300 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#0040B8] hover:border-[#0040B8] disabled:opacity-50 sm:px-4 sm:py-3 sm:text-base"
          >
            <SlidersHorizontal size={16} className="text-white" />
            <span className="hidden sm:inline text-white">Filtrar</span>
          </button>
          <RefreshButton loading={loading} fetchApps={fetchApps} />
        </div>
      </div>

      {showFilters && <TableFilters tableFilters={TABLE_FILTERS} statusFilter={statusFilter} setStatusFilter={setStatusFilter} setShowFilters={setShowFilters} setPage={setPage} />}

      <div className="insp-table overflow-hidden rounded-[10px] border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <TableTemplate<Application>
              headers={headers}
              items={items}
              isLoading={loading}
              emptyMessage="No hay revisiones para mostrar."
              rowsPerSkeleton={perPage}
              renderRow={(item) => {
                const d = new Date(item.date);
                const date = d.toLocaleDateString("es-AR");
                const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
                const tone = STATUS_TONES[item.status] || DEFAULT_TONE;
                const ownerText = item.owner?.cuit ? item.owner?.razon_social : item.owner?.first_name + " " + item.owner?.last_name;
                const identityText = item.owner?.cuit ? item.owner?.cuit : item.owner?.dni;
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
                        {ownerText}
                      </div>
                      <div className="text-xs text-gray-600 sm:text-sm">{identityText || "-"}</div>
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
                        {item.status === "Completado" && (
                          <button
                            type="button"
                            className="cursor-pointer rounded p-1 text-[#0040B8] transition-colors hover:bg-blue-50 hover:opacity-80"
                            title="Ver detalle del trámite"
                            onClick={() => openDetail(item)}
                          >
                            <EllipsisVertical size={16} />
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
              className="rounded-[4px] border border-gray-300 px-3 py-2 text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
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
              className="rounded-[4px] border border-gray-300 px-3 py-2 text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
              onClick={() => setPage((p) => Math.min(Math.ceil(total / perPage), p + 1))}
              disabled={page >= totalPages}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">›</span>
            </button>
          </div>
        )}
      </div>

      {/* Detail overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${
          detailOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeDetail}
        aria-hidden={!detailOpen}
      />

      {/* Detail drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        className={`fixed right-0 top-0 z-50 h-full w-full sm:w-[420px] bg-white shadow-2xl transform transition-transform duration-200 ${
          detailOpen ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold sm:text-lg">
            {detailTarget ? `Trámite #${detailTarget.application_id}` : "Detalle del trámite"}
          </h2>
          <button
            ref={detailCloseBtnRef}
            onClick={closeDetail}
            className="rounded p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
            aria-label="Cerrar panel"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="h-[calc(100%-56px)] overflow-y-auto p-4">
          {detailTarget ? (
            <div className="space-y-6">
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Información general
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <DetailRow label="Estado" value={detailTarget.status} />
                  <DetailRow
                    label="Resultado (1ª)"
                    value={detailTarget.result || "-"}
                    valueClassName={getResultTone(detailTarget.result)}
                  />
                  <DetailRow
                    label="Resultado (2ª)"
                    value={detailTarget.result_2 || "-"}
                    valueClassName={getResultTone(detailTarget.result_2)}
                  />
                  <DetailRow label="Fecha de creación" value={formatDateTime(detailTarget.date)} />
                  <DetailRow label="Usuario" value={detailTarget.user_name ?? "-"} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Vehículo
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <DetailRow label="Dominio" value={detailTarget.car?.license_plate || "-"} />
                  <DetailRow label="Marca" value={detailTarget.car?.brand || "-"} />
                  <DetailRow label="Modelo" value={detailTarget.car?.model || "-"} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Titular
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <DetailRow
                    label="Nombre"
                    value={formatPersonName(detailTarget.owner?.first_name, detailTarget.owner?.last_name)}
                  />
                  <DetailRow label="DNI" value={detailTarget.owner?.dni || "-"} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Conductor
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <DetailRow
                    label="Nombre"
                    value={formatPersonName(detailTarget.driver?.first_name, detailTarget.driver?.last_name)}
                  />
                  <DetailRow label="DNI" value={detailTarget.driver?.dni || "-"} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Inspecciones
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <DetailRow label="Fecha 1ª Inspección" value={formatDateTime(detailTarget.inspection_1_date)} />
                  <DetailRow label="Fecha 2ª Inspección" value={formatDateTime(detailTarget.inspection_2_date)} />
                </div>
              </section>
            </div>
          ) : (
            <p className="text-sm text-gray-600">Selecciona un trámite para ver sus datos.</p>
          )}
        </div>
      </aside>

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
                    className="rounded-[4px] p-1 hover:bg-gray-100"
                    onClick={() => !deleting && setDeleteTarget(null)}
                    aria-label="Cerrar"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                <div className="mt-4 rounded-[4px] border border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm text-gray-700">
                    Confirmás eliminar el trámite #{deleteSummary?.id}
                    {deleteSummary?.lp && deleteSummary.lp !== "-" ? `, patente ${deleteSummary.lp}` : ""}?
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    className="rounded-[4px] border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleting}
                  >
                    Cancelar
                  </button>
                  <button
                    className="rounded-[4px] bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
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

function DetailRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value?: string | number | null;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between rounded-[4px] border border-gray-100 bg-gray-50 px-3 py-2">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      <span
        className={`max-w-[60%] break-words text-right text-sm ${valueClassName || "text-gray-900"}`}
      >
        {value !== undefined && value !== null && value !== "" ? value : "-"}
      </span>
    </div>
  );
}
