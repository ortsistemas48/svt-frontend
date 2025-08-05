"use client";
import { useEffect, useState } from "react";
import { Pencil, Trash2, Play, RefreshCcw } from "lucide-react";
import { useParams  } from "next/navigation";

type Application = {
  application_id: number;
  car: {
    license_plate: string;
    model: string;
    brand: string;
  } | null;
  owner: {
    first_name: string;
    last_name: string;
    dni: string;
  } | null;
  date: string;
  status: "Completado" | "En curso" | "Pendiente";
};

const statusColor: Record<Application["status"], string> = {
  Completado: "text-green-600",
  "En curso": "text-yellow-600",
  Pendiente: "text-red-500",
};

export default function InspectionsTable() {
  const [applications, setApplications] = useState<Application[]>([]);
  const { id } = useParams();
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const [searchText, setSearchText] = useState("");
  const filteredApplications = applications.filter((item) => {
    if (!item.car && !item.owner) return false;
    if (!searchText.trim()) return true; 

    const query = searchText.toLowerCase();

    const licensePlate = item.car?.license_plate?.toLowerCase() || "";
    const brand = item.car?.brand?.toLowerCase() || "";
    const model = item.car?.model?.toLowerCase() || "";

    const firstName = item.owner?.first_name?.toLowerCase() || "";
    const lastName = item.owner?.last_name?.toLowerCase() || "";
    const dni = item.owner?.dni?.toLowerCase() || "";

    return (
      licensePlate.includes(query) ||
      brand.includes(query) ||
      model.includes(query) ||
      firstName.includes(query) ||
      lastName.includes(query) ||
      dni.includes(query)
    );
  });

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  const currentData = filteredApplications.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const fetchApplications = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/applications/workshop/${id}/full`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();
      setApplications(
        data.filter((item: Application) => {
          const car = item.car;
          const owner = item.owner;

          const carFilled = car && (
            car.license_plate || car.brand || car.model
          );

          const ownerFilled = owner && (
            owner.first_name || owner.last_name || owner.dni
          );

          return carFilled || ownerFilled;
        })
      );
    } catch (err) {
      console.error("Error al traer aplicaciones", err);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div className="px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <input
          type="text"
          placeholder="Busca inspecciones por su: Dominio, Propietario u Oblea"
          className="border px-4 py-3 rounded-[4px] w-full flex-1"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setPage(1); 
          }}
        />
        <div className="flex gap-2">
          <button
            className="border border-[#0040B8] text-[#0040B8] px-4 py-3 rounded-[4px] flex items-center gap-2"
            onClick={fetchApplications}
          >
            <RefreshCcw size={16}/> Actualizar
          </button>
        </div>
      </div>

      <div className="border border-gray-300 rounded-[4px] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-regular bg-[#ffffff] text-[#00000080]">
            <tr>
              <th className="p-3 text-center">ID</th>
              <th className="p-3 text-center">Vehículo</th>
              <th className="p-3 text-center">Titular</th>
              <th className="p-3 text-center">Fecha de creación</th>
              <th className="p-3 text-center">Estado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-20 text-gray-600">
                  No se encontraron inspecciones registradas.
                </td>
              </tr>
            ) : (
              currentData.map((item) => {
                const dateObj = new Date(item.date);
                const date = dateObj.toLocaleDateString("es-AR");
                const time = dateObj.toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

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
                      <div>{date}</div>
                      <div className="text-xs">{time}</div>
                    </td>
                    <td className={`p-3 font-medium text-center ${statusColor[item.status]}`}>
                      {item.status}
                    </td>
                    <td className="p-0">
                      <div className="flex justify-center items-center gap-3 h-full min-h-[48px] px-3">
                        <Pencil size={16} className="cursor-pointer text-[#0040B8]" />
                        
                        {(item.status === "En curso" || item.status === "Pendiente") && (
                          <Play size={16} className="cursor-pointer text-[#0040B8]" />
                        )}
                        
                        <Trash2 size={16} className="cursor-pointer text-[#0040B8]" />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
          {applications.length > itemsPerPage && (
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
    </div>
  );
}
