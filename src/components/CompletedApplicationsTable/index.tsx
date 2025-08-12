"use client";
import { useEffect, useState } from "react";
import { RefreshCcw, Eye, Download } from "lucide-react";
import TableTemplate, { TableHeader } from "@/components/TableTemplate";
import { Application } from "@/app/types";
import { filterApplications, isDataEmpty } from "@/app/utils";
import { useParams } from "next/navigation";

const statusColor: Record<string, string> = {
  Apto: "text-green-600",
  Rechazado: "text-red-500",
  Condicional: "text-yellow-600",
};

export default function CompletedApplicationsTable () {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const { id } = useParams();

  const filteredApplications = filterApplications({
    applications,
    searchText,
  });

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const currentData = filteredApplications.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/applications/workshop/${id}/completed`,
        { credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
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
    <div className="px-4 pt-10">
      {/* Barra de búsqueda y actualizar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-3">
        <input
          type="text"
          placeholder="Ingrese el dominio que desea buscar"
          className="border px-4 py-3 rounded-[4px] w-full flex-1"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setPage(1);
          }}
        />
        <button
          disabled={isLoading}
          onClick={fetchApplications}
          className="border border-[#0040B8] text-[#0040B8] px-4 py-3 rounded-[4px] flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {/* Tabla */}
      <TableTemplate
        headers={headers}
        items={currentData}
        isLoading={isLoading}
        emptyMessage="No hay aplicaciones completadas para mostrar."
        rowsPerSkeleton={itemsPerPage}
        renderRow={(item: Application) => {
          const dateObj = new Date(item.date);
          const date = dateObj.toLocaleDateString("es-AR");
          const time = dateObj.toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          });
          console.log(item);
          return (
            <tr key={item.application_id} className="border-t">
              <td className="p-3 text-center">{item.application_id}</td>

              <td className="p-3 text-center">
                <div className="font-medium">{item.car?.license_plate || "-"}</div>
                <div className="text-xs text-gray-600">
                  {item.car?.brand} {item.car?.model}
                </div>
              </td>

              <td className="p-3 text-center">
                <div className="font-medium max-w-[160px] truncate mx-auto">
                  {item.owner?.first_name || "-"} {item.owner?.last_name || ""}
                </div>
                <div className="text-xs text-gray-600">
                  {item.owner?.dni || "-"}
                </div>
              </td>

              <td className="p-3 text-center">
                {date} {time} hs
              </td>

              <td
                className={`p-3 font-medium text-center ${
                  statusColor[item.result as string] || ""
                }`}
              >
                {item.result}
              </td>

              <td className="p-0">
                <div className="flex justify-center items-center gap-3 h-full min-h-[48px] px-3">
                  <Eye className="cursor-pointer text-[#0040B8]" size={18} />
                  <Download className="cursor-pointer text-[#0040B8]" size={18} />
                </div>
              </td>
            </tr>
          );
        }}
      />

      {/* Paginación */}
      {filteredApplications.length > itemsPerPage && (
        <div className="flex justify-center items-center mt-6 gap-2 text-sm">
          <button
            className="px-4 py-2 border rounded-[4px] disabled:opacity-50"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Anterior
          </button>
          <span>Página {page} de {totalPages}</span>
          <button
            className="px-4 py-2 border rounded-[4px] disabled:opacity-50"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
