"use client";
import { useEffect, useState, useRef } from "react";
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
  Rechazado: { text: "text-red-700", bg: "bg-red-50" },
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

export default function CompletedApplicationsTable() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [q, setQ] = useState(""); // Displayed search value
  const [searchQuery, setSearchQuery] = useState(""); // Actual search query used for API
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const itemsPerPage = 5;
  const { id } = useParams();

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [resultFilter, setResultFilter] = useState<string>("Todos"); // Empty means all statuses
  
  // Dropdown menu state
  const [openDownloadDropdown, setOpenDownloadDropdown] = useState<number | null>(null);
  const [openViewDropdown, setOpenViewDropdown] = useState<number | null>(null);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);
  const viewDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target as Node)) {
        setOpenDownloadDropdown(null);
      }
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target as Node)) {
        setOpenViewDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
      setOpenDownloadDropdown(null); // Close dropdown after download
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleView = (applicationId: number, inspectionNumber: 1 | 2 = 1) => {
    const certificateName = inspectionNumber === 2 ? 'certificado_2.pdf' : 'certificado.pdf';
    const url = `https://uedevplogwlaueyuofft.supabase.co/storage/v1/object/public/certificados/certificados/${applicationId}/${certificateName}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setOpenViewDropdown(null); // Close dropdown after opening
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


  const headers: TableHeader[] = [
    { label: "CRT" },
    { label: "Vehículo" },
    { label: "Titular" },
    { label: "Fecha de creación" },
    { label: "Resultado" },
    { label: "2do Resultado" },
    { label: "Acciones" },
  ];

  return (
    <div className="p-4 sm:p-6">
      {/* Search and filters section */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <input
            disabled={isLoading}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0040B8] disabled:cursor-not-allowed disabled:bg-gray-100 sm:px-4 sm:py-3 sm:text-base"
            placeholder="Busca aplicaciones completadas por: Dominio, Propietario u Oblea"
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
            className="flex items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 sm:px-4 sm:py-3 sm:text-base"
          >
            <Search size={16} />
            <span className="hidden sm:inline">Buscar</span>
          </button>
          <button
            disabled={isLoading}
            onClick={() => {
              setShowFilters(!showFilters);
              setPage(1);
            }}
            className="bg-[#0040B8] flex items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#0040B8] hover:border-[#0040B8] disabled:opacity-50 sm:px-4 sm:py-3 sm:text-base"
          >
            <SlidersHorizontal size={16} className="text-white" />
            <span className="hidden sm:inline text-white">Filtrar</span>
          </button>
          <RefreshButton loading={isLoading} fetchApps={fetchApplications} />
        </div>
      </div>

      {/* Filter overlay */}
      {showFilters && <TableFilters tableFilters={TABLE_FILTERS} statusFilter={resultFilter} setStatusFilter={setResultFilter} setShowFilters={setShowFilters} setPage={setPage} />}

      {/* Card de tabla con borde propio */}
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
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

                  <td className="p-3 text-center text-sm sm:text-base">
                    <div>{date}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{time} hs</div>
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
                        <div className="relative" ref={openViewDropdown === item.application_id ? viewDropdownRef : null}>
                          <button
                            type="button"
                            onClick={() => setOpenViewDropdown(openViewDropdown === item.application_id ? null : item.application_id)}
                            className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
                            title="Ver certificado"
                          >
                            <Eye size={16} />
                            <ChevronDown size={12} />
                          </button>
                          
                          {openViewDropdown === item.application_id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                              <button
                                onClick={() => handleView(item.application_id, 1)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors rounded-t-lg flex items-center gap-2"
                              >
                                <Eye size={14} />
                                <span>1ra Inspección</span>
                              </button>
                              <button
                                onClick={() => handleView(item.application_id, 2)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors rounded-b-lg flex items-center gap-2 border-t border-gray-100"
                              >
                                <Eye size={14} />
                                <span>2da Inspección</span>
                              </button>
                            </div>
                          )}
                        </div>
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
                        <div className="relative" ref={openDownloadDropdown === item.application_id ? downloadDropdownRef : null}>
                          <button
                            type="button"
                            onClick={() => setOpenDownloadDropdown(openDownloadDropdown === item.application_id ? null : item.application_id)}
                            className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
                            title="Descargar certificado"
                          >
                            <Download size={16} />
                            <ChevronDown size={12} />
                          </button>
                          
                          {openDownloadDropdown === item.application_id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                              <button
                                onClick={() => handleDownload(item.application_id, 1)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors rounded-t-lg flex items-center gap-2"
                              >
                                <Download size={14} />
                                <span>1ra Inspección</span>
                              </button>
                              <button
                                onClick={() => handleDownload(item.application_id, 2)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors rounded-b-lg flex items-center gap-2 border-t border-gray-100"
                              >
                                <Download size={14} />
                                <span>2da Inspección</span>
                              </button>
                            </div>
                          )}
                        </div>
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
      <div className="mt-6 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
        {pagination && pagination.total_pages > 1 && !searchQuery && (
          <div className="flex items-center gap-2">
            <button
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
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
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
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
