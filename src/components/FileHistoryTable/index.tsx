'use client';
import { ChevronRight, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

type SearchHistoryItem = {
  id: string | number;
  vehiclePlate: string;
  vehicleModel: string;
  userName: string;
  userDni: string;
  searchDate: string; // formato: "DD/MM/YYYY HH:mm hs"
  status: "Pendiente" | "Disponible" | "Cancelado";
};

// Mock data - reemplazar con datos reales cuando esté listo el backend
const MOCK_SEARCH_HISTORY: SearchHistoryItem[] = [
  {
    id: 1,
    vehiclePlate: "AB123AB",
    vehicleModel: "Fiat Cronos",
    userName: "Alejo Vaquero",
    userDni: "46971353",
    searchDate: "30/07/2025 22:20 hs",
    status: "Pendiente"
  },
  {
    id: 2,
    vehiclePlate: "CD456CD",
    vehicleModel: "Toyota Corolla",
    userName: "Alejo Isaias Vaq...",
    userDni: "12345678",
    searchDate: "29/07/2025 15:30 hs",
    status: "Disponible"
  },
  {
    id: 3,
    vehiclePlate: "EF789EF",
    vehicleModel: "Volkswagen Gol",
    userName: "María González",
    userDni: "87654321",
    searchDate: "28/07/2025 10:15 hs",
    status: "Cancelado"
  },
  {
    id: 4,
    vehiclePlate: "GH012GH",
    vehicleModel: "Ford Focus",
    userName: "Juan Pérez",
    userDni: "11223344",
    searchDate: "27/07/2025 14:45 hs",
    status: "Pendiente"
  },
  {
    id: 5,
    vehiclePlate: "IJ345IJ",
    vehicleModel: "Chevrolet Onix",
    userName: "Laura Martínez",
    userDni: "55667788",
    searchDate: "26/07/2025 09:00 hs",
    status: "Disponible"
  },
];

function getStatusConfig(status: SearchHistoryItem["status"]) {
  switch (status) {
    case "Pendiente":
      return {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        icon: Clock,
        iconColor: "text-yellow-600"
      };
    case "Disponible":
      return {
        bg: "bg-green-50",
        text: "text-green-700",
        icon: CheckCircle2,
        iconColor: "text-green-600"
      };
    case "Cancelado":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        icon: XCircle,
        iconColor: "text-red-600"
      };
    default:
      return {
        bg: "bg-gray-50",
        text: "text-gray-700",
        icon: Clock,
        iconColor: "text-gray-600"
      };
  }
}

export default function FileHistoryTable() {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(MOCK_SEARCH_HISTORY);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearHistory = () => {
    setIsClearing(true);
    // Simular delay de borrado
    setTimeout(() => {
      setSearchHistory([]);
      setIsClearing(false);
    }, 300);
  };

  const handleItemClick = (item: SearchHistoryItem) => {
    // TODO: Navegar a detalles del legajo cuando esté implementado
    console.log("Ver detalles de:", item);
  };

  return (
    <div className="max-w-full">
      <div className="bg-white rounded-[10px] border border-gray-200 px-8 py-3 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
              Historial de búsqueda
            </h3>
            <p className="text-xs text-gray-500">
              Aquí aparecen las ultimas búsquedas de legajos
            </p>
          </div>
          <button
            onClick={handleClearHistory}
            disabled={searchHistory.length === 0 || isClearing}
            className={clsx(
              "px-4 py-2 border rounded-[4px] text-sm font-medium transition-colors",
              "border-red-300 text-red-600 hover:bg-red-50",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isClearing ? "Borrando..." : "Borrar historial"}
          </button>
        </div>
      </div>

      {/* List Section - Contenedor separado */}
      <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {searchHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
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
            searchHistory.map((item) => {
              const statusConfig = getStatusConfig(item.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={item.id}
                  className="px-8 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                    {/* Vehicle/Item Identifier */}
                    <div className="flex-1 min-w-[100px]">
                      <p className="font-bold text-gray-900 text-sm mb-0.5">
                        {item.vehiclePlate}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.vehicleModel}
                      </p>
                    </div>

                    {/* User/Owner Information */}
                    <div className="flex-1 min-w-[100px]">
                      <p className="text-xs font-medium text-gray-900 mb-0.5">
                        {item.userName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.userDni}
                      </p>
                    </div>

                    {/* Date and Time */}
                    <div className="flex-1 min-w-[120px]">
                      <p className="text-xs text-gray-900">
                        {item.searchDate}
                      </p>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex-1 flex justify-center min-w-[100px]">
                      <span className={clsx(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        statusConfig.bg,
                        statusConfig.text
                      )}>
                        <StatusIcon size={14} className={statusConfig.iconColor} />
                        {item.status}
                      </span>
                    </div>

                    {/* Action Icon */}
                    <div className="flex items-center justify-end min-w-[24px]">
                      <ChevronRight size={18} className="text-[#0040B8]" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

