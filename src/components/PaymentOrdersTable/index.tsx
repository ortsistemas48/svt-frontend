"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import TableTemplate, { TableHeader } from "@/components/TableTemplate";
import RefreshButton from "@/components/RefreshButton";
import clsx from "clsx";

type PaymentOrder = {
  id: number;
  workshop_id: number;
  quantity: number;
  unit_price: number;
  amount: number;
  zone: "SUR" | "CENTRO" | "NORTE";
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  created_at?: string | null;
  updated_at?: string | null;
};

const TABLE_FILTERS = ["Todas", "Pendientes", "En revisión", "Aprobadas", "Rechazadas"] as const;

export default function PaymentOrdersTable() {
  const { id } = useParams(); // workshop id desde la ruta
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // búsqueda y paginación en cliente
  const [q, setQ] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof TABLE_FILTERS)[number]>("Todas");
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const perPage = 8;

  const headers: TableHeader[] = [
    { label: "Orden" },
    { label: "Creación" },
    { label: "Zona" },
    { label: "Revisiones" },
    { label: "Unitario" },
    { label: "Total" },
    { label: "Estado" },
  ];

  const fetchOrders = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const usp = new URLSearchParams({ workshop_id: String(id) });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/orders?${usp.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "No se pudieron traer las órdenes de pago");
      }
      const data: PaymentOrder[] = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setOrders([]);
      setErrorMsg(err?.message || "Error al cargar órdenes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // filtro en cliente
  const filtered = useMemo(() => {
    let list = orders;

    if (searchQuery.trim()) {
      const s = searchQuery.trim().toLowerCase();
      list = list.filter((o) => String(o.id).includes(s));
    }

    if (statusFilter !== "Todas") {
      const map: Record<(typeof TABLE_FILTERS)[number], PaymentOrder["status"] | null> = {
        Todas: null,
        Pendientes: "PENDING",
        "En revisión": "IN_REVIEW",
        Aprobadas: "APPROVED",
        Rechazadas: "REJECTED",
      };
      const target = map[statusFilter];
      if (target) list = list.filter((o) => o.status === target);
    }

    return list;
  }, [orders, searchQuery, statusFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const pageItems = useMemo(() => {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, page, perPage]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const toneForStatus = (status: PaymentOrder["status"]) => {
    if (status === "APPROVED") return "bg-green-50 text-green-700";
    if (status === "REJECTED") return "bg-rose-50 text-rose-700";
    if (status === "IN_REVIEW") return "bg-amber-50 text-amber-800";
    return "bg-gray-100 text-gray-700";
  };

  const formatARS = (n: number) =>
    n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

  return (
    <div>
      {/* Mensajes */}
      {errorMsg && (
        <div className="mb-3 rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-3 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {successMsg}
        </div>
      )}

      {/* Search y filtros compactos, look minimal */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3 px-[1.5px] pt-1">
          <div className="relative flex-1">
            <input
              disabled={loading}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0040B8] disabled:cursor-not-allowed disabled:bg-gray-100 sm:py-3 sm:text-base"
              placeholder="Buscar por número de orden"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearchQuery(q);
                  setPage(1);
                }
              }}
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <button
            disabled={loading}
            onClick={() => {
              setShowFilters(!showFilters);
              setPage(1);
            }}
            className="bg-[#0040B8] flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#00379f] disabled:opacity-50 sm:px-4"
          >
            <SlidersHorizontal size={16} className="text-white" />
            <span className="hidden sm:inline">Filtrar</span>
          </button>

          <RefreshButton loading={loading} fetchApps={fetchOrders} />
        </div>
      </div>

      {/* Panel de filtros, estilo chips */}
      {showFilters && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            {TABLE_FILTERS.map((opt) => {
              const active = statusFilter === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setStatusFilter(opt)}
                  className={clsx(
                    "rounded-full px-3 py-1.5 text-sm border transition-colors",
                    active
                      ? "bg-[#0040B8] text-white border-[#0040B8]"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="pay-table overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[820px]">
            <TableTemplate<PaymentOrder>
              headers={headers}
              items={pageItems}
              isLoading={loading}
              emptyMessage="No hay órdenes para mostrar"
              rowsPerSkeleton={perPage}
              renderRow={(item) => {
                const created = item.created_at ? new Date(item.created_at) : null;
                const date = created ? created.toLocaleDateString("es-AR") : "-";
                const time = created
                  ? created.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
                  : "-";

                return (
                  <tr key={item.id} className="transition-colors hover:bg-gray-50">
                    <td className="p-3 text-center">
                      <div className="mx-auto w-fit rounded-md bg-gray-100 px-2 py-1 text-xs font-medium">{item.id}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="text-sm">{date}</div>
                      <div className="text-xs text-gray-600">{time}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-block rounded-full bg-[#F3F6FF] px-2 py-1 text-xs font-medium text-[#0040B8]">
                        {item.zone}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-block rounded-full bg-gray-100 px-2 py-1 text-xs font-medium">
                        {item.quantity}
                      </span>
                    </td>
                    <td className="p-3 text-center">{formatARS(item.unit_price)}</td>
                    <td className="p-3 text-center font-semibold">{formatARS(item.amount)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={clsx(
                          "inline-block rounded-full px-2 py-1 text-xs font-medium",
                          toneForStatus(item.status)
                        )}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              }}
              renderSkeletonRow={(cols, i) => (
                <tr key={`sk-row-${i}`} className="min-h-[60px] animate-pulse">
                  <td className="p-3 text-center">
                    <Sk className="mx-auto h-4 w-10" />
                  </td>
                  <td className="p-3 text-center">
                    <Sk className="mx-auto h-4 w-28" />
                  </td>
                  <td className="p-3 text-center">
                    <Sk className="mx-auto h-4 w-12" />
                  </td>
                  <td className="p-3 text-center">
                    <Sk className="mx-auto h-4 w-10" />
                  </td>
                  <td className="p-3 text-center">
                    <Sk className="mx-auto h-4 w-16" />
                  </td>
                  <td className="p-3 text-center">
                    <Sk className="mx-auto h-4 w-16" />
                  </td>
                  <td className="p-3 text-center">
                    <Sk className="mx-auto h-5 w-20 rounded-full" />
                  </td>
                </tr>
              )}
            />
          </div>
        </div>
      </div>

      {/* Paginación y refresco */}
      <div className="mt-6 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
        {total > perPage && (
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <span className="hidden sm:inline">Anterior</span>
              <span className="sm:hidden">‹</span>
            </button>
            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 sm:text-sm">
              Página {page} de {totalPages}
            </span>
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">›</span>
            </button>
          </div>
        )}
      </div>

      {/* Estilos globales para que la tabla quede limpia */}
      <style jsx global>{`
        .pay-table thead {
          background-color: #fff !important;
        }
        .pay-table table {
          border-collapse: collapse;
          width: 100%;
        }
        .pay-table thead tr {
          border-bottom: 1px solid rgb(229 231 235);
        }
        .pay-table tbody > tr {
          border-top: 1px solid rgb(229 231 235);
        }
      `}</style>
    </div>
  );
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-gray-200/80 ${className}`} />;
}
