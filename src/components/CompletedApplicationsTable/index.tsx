"use client";
import { useEffect, useState } from "react";
import { RefreshCcw, Download } from "lucide-react";
import TableTemplate, { TableHeader } from "@/components/TableTemplate";
import { Application } from "@/app/types";
import { filterApplications, isDataEmpty } from "@/utils";
import { useParams } from "next/navigation";

/** 1) Tonos de estado, texto fuerte y fondo claro */
const STATUS_TONES: Record<string, { text: string; bg: string }> = {
  Apto: { text: "text-green-700", bg: "bg-green-50" },
  Rechazado: { text: "text-red-700", bg: "bg-red-50" },
  Condicional: { text: "text-amber-700", bg: "bg-amber-50" },
};
const DEFAULT_TONE = { text: "text-gray-700", bg: "bg-gray-100" };

export default function CompletedApplicationsTable() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const { id } = useParams();

  const filteredApplications = filterApplications({ applications, searchText });
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const currentData = filteredApplications.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/applications/workshop/${id}/completed`,
        {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }
      );
      const data = await res.json();
      setApplications(
        data.filter((item: Application) => {
          const carEmpty = isDataEmpty(item.car);
          const ownerEmpty = isDataEmpty(item.owner);
          return !(carEmpty && ownerEmpty);
        })
      );
    } catch (err) {
      console.error("Error al traer aplicaciones completadas", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const headers: TableHeader[] = [
    { label: "ID" },
    { label: "Vehículo" },
    { label: "Titular" },
    { label: "Fecha de creación" },
    { label: "Resultado" },
    { label: "Acciones" },
  ];

  return (
    <div className="p-4 sm:p-6">
      {/* 3) Barra fuera del borde de la tabla */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
        <input
          type="text"
          placeholder="Ingrese el dominio que desea buscar"
          className="border border-gray-300 px-3 sm:px-4 py-2 sm:py-3 rounded-md w-full flex-1 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setPage(1);
          }}
        />
        <button
          disabled={isLoading}
          onClick={fetchApplications}
          className="border border-[#0040B8] text-[#0040B8] px-3 sm:px-4 py-2 sm:py-3 rounded-md flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#0040B8] hover:text-white transition-colors duration-200 text-sm sm:text-base font-medium"
        >
          <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">{isLoading ? "Actualizando..." : "Actualizar"}</span>
          <span className="sm:hidden">{isLoading ? "..." : "↻"}</span>
        </button>
      </div>

      {/* Card de tabla con borde propio */}
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <TableTemplate
            headers={headers}
            items={currentData}
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

                  <td className="p-0">
                    <div className="flex justify-center items-center gap-2 sm:gap-3 h-full min-h-[48px] px-2 sm:px-3">
                      <button
                        type="button"
                        onClick={() =>
                          window.open(
                            `https://uedevplogwlaueyuofft.supabase.co/storage/v1/object/public/certificados/certificados/${item.application_id}/certificado.pdf`,
                            "_blank"
                          )
                        }
                        className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Descargar certificado"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }}
          />
        </div>
      </div>

      {/* Paginación */}
      {filteredApplications.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row justify-center items-center mt-6 gap-3 sm:gap-2 text-sm">
          <div className="flex items-center gap-2">
            <button
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
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
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">›</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
