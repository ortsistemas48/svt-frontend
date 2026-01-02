// components/InspectionTable/index.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pencil, X, Search, SlidersHorizontal, EllipsisVertical, Undo2 } from "lucide-react";
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
  Abandonado: { text: "text-gray-700", bg: "bg-gray-100" },
};
const DEFAULT_TONE = { text: "text-gray-700", bg: "bg-gray-100" };
const RESULT_TONES: Record<string, { text: string; bg: string }> = {
  Apto: { text: "text-blue-700", bg: "bg-blue-50" },
  Condicional: { text: "text-amber-700", bg: "bg-amber-50" },
  Rechazado: { text: "text-white", bg: "bg-black" },
};
const DEFAULT_RESULT_TONE = { text: "text-gray-900", bg: "bg-gray-100" };
const TABLE_FILTERS = ["Todos", "Pendiente", "En curso", "Completado", "A Inspeccionar", "Emitir CRT", "Segunda Inspección", "Abandonado"];
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

  const [revertTarget, setRevertTarget] = useState<Application | null>(null);
  const [reverting, setReverting] = useState(false);
  const [reportingAbandonment, setReportingAbandonment] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Application | null>(null);
  const detailCloseBtnRef = useRef<HTMLButtonElement | null>(null);
  const [observations, setObservations] = useState<{
    first?: string | null;
    second?: string | null;
  }>({});
  const [loadingObservations, setLoadingObservations] = useState(false);

  // Function to load observations for both inspections
  const loadObservations = async (application: Application) => {
    setLoadingObservations(true);
    setObservations({});

    try {
      // Load first inspection observations
      const firstObs = await fetchInspectionObservations(application.application_id, false);

      // Load second inspection observations if inspection_2_date exists
      let secondObs: string | null = null;
      if (application.inspection_2_date) {
        secondObs = await fetchInspectionObservations(application.application_id, true);
      }

      setObservations({
        first: firstObs,
        second: secondObs,
      });
    } catch (error) {
      console.error("Error loading observations:", error);
      // Don't block the UI if loading observations fails
    } finally {
      setLoadingObservations(false);
    }
  };

  const openDetail = (application: Application) => {
    setDetailTarget(application);
    setDetailOpen(true);
    loadObservations(application);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setTimeout(() => {
      setDetailTarget(null);
      setObservations({});
      setLoadingObservations(false);
    }, 200);
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
    if (!result) return DEFAULT_RESULT_TONE;
    return RESULT_TONES[result] || DEFAULT_RESULT_TONE;
  };

  // Function to fetch inspection observations
  const fetchInspectionObservations = async (appId: number, isSecond: boolean): Promise<string | null> => {
    try {
      // Get the inspection ID
      const inspectionRes = await fetch(
        `/api/inspections/applications/${appId}/inspection?is_second=${isSecond}`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!inspectionRes.ok) {
        return null;
      }

      const inspectionData = await inspectionRes.json();
      const inspectionId = inspectionData.inspection_id as number | null;

      if (!inspectionId) {
        return null;
      }

      // Get the inspection details
      const detailsRes = await fetch(
        `/api/inspections/inspections/${inspectionId}/details`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!detailsRes.ok) {
        return null;
      }

      const detailsData = await detailsRes.json();

      // Handle both response formats (array or object)
      if (Array.isArray(detailsData)) {
        return null;
      }

      const globalObservations = detailsData.global_observations as string | null | undefined;
      return globalObservations ?? null;
    } catch (error) {
      console.error("Error fetching inspection observations:", error);
      return null;
    }
  };

  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1375);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const headers: TableHeader[] = [
    { label: "CRT" },
    { label: isSmallScreen ? "Dominio" : "Vehículo" },
    { label: "Fecha de creación" },
    { label: "Estado" },
    { label: "Oblea" },
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

  const revertSummary = useMemo(() => {
    if (!revertTarget) return null;
    const lp = revertTarget.car?.license_plate || "-";
    const owner = `${revertTarget.owner?.first_name || "-"} ${revertTarget.owner?.last_name || ""}`.trim();
    return { lp, owner, id: revertTarget.application_id };
  }, [revertTarget]);

 

  const handleRevertToCompleted = async () => {
    if (!revertTarget) return;
    try {
      setReverting(true);
      setErrorMsg(null);

      const res = await fetch(
        `/api/applications/${revertTarget.application_id}/revert-to-completed`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "No se pudo revertir el estado de la revisión");
      }

      setSuccessMsg(`Revisión #${revertTarget.application_id} revertida a Completado`);
      setRevertTarget(null);
      await fetchApps();
    } catch (e: any) {
      setErrorMsg(e?.message || "Error revirtiendo el estado de la revisión");
    } finally {
      setReverting(false);
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  const handleReportAbandonment = async () => {
    if (!detailTarget) return;
    try {
      setReportingAbandonment(true);
      setErrorMsg(null);

      const res = await fetch(
        `/api/applications/${detailTarget.application_id}/report-abandonment`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "No se pudo reportar el abandono");
      }

      setSuccessMsg(`Revisión #${detailTarget.application_id} marcada como Abandonado`);
      closeDetail();
      await fetchApps();
    } catch (e: any) {
      setErrorMsg(e?.message || "Error reportando el abandono");
      closeDetail();
    } finally {
      setReportingAbandonment(false);
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
          <div className="relative flex-1">
            <input
              disabled={loading}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-[4px] border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0040B8] disabled:cursor-not-allowed disabled:bg-gray-100 sm:px-4 sm:py-3 sm:pr-12 sm:text-base"
              placeholder="Busca por: CRT, DNI, CUIT, Nro de Oblea, Razón Social o Dominio"
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
            className="hidden sm:flex bg-[#0040B8] items-center justify-center gap-2 rounded-[4px] border border-gray-300 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#0040B8] hover:border-[#0040B8] disabled:opacity-50 sm:px-4 sm:py-3 sm:text-base"
          >
            <SlidersHorizontal size={16} className="text-white" />
            <span className="hidden sm:inline text-white">Filtrar</span>
          </button>
          <div className="hidden sm:flex">
            <RefreshButton loading={loading} fetchApps={fetchApps} />
          </div>
        </div>
      </div>

      {showFilters && <TableFilters tableFilters={TABLE_FILTERS} statusFilter={statusFilter} setStatusFilter={setStatusFilter} setShowFilters={setShowFilters} setPage={setPage} />}

      <div className="insp-table overflow-hidden rounded-[14px] border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <TableTemplate<Application>
              headers={headers}
              items={items}
              isLoading={loading}
              emptyMessage="No hay revisiones para mostrar."
              rowsPerSkeleton={perPage}
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
                  <tr key={uniqueKey} className="transition-colors hover:bg-gray-50">
                    <td className="p-3 text-center">
                      <div className="text-sm font-medium sm:text-base">{item.application_id || "-"}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="text-sm font-medium sm:text-base">{item.car?.license_plate || "-"}</div>
                      <div className="vehicle-details mx-auto max-w-[120px] truncate text-xs text-gray-600 sm:max-w-[160px] sm:text-sm">
                        {item.car?.brand} {item.car?.model}
                      </div>
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

                    <td className="p-3 text-center">
                      <div className="text-sm font-medium sm:text-base">{item.sticker_number || "-"}</div>
                    </td>

                    <td className="p-0">
                      <div className="flex h-full min-h-[48px] items-center justify-center gap-2 px-2 sm:px-3">
                        {item.status === "Pendiente" && (
                          <button
                            type="button"
                            className="cursor-pointer rounded p-1 text-gray-600 hover:text-[#0040B8] transition-colors hover:bg-blue-50"
                            title="Editar revisión"
                            onClick={() => router.push(`/dashboard/${id}/applications/create-applications/${item.application_id}`)}
                          >
                            <Pencil size={18} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="cursor-pointer rounded p-1 text-gray-600 hover:text-[#0040B8] transition-colors hover:bg-blue-50"
                          title="Ver detalles"
                          onClick={() => openDetail(item)}
                        >
                          <EllipsisVertical size={18} />
                        </button>
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
                      <Sk className="h-4 w-24" />
                      <Sk className="h-3 w-20" />
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <Sk className="mx-auto h-6 w-20 rounded-full" />
                  </td>
                  <td className="p-3 text-center">
                    <Sk className="mx-auto h-4 w-16" />
                  </td>
                  <td className="p-0">
                    <div className="flex h-full min-h-[48px] items-center justify-center px-3">
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
            {detailTarget ? `Revisión #${detailTarget.application_id}` : "Detalle de la revisión"}
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
              {/* Acciones - Arriba del todo */}
              <section className="border-b border-gray-200 pb-6">
                <div className="flex flex-col gap-3">
                  {(detailTarget.status !== "Pendiente" && detailTarget.status !== "Completado" && detailTarget.status !== "Abandonado") && (
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#0040B8] px-4 py-2 text-sm font-medium text-white hover:bg-[#00379f] transition-colors"
                      onClick={() => {
                        router.push(`/dashboard/${id}/inspections/${detailTarget.application_id}`);
                        closeDetail();
                      }}
                    >
                      <Play size={16} />
                      Abrir revisión
                    </button>
                  )}
                  {detailTarget.status === "Segunda Inspección" && (
                    <button
                      type="button"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-[4px] border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                      onClick={() => {
                        setRevertTarget(detailTarget);
                        closeDetail();
                      }}
                    >
                      <Undo2 size={16} />
                      Revertir a Completado
                    </button>
                  )}
                  {(detailTarget.status === "Pendiente" || detailTarget.status === "A Inspeccionar" || detailTarget.status === "En curso" || detailTarget.status === "Emitir CRT") && (
                    <>
                      {detailTarget.status === "Pendiente" && (
                        <button
                          type="button"
                          className="w-full inline-flex items-center justify-center gap-2 rounded-[4px] border border-[#0040B8] bg-white px-4 py-2 text-sm font-medium text-[#0040B8] hover:bg-[#0040B8]/5 transition-colors"
                          onClick={() => {
                            router.push(`/dashboard/${id}/applications/create-applications/${detailTarget.application_id}`);
                            closeDetail();
                          }}
                        >
                          <Pencil size={16} />
                          Editar revisión
                        </button>
                      )}
                      <button
                        type="button"
                        className="w-full inline-flex items-center justify-center gap-2 rounded-[4px] border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
                        onClick={handleReportAbandonment}
                        disabled={reportingAbandonment}
                      >
                        {reportingAbandonment ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-700"></div>
                            Reportando...
                          </>
                        ) : (
                          <>
                            <X size={16} />
                            Reportar Abandono
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Información general
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <DetailRow 
                    label="Estado" 
                    value={detailTarget.status}
                    valueClassName={STATUS_TONES[detailTarget.status]?.text || DEFAULT_TONE.text}
                    bgClassName={STATUS_TONES[detailTarget.status]?.bg || DEFAULT_TONE.bg}
                  />
                  <DetailRow
                    label="Resultado (1ª)"
                    value={detailTarget.result || "-"}
                    valueClassName={getResultTone(detailTarget.result).text}
                    bgClassName={getResultTone(detailTarget.result).bg}
                  />
                  {detailTarget.result === "Condicional" && (
                    <DetailRow
                      label="Resultado (2ª)"
                      value={detailTarget.result_2 || "-"}
                      valueClassName={getResultTone(detailTarget.result_2).text}
                      bgClassName={getResultTone(detailTarget.result_2).bg}
                    />
                  )}
                  <DetailRow label="Fecha de creación" value={formatDateTime(detailTarget.date)} />
                  <DetailRow label="Oblea" value={detailTarget.sticker_number || "-"} />
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
                  <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 mb">
                    Primera Inspección
                  </h2>
                  <DetailRow label="Fecha" value={formatDateTime(detailTarget.inspection_1_date)} />
                  {loadingObservations ? (
                    <div className="rounded-[4px] border border-gray-100 bg-gray-50 px-3 py-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Observaciones</span>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#0040B8]"></div>
                        <span className="text-xs text-gray-500">Cargando observaciones...</span>
                      </div>
                    </div>
                  ) : (
                    <DetailObservationRow 
                      label="Observaciones" 
                      value={observations.first} 
                    />
                  )}
                  {detailTarget.result === "Condicional" && (
                    <>
                      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Segunda Inspección
                      </h2>
                      <DetailRow label="Fecha" value={formatDateTime(detailTarget.inspection_2_date)} />
                      {detailTarget.inspection_2_date && (
                        loadingObservations ? (
                          <div className="rounded-[4px] border border-gray-100 bg-gray-50 px-3 py-2">
                            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Observaciones</span>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-[#0040B8]"></div>
                              <span className="text-xs text-gray-500">Cargando observaciones...</span>
                            </div>
                          </div>
                        ) : (
                          <DetailObservationRow 
                            label="Observaciones" 
                            value={observations.second} 
                          />
                        )
                      )}
                    </>
                  )}
                </div>
              </section>

              {/* Oblea asignada */}
              <section className="border-t border-gray-200 pt-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  Oblea asignada
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <DetailRow label="Número de oblea" value={detailTarget.sticker_number || "-"} />
                </div>
              </section>
            </div>
          ) : (
            <p className="text-sm text-gray-600">Selecciona una revisión para ver sus datos.</p>
          )}
        </div>
      </aside>

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
                      <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Revertir a Completado</h3>
                      <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                        Esta acción cambiará el estado de la revisión de 'Segunda Inspección' a 'Completado'. La revisión deberá ser procesada nuevamente.
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
                    Confirmás revertir la revisión #{revertSummary?.id}
                    {revertSummary?.lp && revertSummary.lp !== "-" ? `, patente ${revertSummary.lp}` : ""} a estado 'Completado'?
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
                    onClick={handleRevertToCompleted}
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

      <style jsx global>{`
        .insp-table thead { background-color: #fff !important; }
        .insp-table table { border-collapse: collapse; width: 100%; }
        .insp-table thead tr { border-bottom: 1px solid rgb(229 231 235); }
        .insp-table tbody > tr { border-top: 1px solid rgb(229 231 235); }
        @media (max-width: 1374px) {
          .vehicle-details { display: none !important; }
        }
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
  bgClassName,
}: {
  label: string;
  value?: string | number | null;
  valueClassName?: string;
  bgClassName?: string;
}) {
  const hasValue = value !== undefined && value !== null && value !== "";
  const bgClass = hasValue && bgClassName ? bgClassName : "";
  const paddingClass = hasValue && bgClassName ? "px-2 py-1 rounded" : "";
  return (
    <div className="flex items-start justify-between rounded-[4px] border border-gray-100 bg-gray-50 px-3 py-2">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      <span
        className={`max-w-[60%] break-words text-right text-sm ${paddingClass} ${bgClass} ${valueClassName || "text-gray-900"}`}
      >
        {hasValue ? value : "-"}
      </span>
    </div>
  );
}

function DetailObservationRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-[4px] border border-gray-100 bg-gray-50 px-3 py-2">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      <div className="mt-2">
        {value && value.trim() ? (
          <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">{value}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">No hay observaciones registradas</p>
        )}
      </div>
    </div>
  );
}
