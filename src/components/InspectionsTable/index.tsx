"use client";
import { useEffect, useState } from "react";
import { Pencil, Trash2, Play, RefreshCcw } from "lucide-react";
import { useParams } from "next/navigation";
import { filterApplications, isDataEmpty } from "@/app/utils";
import { Application } from "@/app/types";
import Table from "../Table";

export default function InspectionsTable() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);           // 👈 nuevo
  const { id } = useParams();
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const [searchText, setSearchText] = useState("");

  const filteredApplications = filterApplications({ applications, searchText });
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const currentData = filteredApplications.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const fetchApplications = async () => {
    try {
      setLoading(true);                                    // 👈 encender
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/applications/workshop/${id}/full`,
        { credentials: "include" }
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
      console.error("Error al traer aplicaciones", err);
      setApplications([]); // fallback
    } finally {
      setLoading(false);                                   // 👈 apagar
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actions = [
    { label: "Iniciar Inspección", action: "play", icon: <Play size={16} /> },
    { label: "Editar Inspección", action: "edit", icon: <Pencil size={16} /> },
    { label: "Eliminar Inspección", action: "delete", icon: <Trash2 size={16} /> },
  ];

  return (
    <div className="px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <input
          type="text"
          placeholder="Busca inspecciones por su: Dominio, Propietario u Oblea"
          className="border px-4 py-3 rounded-[4px] w-full flex-1"
          value={searchText}
          onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
          disabled={loading}
        />
        <div className="flex gap-2">
          <button
            className="border border-[#0040B8] text-[#0040B8] px-4 py-3 rounded-[4px] flex items-center gap-2 disabled:opacity-50"
            onClick={fetchApplications}
            disabled={loading}
          >
            <RefreshCcw size={16} /> {loading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      </div>

      <Table
        applications={applications}
        currentData={currentData}
        actions={actions.map(a => ({ action: a.action, icon: a.icon }))}
        isLoading={loading}                                 // 👈 pasar estado
      />

      {!loading && applications.length > itemsPerPage && (
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
