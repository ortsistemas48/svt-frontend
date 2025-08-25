// components/QueueTable/index.tsx
"use client";
import { useEffect, useState } from "react";
import { Play, RefreshCcw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Application } from "@/app/types";
import TableTemplate, { TableHeader } from "@/components/TableTemplate";

const statusColor: Record<Application["status"], string> = {
  Completado: "text-green-600",
  "En curso": "text-blue-600",
  Pendiente: "text-red-500",
  "En Cola": "text-yellow-600",
};

export default function QueueTable() {
  const { id } = useParams();
  const router = useRouter(); 
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 5;
  const [total, setTotal] = useState(0);

  const headers: TableHeader[] = [
    { label: "Vehículo" },
    { label: "Titular" },
    { label: "Fecha de creación" },
    { label: "Estado" },
    { label: "Acciones" },
  ];

  const fetchApps = async () => {
    try {
      setLoading(true);
      const usp = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
        // sólo en cola o en curso
        status_in: "En Cola,En curso",
      });
      if (q.trim()) usp.set("q", q.trim());

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/applications/workshop/${id}/full?${usp.toString()}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Error al traer aplicaciones");
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error(err);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page, q]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="px-4 pt-10">
      {/* Búsqueda y actualizar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-3">
        <input
          type="text"
          placeholder="Busca inspecciones por su: Dominio, Propietario u Oblea"
          className="border px-4 py-3 rounded-[4px] w-full flex-1"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          disabled={loading}
        />
        <button
          className="border border-[#0040B8] text-[#0040B8] px-4 py-3 rounded-[4px] flex items-center gap-2 disabled:opacity-50"
          onClick={fetchApps}
          disabled={loading}
        >
          <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      <TableTemplate<Application>
        headers={headers}
        items={items}
        isLoading={loading}
        emptyMessage="No hay aplicaciones para mostrar."
        rowsPerSkeleton={perPage}
        renderRow={(item) => {
          const d = new Date(item.date);
          const date = d.toLocaleDateString("es-AR");
          const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
          return (
            <tr key={item.application_id} className="border-t">
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
                <div className="text-xs text-gray-600">{item.owner?.dni || "-"}</div>
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
                  <button
                    type="button"
                    className="cursor-pointer text-[#0040B8] hover:opacity-80"
                    title="Abrir inspección"
                    onClick={() => router.push(`/dashboard/${id}/inspections/${item.application_id}`)} 
                  >
                    <Play size={16} />
                  </button>
                </div>
              </td>
            </tr>
          );
        }}  
        renderSkeletonRow={(cols, i) => (
          <tr key={`sk-row-${i}`} className="border-t animate-pulse min-h-[60px]">
            <td className="p-3 text-center"><Sk className="h-4 w-8 mx-auto" /></td>
            <td className="p-3 text-center">
              <div className="flex flex-col items-center gap-1">
                <Sk className="h-4 w-16" />
                <Sk className="h-3 w-24" />
              </div>
            </td>
            <td className="p-3 text-center">
              <div className="flex flex-col items-center gap-1">
                <Sk className="h-4 w-40" />
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
              <Sk className="h-6 w-20 rounded-full mx-auto" />
            </td>
            <td className="p-0">
              <div className="flex justify-center items-center gap-3 h-full min-h-[48px] px-3">
                <Sk className="h-5 w-5 rounded" />
              </div>
            </td>
          </tr>
        )}
      />

      {!loading && total > perPage && (
        <div className="flex justify-center items-center mt-6 gap-2 text-sm">
          <button
            className="px-4 py-2 border rounded-[4px]"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </button>
          <span>Página {page} de {totalPages}</span>
          <button
            className="px-4 py-2 border rounded-[4px]"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200/80 rounded ${className}`} />;
}
