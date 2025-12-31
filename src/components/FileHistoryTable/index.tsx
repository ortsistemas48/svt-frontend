'use client';
import { ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import clsx from "clsx";
import { useRouter } from "next/navigation";

type SearchHistoryItem = {
  id: string | number;
  vehiclePlate: string;
  vehicleModel: string;
  userName: string;
  userIdentity?: string;
  searchDate: string; // formato: "DD/MM/YYYY HH:mm hs"
  status: "Pendiente" | "Completado" | "En curso" | "A Inspeccionar" | "Emitir CRT" | "Abandonado";
  applicationId: number;
  result: "Apto" | "Condicional" | "Rechazado" | null;
  result_2?: "Apto" | "Condicional" | "Rechazado" | null;
};

function getResultConfig(result: SearchHistoryItem["result"] | null) {
  if (!result) {
    return { bg: "bg-gray-50", text: "text-gray-700" };
  }
  
  switch (result) {
    case "Apto":
      return { bg: "bg-blue-50", text: "text-blue-700" };
    case "Condicional":
      return { bg: "bg-amber-50", text: "text-amber-700" };
    case "Rechazado":
      return { bg: "bg-gray-100", text: "text-black" };
    default:
      return { bg: "bg-gray-50", text: "text-gray-700" };
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes} hs`;
}

export default function FileHistoryTable({ workshopId, searchQuery = "" }: { workshopId: number; searchQuery?: string }) {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 4;
  const router = useRouter();

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const usp = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
        status_in: "Completado,Abandonado", // Filtrar completadas y abandonadas en el backend
      });
      
      if (searchQuery?.trim()) {
        usp.set("q", searchQuery.trim());
        const digits = searchQuery.replace(/\D+/g, "");
        if (digits) {
          usp.set("application_id", digits);
        }
      }

      const res = await fetch(
        `/api/applications/workshop/${workshopId}/full?${usp.toString()}`,
        { credentials: "include" }
      );
      
      if (!res.ok) throw new Error("Error al traer aplicaciones");
      
      const data = await res.json();
      const items = data.items ?? [];
      
      const formattedItems: SearchHistoryItem[] = items.map((item: any) => ({
        id: item.application_id,
        applicationId: item.application_id,
        vehiclePlate: item.car?.license_plate || "-",
        vehicleModel: item.car?.model || "-",
        userName: item.owner ? item.owner.cuit ? item.owner.razon_social : item.owner.first_name + " " + item.owner.last_name : "-",
        userIdentity: item.owner?.cuit ? item.owner?.cuit : item.owner?.dni || "-",
        searchDate: formatDate(item.date),
        status: item.status,
        result: item.result_2 || item.result || null,
        result_2: item.result_2 || null
      }));
      
      setSearchHistory(formattedItems);
      // Usar el total del backend que ya está filtrado por status
      setTotalPages(Math.max(1, Math.ceil((data.total ?? 0) / perPage)));
    } catch (err) {
      console.error("Error fetching applications:", err);
      setSearchHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workshopId, page, searchQuery]);

  const handleClearHistory = () => {
    setIsClearing(true);
    setTimeout(() => {
      setSearchHistory([]);
      setIsClearing(false);
    }, 300);
  };

  const handleItemClick = (item: SearchHistoryItem) => {
    router.push(`/dashboard/${workshopId}/files/${item.applicationId}`);
  };

  return (
    <div className="max-w-full">
      <div className="bg-white rounded-lg border border-gray-200 px-3 sm:px-8 py-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
              Listado de revisiones
            </h3>
            <p className="text-sm text-gray-500">
              Aquí aparecen las ultimas revisiones
            </p>
          </div>
          {/* <button
            onClick={handleClearHistory}
            disabled={searchHistory.length === 0 || isClearing}
            className={clsx(
              "px-4 py-2 border rounded-[4px] text-sm font-medium transition-colors",
              "border-red-300 text-red-600 hover:bg-red-50",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isClearing ? "Borrando..." : "Borrar historial"}
          </button> */}
        </div>
      </div>

      {/* List Section - Contenedor separado */}
      <div className="bg-white sm:rounded-[14px] sm:border sm:border-gray-200 overflow-hidden">
        {/* Headers */}
        {!loading && searchHistory.length > 0 && (
          <div className="px-1 sm:px-8 py-2 border-b border-gray-200 hidden sm:block">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-24 min-w-[80px] text-xs font-medium text-gray-500 text-left">CRT/CNI</div>
              <div className="flex-1 min-w-[100px] text-xs font-medium text-gray-500">Vehículo</div>
              <div className="flex-1 min-w-[100px] text-xs font-medium text-gray-500">Titular</div>
              <div className="flex-1 min-w-[120px] text-xs font-medium text-gray-500">Fecha</div>
              <div className="w-40 min-w-[120px] text-xs font-medium text-gray-500 text-center">Resultado</div>
              <div className="w-6" />
            </div>
          </div>
        )}
        {loading ? (
          <div className="flex flex-col items-center justify-center px-1 sm:px-8 py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0040B8] mb-4"></div>
            <p className="text-sm text-gray-500">Cargando legajos...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {searchHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-1 sm:px-8 py-16 text-center">
                {/* Icono circular con fondo azul claro */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4">
                  <img 
                    src="/images/icons/empty-file.svg" 
                    alt="Documento vacío" 
                    className="w-14 h-14"
                    style={{ filter: 'brightness(0) saturate(100%) invert(44%) sepia(96%) saturate(1352%) hue-rotate(195deg) brightness(95%) contrast(91%)' }}
                  />
                </div>
                {/* Texto principal */}
                <p className="text-base font-semibold text-gray-900 mb-2">
                  Todavía no has realizado búsquedas
                </p>
                {/* Texto secundario */}
                <p className="text-sm text-gray-500 max-w-md">
                  Cuando busques tus primeros legajos aparecerán aquí
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View - Hidden on mobile/tablet */}
                <div className="hidden xl:block">
                  {searchHistory.map((item) => {
                    const resultConfig = getResultConfig(item.result);
                    const displayResult = item.status === "Abandonado" ? "Abandonado" : (item.result || "-");
                    const displayConfig = item.status === "Abandonado" 
                      ? { bg: "bg-gray-100", text: "text-gray-700" }
                      : resultConfig;
                    
                    return (
                      <div
                        key={item.id}
                        className="px-8 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          {/* CRT/CNI (application id) */}
                          <div className="w-24 min-w-[80px] text-sm text-gray-900">{item.applicationId}</div>

                          {/* Vehículo */}
                          <div className="flex-1 min-w-[100px]">
                            <p className="font-bold text-gray-900 text-sm mb-0.5">
                              {item.vehiclePlate}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.vehicleModel}
                            </p>
                          </div>

                          {/* Titular */}
                          <div className="flex-1 min-w-[100px]">
                            <p className="text-sm font-medium text-gray-900 mb-0.5">
                              {item.userName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {item.userIdentity || "-"}
                            </p>
                          </div>

                          {/* Fecha */}
                          <div className="flex-1 min-w-[120px]">
                            <p className="text-sm text-gray-900">
                              {item.searchDate}
                            </p>
                          </div>

                          {/* Resultado */}
                          <div className="w-40 min-w-[120px] flex justify-center">
                            <span className={clsx(
                              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium",
                              displayConfig.bg,
                              displayConfig.text
                            )}>
                              {displayResult}
                            </span>
                          </div>

                          {/* Action Icon */}
                          <div className="flex items-center justify-end min-w-[24px]">
                            <ChevronRight size={18} className="text-[#0040B8]" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile/Tablet Card View - Hidden on desktop */}
                <div className="xl:hidden">
                  <div className="px-1 sm:px-2 md:px-4 py-2 sm:py-3 space-y-3 sm:space-y-4">
                    {searchHistory.map((item) => {
                      const resultConfig = getResultConfig(item.result);
                      const displayResult = item.status === "Abandonado" ? "Abandonado" : (item.result || "-");
                      const displayConfig = item.status === "Abandonado" 
                        ? { bg: "bg-gray-100", text: "text-gray-700" }
                        : resultConfig;
                      
                      return (
                        <div
                          key={item.id}
                          className="border border-gray-200 rounded-lg p-3 sm:p-4 space-y-3 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => handleItemClick(item)}
                        >
                          {/* Header: ID y Dominio */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs sm:text-sm text-gray-500 font-medium">CRT:</span>
                                <span className="text-sm sm:text-base font-semibold text-gray-900">{item.applicationId}</span>
                              </div>
                              <p className="font-bold text-base sm:text-lg text-gray-900 mb-0.5">
                                {item.vehiclePlate}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500 truncate">
                                {item.vehicleModel}
                              </p>
                            </div>
                            <ChevronRight size={18} className="text-[#0040B8] flex-shrink-0" />
                          </div>

                          {/* Info Section */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                            <div>
                              <span className="text-xs text-gray-500 font-medium block mb-1">Razon Social</span>
                              <p className="text-sm text-gray-900 font-medium mb-0.5">
                                {item.userName}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500">
                                {item.userIdentity || "-"}
                              </p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500 font-medium block mb-1">Fecha</span>
                              <p className="text-xs sm:text-sm text-gray-900">
                                {item.searchDate}
                              </p>
                            </div>
                          </div>

                          {/* Resultado */}
                          <div className="pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 font-medium">Resultado</span>
                              <span className={clsx(
                                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs sm:text-sm font-medium",
                                displayConfig.bg,
                                displayConfig.text
                              )}>
                                {displayResult}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-1 sm:px-8 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Página {page} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={clsx(
                  "px-3 py-1 rounded border text-sm",
                  page === 1
                    ? "border-gray-300 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                )}
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className={clsx(
                  "px-3 py-1 rounded border text-sm",
                  page === totalPages
                    ? "border-gray-300 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                )}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

