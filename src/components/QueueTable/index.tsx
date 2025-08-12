"use client";
import { useEffect, useState } from "react";
import { Play, RefreshCcw } from "lucide-react";
import { useParams } from "next/navigation";
import { Application } from "@/app/types";
import { filterApplications, isDataEmpty } from "@/app/utils";
import Table from "../Table";

export default function QueueTable() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true); // 👈
  const { id } = useParams();
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const [searchText, setSearchText] = useState("");

  const filteredApplications = filterApplications({ applications, searchText });
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  const actions = [{ action: "Iniciar Inspección", icon: <Play size={16} /> }];

  const currentData = filteredApplications.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const fetchApplications = async () => {
    try {
      setLoading(true); // 👈
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
      setLoading(false); // 👈
    }
  };

  useEffect(() => {
    fetchApplications();
    // si cambia el id de workshop, recarga
  }, [id]); // 👈 buena práctica

  return (
    <div className="px-4 pt-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-14 gap-3">
        <input
          type="text"
          placeholder="Busca inspecciones por su: Dominio, Propietario u Oblea"
          className="border px-4 py-3 rounded-[4px] w-full flex-1"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setPage(1);
          }}
          disabled={loading} // opcional
        />
        <div className="flex gap-2">
          <button
            className="border border-[#0040B8] text-[#0040B8] px-4 py-3 rounded-[4px] flex items-center gap-2 disabled:opacity-50"
            onClick={fetchApplications}
            disabled={loading}
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        </div>
      </div>

      {/* 👇 ahora Table decide: Skeleton si isLoading, mensaje vacío si length === 0, o datos */}
      <Table
        applications={applications}
        currentData={currentData}
        actions={actions}
        isLoading={loading}
      />

      {!loading && filteredApplications.length > itemsPerPage && (
        <div className="flex justify-center items-center mt-6 gap-2 text-sm">
          <button
            className="px-4 py-2 border rounded-[4px] disabled:opacity-50"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
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
