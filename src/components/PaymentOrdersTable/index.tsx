"use client";

import { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from "react";
import { useParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Upload } from "lucide-react";
import TableTemplate, { TableHeader } from "@/components/TableTemplate";
import RefreshButton from "@/components/RefreshButton";
import PaymentDropzone from "@/components/PaymentDropzone";
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
  receipt_url?: string | null;
  receipt_uploaded_at?: string | null;
};

const TABLE_FILTERS = ["Todas", "Pendiente de pago", "Pendiente de acreditación", "Aprobado", "Rechazado"] as const;

export type PaymentOrdersTableRef = {
  refresh: () => Promise<void>;
};

const PaymentOrdersTable = forwardRef<PaymentOrdersTableRef>((props, ref) => {
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

  // Estados para subir comprobante
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const headers: TableHeader[] = [
    { label: "Orden" },
    { label: "Creación" },
    { label: "Zona" },
    { label: "Revisiones" },
    { label: "Unitario" },
    { label: "Total" },
    { label: "Estado" },
    { label: "Acciones" },
  ];

  const fetchOrders = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const usp = new URLSearchParams({ workshop_id: String(id) });
      const res = await fetch(`/api/payments/orders?${usp.toString()}`, {
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

  useImperativeHandle(ref, () => ({
    refresh: fetchOrders,
  }));

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
        "Pendiente de pago": "PENDING",
        "Pendiente de acreditación": "IN_REVIEW",
        "Aprobado": "APPROVED",
        "Rechazado": "REJECTED",
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

  const translateStatus = (status: PaymentOrder["status"]) => {
    const translations: Record<PaymentOrder["status"], string> = {
      PENDING: "Pendiente de pago",
      IN_REVIEW: "Pendiente de acreditación",
      APPROVED: "Aprobado",
      REJECTED: "Rechazado",
    };
    return translations[status] || status;
  };

  const formatARS = (n: number) =>
    n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

  // Una orden se considera vencida si pasaron más de 10 días desde su creación
  const isExpired = (order: PaymentOrder) => {
    if (!order.created_at) return false;
    const created = new Date(order.created_at).getTime();
    if (Number.isNaN(created)) return false;
    const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
    return Date.now() - created > TEN_DAYS_MS;
  };

  const openUploadModal = (order: PaymentOrder) => {
    setSelectedOrder(order);
    setPendingFile(null);
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setSelectedOrder(null);
    setPendingFile(null);
  };

  const handleUploadReceipt = async () => {
    if (!selectedOrder || !pendingFile) return;

    try {
      setUploading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const fd = new FormData();
      fd.append("file", pendingFile);

      const res = await fetch(`/api/payment_receipts/orders/${selectedOrder.id}/receipt`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      if (!res.ok) {
        if (res.status === 413) throw new Error("El archivo excede 15MB, subí un comprobante más liviano");
        if (res.status === 415) throw new Error("Formato inválido. Permitidos: JPG, PNG, WEBP o PDF");
        const t = await res.text().catch(() => "");
        throw new Error(t || "No se pudo subir el comprobante");
      }

      setSuccessMsg("Comprobante subido correctamente. La orden está pendiente de acreditación.");
      closeUploadModal();
      fetchOrders(); // Refrescar la tabla
    } catch (err: any) {
      setErrorMsg(err?.message || "Error al subir el comprobante");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {/* Mensajes */}
      {errorMsg && (
        <div className="mb-3 rounded-[4px] border border-rose-300 bg-rose-50 px-3 py-2 text-xs sm:text-sm text-rose-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-3 rounded-[4px] border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs sm:text-sm text-emerald-700">
          {successMsg}
        </div>
      )}

      {/* Search y filtros compactos, look minimal */}
      <div className="hidden sm:flex mb-4 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3 px-[1.5px] pt-1">
          <div className="relative flex-1">
            <input
              disabled={loading}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-[4px] border border-gray-300 pl-9 pr-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0040B8] disabled:cursor-not-allowed disabled:bg-gray-100 sm:py-3 sm:text-base"
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
            className="bg-[#0040B8] flex items-center justify-center gap-2 rounded-[4px] px-3 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#00379f] disabled:opacity-50 sm:px-4"
          >
            <SlidersHorizontal size={16} className="text-white" />
            <span className="hidden sm:inline">Filtrar</span>
          </button>

          <RefreshButton loading={loading} fetchApps={fetchOrders} />
        </div>
      </div>

      {/* Panel de filtros, estilo chips */}
      {showFilters && (
        <div className="hidden sm:block mb-4 rounded-xl border border-gray-200 bg-white p-3 sm:p-4">
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

      {/* Vista de cards para mobile/tablet */}
      <div className="xl:hidden space-y-3 sm:space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: perPage }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 sm:p-4 animate-pulse bg-gray-50">
                <Sk className="h-4 w-20 mb-2" />
                <Sk className="h-3 w-full mb-2" />
                <Sk className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : pageItems.length === 0 ? (
          <div className="p-8 text-center text-sm sm:text-base text-gray-500">
            No hay órdenes para mostrar
          </div>
        ) : (
          pageItems.map((item) => {
            const created = item.created_at ? new Date(item.created_at) : null;
            const date = created ? created.toLocaleDateString("es-AR") : "-";
            const time = created
              ? created.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })
              : "-";

            return (
              <div key={item.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <div className="rounded-[4px] bg-gray-100 px-2 py-1 text-xs font-medium">
                    Orden #{item.id}
                  </div>
                  <span className="inline-block rounded-full bg-[#F3F6FF] px-2 py-1 text-xs font-medium text-[#0040B8]">
                    {item.zone}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <div className="text-gray-600 mb-1">Creación</div>
                    <div className="font-medium">{date}</div>
                    <div className="text-gray-500">{time}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Revisiones</div>
                    <div className="font-medium">{item.quantity.toLocaleString("es-AR")}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Unitario</div>
                    <div className="font-medium">{formatARS(item.unit_price)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-1">Total</div>
                    <div className="font-semibold text-[#0040B8]">{formatARS(item.amount)}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs sm:text-sm text-gray-600">Estado</div>
                    {item.status === "PENDING" && isExpired(item) ? (
                      <span className="inline-block rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
                        Vencido
                      </span>
                    ) : (
                      <span
                        className={clsx(
                          "inline-block rounded-full px-2 py-1 text-xs font-medium",
                          toneForStatus(item.status)
                        )}
                      >
                        {translateStatus(item.status)}
                      </span>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm text-gray-600">Acciones</div>
                  {item.status === "PENDING" && !item.receipt_url && !isExpired(item) ? (
                    <button
                      onClick={() => openUploadModal(item)}
                      className="mt-1 w-full inline-flex items-center justify-center gap-1 rounded-[4px] border border-[#0040B8] bg-[#0040B8] px-3 py-2 text-xs text-white hover:bg-[#00379f]"
                    >
                      Subir comprobante
                    </button>
                  ) : item.status === "PENDING" && !item.receipt_url && isExpired(item) ? (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-rose-700">
                      Vencido
                    </span>
                  ) : item.receipt_url ? (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-green-600">
                      <span>✓</span> Comprobante subido
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Tabla para desktop */}
      <div className="hidden xl:block pay-table overflow-hidden rounded-xl sm:rounded-2xl border border-gray-200 bg-white shadow-sm">
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
                      <div className="mx-auto w-fit rounded-[4px] bg-gray-100 px-2 py-1 text-xs font-medium">{item.id}</div>
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
                      {item.status === "PENDING" && isExpired(item) ? (
                        <span className="inline-block rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
                          Vencido
                        </span>
                      ) : (
                        <span
                          className={clsx(
                            "inline-block rounded-full px-2 py-1 text-xs font-medium",
                            toneForStatus(item.status)
                          )}
                        >
                          {translateStatus(item.status)}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {item.status === "PENDING" && !item.receipt_url && !isExpired(item) ? (
                        <button
                          onClick={() => openUploadModal(item)}
                          className="inline-flex items-center gap-1 rounded-[4px] border border-[#0040B8] bg-[#0040B8] px-3 py-1.5 text-xs text-white hover:bg-[#00379f]"
                        >
                          Subir comprobante
                        </button>
                      ) : item.status === "PENDING" && !item.receipt_url && isExpired(item) ? (
                        <span className="inline-flex items-center gap-1 text-xs text-rose-700">
                          Vencido
                        </span>
                      ) : item.receipt_url ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <span>✓</span> Comprobante subido
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
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
                  <td className="p-3 text-center">
                    <Sk className="mx-auto h-6 w-24 rounded" />
                  </td>
                </tr>
              )}
            />
          </div>
        </div>
      </div>

      {/* Paginación y refresco */}
      <div className="mt-4 sm:mt-6 flex flex-col items-center justify-center gap-3 text-xs sm:text-sm px-1 sm:px-0">
        {total > perPage && (
          <div className="flex items-center gap-2">
            <button
              className="rounded-[4px] border border-gray-300 px-2 sm:px-3 py-2 text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
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
              className="rounded-[4px] border border-gray-300 px-2 sm:px-3 py-2 text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">›</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal para subir comprobante */}
      {showUploadModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-[90vw] sm:max-w-lg max-h-[calc(100vh-2rem)] overflow-hidden rounded-xl sm:rounded-2xl border border-gray-200 bg-white shadow-xl my-4 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b p-3 sm:p-4 flex-shrink-0">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold">
                Subir comprobante - Orden #{selectedOrder.id}
              </h3>
              <button
                className="rounded-full border p-1 hover:bg-gray-50"
                onClick={closeUploadModal}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-3 sm:p-4 md:p-5 overflow-y-auto flex-1">
              <section className="rounded-[4px] border bg-white/60 p-3 sm:p-4">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">
                  Seleccioná el comprobante de pago
                </h4>
                <PaymentDropzone
                  onPendingChange={(files) => setPendingFile(files[0] || null)}
                  title="Comprobante, imagen o PDF"
                />
              </section>
            </div>

            {/* Footer */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 border-t bg-white p-3 sm:p-4 flex-shrink-0">
              <button
                onClick={closeUploadModal}
                disabled={uploading}
                className="rounded-[4px] border px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 w-full sm:w-auto"
                type="button"
              >
                Cancelar
              </button>
              <button
                onClick={handleUploadReceipt}
                disabled={uploading || !pendingFile}
                className={clsx(
                  "rounded-[4px] px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm text-white w-full sm:w-auto",
                  uploading || !pendingFile
                    ? "bg-[#0040B8]/60 cursor-not-allowed"
                    : "bg-[#0040B8] hover:bg-[#00379f]"
                )}
                type="button"
              >
                {uploading ? "Subiendo..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

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
});

PaymentOrdersTable.displayName = "PaymentOrdersTable";

export default PaymentOrdersTable;

function Sk({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-gray-200/80 ${className}`} />;
}
