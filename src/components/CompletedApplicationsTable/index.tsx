"use client";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Download, Eye, Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import TableTemplate, { TableHeader } from "@/components/TableTemplate";
import { Application } from "@/app/types";
import { useParams } from "next/navigation";
import { isDataEmpty } from "@/utils";
import TableFilters from "../TableFilters";
import RefreshButton from "../RefreshButton";
import Link from "next/link";

/** 1) Tonos de estado, texto fuerte y fondo claro */
const STATUS_TONES: Record<string, { text: string; bg: string }> = {
  Apto: { text: "text-green-700", bg: "bg-green-50" },
  Rechazado: { text: "text-black-700", bg: "bg-gray-200" },
  Condicional: { text: "text-amber-700", bg: "bg-amber-50" },
};
const DEFAULT_TONE = { text: "text-gray-700", bg: "bg-gray-100" };
const TABLE_FILTERS = ["Todos", "Apto", "Rechazado", "Condicional"];
interface PaginationData {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  next_page: number | null;
  prev_page: number | null;
}

interface ApiResponse {
  applications: Application[];
  pagination: PaginationData;
}

type DropdownState = {
  id: number;
  placement: "up" | "down";
  top: number;
  left: number;
};

export default function CompletedApplicationsTable({ externalSearchQuery = "" }: { externalSearchQuery?: string }) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState(""); // Displayed search value
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || ""); // Actual search query used for API
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const itemsPerPage = 5;
  const { id } = useParams();

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [resultFilter, setResultFilter] = useState<string>("Todos"); // Empty means all statuses
  
  // Dropdown menu state
  const [viewDropdownState, setViewDropdownState] = useState<DropdownState | null>(null);
  const [downloadDropdownState, setDownloadDropdownState] = useState<DropdownState | null>(null);
  const viewDropdownRef = useRef<HTMLDivElement | null>(null);
  const downloadDropdownRef = useRef<HTMLDivElement | null>(null);
  const viewTriggerRef = useRef<HTMLButtonElement | null>(null);
  const downloadTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const targetNode = event.target as Node;

      if (
        downloadDropdownState &&
        !downloadDropdownRef.current?.contains(targetNode) &&
        !downloadTriggerRef.current?.contains(targetNode)
      ) {
        setDownloadDropdownState(null);
        downloadTriggerRef.current = null;
      }

      if (
        viewDropdownState &&
        !viewDropdownRef.current?.contains(targetNode) &&
        !viewTriggerRef.current?.contains(targetNode)
      ) {
        setViewDropdownState(null);
        viewTriggerRef.current = null;
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [downloadDropdownState, viewDropdownState]);

  const handleDownload = async (applicationId: number, inspectionNumber: 1 | 2 = 1) => {
    const certificateName = inspectionNumber === 2 ? 'certificado_2.pdf' : 'certificado.pdf';
    const url = `https://uedevplogwlaueyuofft.supabase.co/storage/v1/object/public/certificados/certificados/${applicationId}/${certificateName}`;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      const fileName = inspectionNumber === 2 
        ? `certificado_2da_inspeccion_${applicationId}.pdf` 
        : `certificado_${applicationId}.pdf`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
      setDownloadDropdownState(null);
      downloadTriggerRef.current = null;
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleView = (applicationId: number, inspectionNumber: 1 | 2 = 1) => {
    const certificateName = inspectionNumber === 2 ? 'certificado_2.pdf' : 'certificado.pdf';
    const url = `https://uedevplogwlaueyuofft.supabase.co/storage/v1/object/public/certificados/certificados/${applicationId}/${certificateName}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setViewDropdownState(null);
    viewTriggerRef.current = null;
  };
  const fetchApplications = async (pageNum: number = page) => {
    try {
      setIsLoading(true);
      const usp = new URLSearchParams({
        page: String(pageNum),
        per_page: String(itemsPerPage),
      });
      if (searchQuery.trim()) usp.set("q", searchQuery.trim());
      if (resultFilter === "Todos") usp.delete("result");
      else if (resultFilter) usp.set("result", resultFilter);

      const res = await fetch(
        `/api/applications/workshop/${id}/completed?${usp.toString()}`,
        {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data: ApiResponse = await res.json();
      // Check if data and applications exist before filtering
      if (data && Array.isArray(data.applications
      )) {
        const filteredData = data.applications.filter((item: Application) => {
          const carEmpty = isDataEmpty(item.car);
          const ownerEmpty = isDataEmpty(item.owner);
          return !(carEmpty && ownerEmpty);
        });
        setApplications(filteredData);
        setPagination(data.pagination);
      } else {
        // Handle case where data.applications is undefined or not an array
        console.warn("API response doesn't contain applications array:", data);
        setApplications([]);
        setPagination(null);
      }
    } catch (err) {
      console.error("Error al traer aplicaciones completadas", err);
      setApplications([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page, searchQuery, resultFilter]);

  // Sincronizar searchQuery externo
  useEffect(() => {
    if (externalSearchQuery !== undefined && externalSearchQuery !== searchQuery) {
      setSearchQuery(externalSearchQuery);
      setQ(externalSearchQuery);
      setPage(1);
    }
  }, [externalSearchQuery]);

  const DROPDOWN_HEIGHT = 128;
  const DROPDOWN_WIDTH = 208;
  const DROPDOWN_MARGIN = 8;

  const computeDropdownState = (button: HTMLButtonElement, applicationId: number): DropdownState => {
    const rect = button.getBoundingClientRect();
    const shouldOpenUp =
      rect.bottom + DROPDOWN_HEIGHT + DROPDOWN_MARGIN > window.innerHeight;
    const placement: DropdownState["placement"] = shouldOpenUp ? "up" : "down";

    let top =
      placement === "down"
        ? rect.bottom + DROPDOWN_MARGIN
        : rect.top - DROPDOWN_HEIGHT - DROPDOWN_MARGIN;
    const minTop = DROPDOWN_MARGIN;
    const maxTop = window.innerHeight - DROPDOWN_HEIGHT - DROPDOWN_MARGIN;
    if (top < minTop) top = minTop;
    if (top > maxTop) top = maxTop;

    let left = rect.right - DROPDOWN_WIDTH;
    const minLeft = DROPDOWN_MARGIN;
    const maxLeft = window.innerWidth - DROPDOWN_WIDTH - DROPDOWN_MARGIN;
    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;

    return { id: applicationId, placement, top, left };
  };

  const toggleViewDropdown = (
    applicationId: number,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    const button = event.currentTarget;

    if (viewDropdownState?.id === applicationId) {
      setViewDropdownState(null);
      viewTriggerRef.current = null;
      return;
    }

    const nextState = computeDropdownState(button, applicationId);
    setViewDropdownState(nextState);
    viewTriggerRef.current = button;
    setDownloadDropdownState(null);
    downloadTriggerRef.current = null;
  };

  const toggleDownloadDropdown = (
    applicationId: number,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    const button = event.currentTarget;

    if (downloadDropdownState?.id === applicationId) {
      setDownloadDropdownState(null);
      downloadTriggerRef.current = null;
      return;
    }

    const nextState = computeDropdownState(button, applicationId);
    setDownloadDropdownState(nextState);
    downloadTriggerRef.current = button;
    setViewDropdownState(null);
    viewTriggerRef.current = null;
  };

  useEffect(() => {
    if (!viewDropdownState && !downloadDropdownState) return;

    const handleScrollOrResize = () => {
      setViewDropdownState(null);
      setDownloadDropdownState(null);
      viewTriggerRef.current = null;
      downloadTriggerRef.current = null;
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [viewDropdownState, downloadDropdownState]);

  useEffect(() => {
    if (!viewDropdownState) {
      viewDropdownRef.current = null;
    }
    if (!downloadDropdownState) {
      downloadDropdownRef.current = null;
    }
  }, [viewDropdownState, downloadDropdownState]);


  const headers: TableHeader[] = [
    { label: "CRT" },
    { label: "Vehículo" },
    { label: "Titular" },
    { label: "Resultado" },
    { label: "2do Resultado" },
    { label: "Acciones" },
  ];

  return (
    <div className="p-0 sm:p-4 md:p-6">
      {/* Search and filters section */}
      <div className="hidden sm:flex mb-4 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1">
            <input
              disabled={isLoading}
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
              disabled={isLoading}
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
          <div className="hidden sm:block relative">
            <button
              disabled={isLoading}
              onClick={() => {
                setShowFilters(!showFilters);
                setPage(1);
              }}
              className="flex bg-[#0040B8] items-center justify-center gap-2 rounded-[4px] border border-gray-300 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#0040B8] hover:border-[#0040B8] disabled:opacity-50 sm:px-4 sm:py-3 sm:text-base"
            >
              <SlidersHorizontal size={16} className="text-white" />
              <span className="hidden sm:inline text-white">Filtrar</span>
            </button>
            {showFilters && <TableFilters tableFilters={TABLE_FILTERS} statusFilter={resultFilter} setStatusFilter={setResultFilter} setShowFilters={setShowFilters} setPage={setPage} />}
          </div>
          <RefreshButton loading={isLoading} fetchApps={fetchApplications} />
        </div>
      </div>

      {/* Vista de tarjetas para mobile/tablet */}
      <div className="xl:hidden px-1 sm:px-0">
        {isLoading ? (
          <div className="space-y-3 sm:space-y-4">
            {[...Array(itemsPerPage)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 sm:p-4 animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-6 sm:p-8 text-center">
            <p className="text-xs sm:text-sm text-gray-500">No hay aplicaciones completadas para mostrar.</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {applications.map((item: Application) => {
              const tone = STATUS_TONES[item.result as string] || DEFAULT_TONE;
              // Si no hay nombre completo ni DNI, usar razón social y CUIT (i  gual que InspectionsTable)
              const hasNameAndDni = (item.owner?.first_name || item.owner?.last_name) && item.owner?.dni;
              console.log(item);
              const ownerText = hasNameAndDni 
                ? `${item.owner?.first_name || ""} ${item.owner?.last_name || ""}`.trim() 
                : (item.owner?.razon_social || "");
              const identityText = hasNameAndDni 
                ? (item.owner?.dni || "") 
                : (item.owner?.cuit || "");
              
              return (
                <div
                  key={item.application_id}
                  className="border border-gray-200 rounded-lg px-3 py-4 sm:p-4 space-y-3 sm:space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1">CRT</p>
                        <p className="text-sm sm:text-base font-medium text-gray-900">{item.application_id}</p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Vehículo</p>
                        <p className="text-sm sm:text-base font-medium text-gray-900">{item.car?.license_plate || "-"}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{item.car?.brand} {item.car?.model}</p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Titular</p>
                        <p className="text-sm sm:text-base font-medium text-gray-900">{ownerText || "-"}</p>
                        <p className="text-xs sm:text-sm text-gray-600">{identityText || "-"}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div>
                          <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Resultado</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs sm:text-sm font-medium ${tone.text} ${tone.bg}`}>
                            {item.result}
                          </span>
                        </div>
                        {item.result_2 && (
                          <div>
                            <p className="text-[10px] sm:text-xs text-gray-500 mb-1">2do Resultado</p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs sm:text-sm font-medium ${STATUS_TONES[item.result_2]?.text || DEFAULT_TONE.text} ${STATUS_TONES[item.result_2]?.bg || DEFAULT_TONE.bg}`}>
                              {item.result_2}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 flex-shrink-0">
                      {/* View certificate */}
                      {item.result_2 ? (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(event) => toggleViewDropdown(item.application_id, event)}
                            className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1.5 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
                            title="Ver certificado"
                          >
                            <Eye size={16} />
                            <ChevronDown size={12} />
                          </button>
                          {viewDropdownState?.id === item.application_id &&
                            createPortal(
                              <div
                                ref={(node) => {
                                  viewDropdownRef.current = node;
                                }}
                                className="z-[60] w-52 overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-lg"
                                style={{
                                  position: "fixed",
                                  top: viewDropdownState.top,
                                  left: viewDropdownState.left,
                                }}
                              >
                                <button
                                  onClick={() => handleView(item.application_id, 1)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-xs sm:text-sm transition-colors hover:bg-gray-50"
                                >
                                  <Eye size={14} />
                                  <span>1ra Inspección</span>
                                </button>
                                <button
                                  onClick={() => handleView(item.application_id, 2)}
                                  className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-2 text-xs sm:text-sm transition-colors hover:bg-gray-50"
                                >
                                  <Eye size={14} />
                                  <span>2da Inspección</span>
                                </button>
                              </div>,
                              document.body
                            )}
                        </div>
                      ) : (
                        <Link 
                          href={`https://uedevplogwlaueyuofft.supabase.co/storage/v1/object/public/certificados/certificados/${item.application_id}/certificado.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1.5 rounded hover:bg-blue-50 transition-colors"
                          title="Ver certificado"
                        >
                          <Eye size={16} />
                        </Link>
                      )}
                      
                      {/* Download certificate */}
                      {item.result_2 ? (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(event) => toggleDownloadDropdown(item.application_id, event)}
                            className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1.5 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
                            title="Descargar certificado"
                          >
                            <Download size={16} />
                            <ChevronDown size={12} />
                          </button>
                          {downloadDropdownState?.id === item.application_id &&
                            createPortal(
                              <div
                                ref={(node) => {
                                  downloadDropdownRef.current = node;
                                }}
                                className="z-[60] w-52 overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-lg"
                                style={{
                                  position: "fixed",
                                  top: downloadDropdownState.top,
                                  left: downloadDropdownState.left,
                                }}
                              >
                                <button
                                  onClick={() => handleDownload(item.application_id, 1)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-xs sm:text-sm transition-colors hover:bg-gray-50"
                                >
                                  <Download size={14} />
                                  <span>1ra Inspección</span>
                                </button>
                                <button
                                  onClick={() => handleDownload(item.application_id, 2)}
                                  className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-2 text-xs sm:text-sm transition-colors hover:bg-gray-50"
                                >
                                  <Download size={14} />
                                  <span>2da Inspección</span>
                                </button>
                              </div>,
                              document.body
                            )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDownload(item.application_id, 1)}
                          className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1.5 rounded hover:bg-blue-50 transition-colors"
                          title="Descargar certificado"
                        >
                          <Download size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vista de tabla para desktop */}
      <div className="hidden xl:block rounded-[14px] border border-gray-200 overflow-visible bg-white">
        <div className="overflow-x-auto">
          <TableTemplate
            headers={headers}
            items={applications}
            isLoading={isLoading}
            emptyMessage="No hay aplicaciones completadas para mostrar."
            rowsPerSkeleton={itemsPerPage}
            /** 2) Header blanco y 4) divisores a los bordes
             * Si tu TableTemplate acepta estas props de clase, genial.
             * Si no, ver notas abajo para el fallback.
             */
            theadClassName="bg-white"

            tableClassName="w-full border-collapse"
            renderRow={(item: Application) => {
              const dateObj = new Date(item.date);
              const date = dateObj.toLocaleDateString("es-AR");
              const time = dateObj.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
              const tone = STATUS_TONES[item.result as string] || DEFAULT_TONE;
              // Si no hay nombre completo ni DNI, usar razón social y CUIT (igual que InspectionsTable)
              const hasNameAndDni = (item.owner?.first_name || item.owner?.last_name) && item.owner?.dni;
              const ownerText = hasNameAndDni 
                ? `${item.owner?.first_name || ""} ${item.owner?.last_name || ""}`.trim() 
                : (item.owner?.razon_social || "");
              const identityText = hasNameAndDni 
                ? (item.owner?.dni || "") 
                : (item.owner?.cuit || "");
              return (
                <tr key={item.application_id} className="hover:bg-gray-50 transition-colors">
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

                  

                  {/* 1) Pill con tonos según estado */}
                  <td className="p-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs sm:text-sm font-medium ${tone.text} ${tone.bg}`}>
                      {item.result}
                    </span>
                  </td>

                  {/* 2do Resultado */}
                  <td className="p-3 text-center">
                    {item.result_2 ? (
                      <span className={`inline-block px-2 py-1 rounded-full text-xs sm:text-sm font-medium ${STATUS_TONES[item.result_2]?.text || DEFAULT_TONE.text} ${STATUS_TONES[item.result_2]?.bg || DEFAULT_TONE.bg}`}>
                        {item.result_2}
                      </span>
                    ) : (
                      <span className="text-xs sm:text-sm text-gray-400">-</span>
                    )}
                  </td>

                  <td className="p-0">
                    <div className="flex justify-center items-center gap-2 sm:gap-3 h-full min-h-[48px] px-2 sm:px-3">
                      {/* View certificate - Show dropdown if result_2 exists */}
                      {item.result_2 ? (
                        <>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(event) => toggleViewDropdown(item.application_id, event)}
                              className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
                              title="Ver certificado"
                            >
                              <Eye size={16} />
                              <ChevronDown size={12} />
                            </button>
                          </div>

                          {viewDropdownState?.id === item.application_id &&
                            createPortal(
                              <div
                                ref={(node) => {
                                  viewDropdownRef.current = node;
                                }}
                                className="z-[60] w-52 overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-lg"
                                style={{
                                  position: "fixed",
                                  top: viewDropdownState.top,
                                  left: viewDropdownState.left,
                                }}
                              >
                                <button
                                  onClick={() => handleView(item.application_id, 1)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                                >
                                  <Eye size={14} />
                                  <span>1ra Inspección</span>
                                </button>
                                <button
                                  onClick={() => handleView(item.application_id, 2)}
                                  className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                                >
                                  <Eye size={14} />
                                  <span>2da Inspección</span>
                                </button>
                              </div>,
                              document.body
                            )}
                        </>
                      ) : (
                        <Link 
                          href={`https://uedevplogwlaueyuofft.supabase.co/storage/v1/object/public/certificados/certificados/${item.application_id}/certificado.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Ver certificado"
                        >
                          <Eye size={16} />
                        </Link>
                      )}
                      
                      {/* Download certificate - Show dropdown if result_2 exists */}
                      {item.result_2 ? (
                        <>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(event) => toggleDownloadDropdown(item.application_id, event)}
                              className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
                              title="Descargar certificado"
                            >
                              <Download size={16} />
                              <ChevronDown size={12} />
                            </button>
                          </div>

                          {downloadDropdownState?.id === item.application_id &&
                            createPortal(
                              <div
                                ref={(node) => {
                                  downloadDropdownRef.current = node;
                                }}
                                className="z-[60] w-52 overflow-hidden rounded-[14px] border border-gray-200 bg-white shadow-lg"
                                style={{
                                  position: "fixed",
                                  top: downloadDropdownState.top,
                                  left: downloadDropdownState.left,
                                }}
                              >
                                <button
                                  onClick={() => handleDownload(item.application_id, 1)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                                >
                                  <Download size={14} />
                                  <span>1ra Inspección</span>
                                </button>
                                <button
                                  onClick={() => handleDownload(item.application_id, 2)}
                                  className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-2 text-sm transition-colors hover:bg-gray-50"
                                >
                                  <Download size={14} />
                                  <span>2da Inspección</span>
                                </button>
                              </div>,
                              document.body
                            )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDownload(item.application_id, 1)}
                          className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Descargar certificado"
                        >
                          <Download size={16} />
                        </button>
                      )}
                    </div>
                    
                  </td>
                </tr>
              );
            }}
          />
        </div>
      </div>

      {/* Pagination and refresh button section */}
      <div className="mt-4 sm:mt-6 flex flex-col items-center justify-between gap-3 text-xs sm:text-sm px-1 sm:px-0">
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center gap-2">
            <button
              className="px-2 sm:px-3 md:px-4 py-2 border border-gray-300 rounded-[4px] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
              onClick={() => {
                const newPage = page - 1;
                setPage(newPage);
                fetchApplications(newPage);
              }}
              disabled={!pagination.has_prev}
            >
              <span className="hidden sm:inline">Anterior</span>
              <span className="sm:hidden">‹</span>
            </button>
            <span className="text-gray-600 px-2 py-1 bg-gray-100 rounded text-xs sm:text-sm">
              Página {pagination.page} de {pagination.total_pages}
            </span>
            <button
              className="px-2 sm:px-3 md:px-4 py-2 border border-gray-300 rounded-[4px] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
              onClick={() => {
                const newPage = page + 1;
                setPage(newPage);
                fetchApplications(newPage);
              }}
              disabled={!pagination.has_next}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">›</span>
            </button>
          </div>
        )}

        {/* Refresh button */}
      </div>
    </div>
  );
}
