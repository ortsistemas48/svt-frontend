"use client";

import {
  EllipsisVertical,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  FileText,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";

const API_BASE = "/api";

type PaymentOrder = {
  id: number;
  workshop_id: number;
  workshop_name?: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
  zone: "SUR" | "CENTRO" | "NORTE" | string;
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  created_at?: string;
  updated_at?: string;
  receipt_url?: string | null;
  receipt_mime?: string | null;
  receipt_size?: number | null;
  receipt_uploaded_at?: string | null;
  document_count?: number;
};

type Props = {
  orders: PaymentOrder[];
  onRefresh?: () => void;
  adminSetStatus?: (orderId: number, status: PaymentOrder["status"]) => Promise<void>;
};

const STATUS_BADGES: Record<
  PaymentOrder["status"],
  { text: string; bg: string; fg: string }
> = {
  PENDING: { text: "Pendiente", bg: "bg-gray-100", fg: "text-gray-700" },
  IN_REVIEW: { text: "En revisión", bg: "bg-amber-100", fg: "text-amber-800" },
  APPROVED: { text: "Aprobada", bg: "bg-emerald-100", fg: "text-emerald-800" },
  REJECTED: { text: "Rechazada", bg: "bg-rose-100", fg: "text-rose-800" },
};

export default function PaymentApprovalTable({ orders, onRefresh, adminSetStatus }: Props) {
  const router = useRouter();

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentOrder["status"] | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PaymentOrder | null>(null);

  const [confirmOpen, setConfirmOpen] = useState<null | "APPROVE" | "REJECT">(null);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { setPage(1); }, [searchText, pageSize, statusFilter]);

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
      if (!q) return true;
      const wname = (o.workshop_name || "").toLowerCase();
      return (
        wname.includes(q) ||
        String(o.quantity).includes(q) ||
        String(o.amount).includes(q) ||
        (o.zone || "").toLowerCase().includes(q)
      );
    });
  }, [orders, searchText, statusFilter]);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageItems = filtered.slice(start, end);

  const goToPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  const openDrawer = (o: PaymentOrder) => { setSelected(o); setOpen(true); };
  const closeDrawer = () => { setOpen(false); setTimeout(() => setSelected(null), 200); };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeDrawer(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handleRefresh = () => { onRefresh ? onRefresh() : router.refresh(); };

  const doSetStatus = async (status: PaymentOrder["status"]) => {
    if (!selected) return;
    if (adminSetStatus) {
      await adminSetStatus(selected.id, status);
      return;
    }
    const url = `${API_BASE}/payments_admin/orders/${selected.id}/status`;
    const res = await fetch(url, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      let msg = "No se pudo actualizar el estado";
      try { const j = await res.json(); msg = j?.error || msg; } catch {}
      throw new Error(msg);
    }
  };

  const confirmAction = async () => {
    if (!confirmOpen || !selected) return;
    try {
      setProcessing(true);
      setErrorMsg(null);
      await doSetStatus(confirmOpen === "APPROVE" ? "APPROVED" : "REJECTED");
      setConfirmOpen(null);
      closeDrawer();
      handleRefresh();
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudo completar la acción");
    } finally {
      setProcessing(false);
    }
  };

  const Badge = ({ s }: { s: PaymentOrder["status"] }) => {
    const b = STATUS_BADGES[s];
    return <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${b.bg} ${b.fg}`}>{b.text}</span>;
  };

  const Money = ({ v }: { v: number }) => (
    <span className="font-medium">
      {v.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
    </span>
  );

  const workshopLabel = (o: PaymentOrder) => o.workshop_name || `Taller ${o.workshop_id}`;

  return (
    <div className="p-4 sm:p-6">
      {/* Búsqueda y acciones */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
        <div className="flex-1 flex items-center border border-gray-300 rounded-md px-3 py-2 sm:py-3 h-12 focus-within:ring-2 focus-within:ring-[#0040B8] focus-within:border-transparent bg-white">
          <Search size={18} className="text-gray-500 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Buscar por nombre de taller, cantidad, monto o zona"
            className="w-full text-sm sm:text-base focus:outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <select
            className="border border-gray-300 rounded px-2 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaymentOrder["status"] | "ALL")}
            title="Filtrar por estado"
          >
            <option value="ALL">Todos</option>
            <option value="PENDING">Pendiente</option>
            <option value="IN_REVIEW">En revisión</option>
            <option value="APPROVED">Aprobadas</option>
            <option value="REJECTED">Rechazadas</option>
          </select>

          <button className="bg-[#0040B8] hover:bg-[#0035A0] text-white px-3 sm:px-4 py-2 sm:py-3 rounded-md flex items-center justify-center gap-2 transition-colors duration-200 font-medium text-sm">
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filtrar</span>
          </button>
          <button
            className="bg-white border border-[#0040B8] text-[#0040B8] px-3 sm:px-4 py-2 sm:py-3 rounded-md flex items-center justify-center gap-2 hover:bg-[#0040B8] hover:text-white transition-colors duration-200 font-medium text-sm"
            onClick={handleRefresh}
          >
            <RefreshCcw size={16} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Info superior de paginación */}
      <div className="mt-1 w-full flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Mostrando <strong>{totalItems === 0 ? 0 : start + 1}-{Math.min(end, totalItems)}</strong> de{" "}
          <strong>{totalItems}</strong> órdenes
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Por página</label>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla (sin columna ID, con nombre de taller) */}
      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white mt-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm sm:text-base">
            <thead className="bg-white text-gray-600">
              <tr className="border-b border-gray-200">
                <th className="p-3 text-center text-xs sm:text-sm font-medium">Taller</th>
                <th className="p-3 text-center text-xs sm:text-sm font-medium">Cantidad</th>
                <th className="p-3 text-center text-xs sm:text-sm font-medium">Monto</th>
                <th className="p-3 text-center text-xs sm:text-sm font-medium">Estado</th>
                <th className="p-3 text-center text-xs sm:text-sm font-medium">Comprobante</th>
                <th className="p-3 text-center text-xs sm:text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 sm:py-20 text-gray-600">
                    No hay órdenes
                  </td>
                </tr>
              ) : (
                pageItems.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-center">{workshopLabel(o)}</td>
                    <td className="p-3 text-center">{o.quantity}</td>
                    <td className="p-3 text-center"><Money v={o.amount} /></td>
                    <td className="p-3 text-center"><Badge s={o.status} /></td>
                    <td className="p-3 text-center">
                      {o.receipt_url ? (
                        <a
                          href={o.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#0040B8] hover:underline"
                          title="Ver comprobante"
                        >
                          <FileText size={16} /> Ver
                        </a>
                      ) : (
                        <span className="text-gray-400">Sin archivo</span>
                      )}
                    </td>
                    <td className="p-0">
                      <div className="flex justify-center items-center gap-2 sm:gap-3 h-full min-h-[48px] px-2 sm:px-3">
                        <button
                          type="button"
                          className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Ver detalles"
                          onClick={() => openDrawer(o)}
                        >
                          <EllipsisVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación inferior */}
      <div className="w-full flex items-center justify-between mt-4">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`px-3 py-2 rounded border text-sm ${
            currentPage <= 1 ? "text-gray-400 border-gray-200" : "text-[#0040B8] border-[#0040B8]"
          }`}
        >
          Anterior
        </button>

        <div className="text-sm text-gray-600">
          Página {currentPage} de {totalPages}
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`px-3 py-2 rounded border text-sm ${
            currentPage >= totalPages ? "text-gray-400 border-gray-200" : "text-[#0040B8] border-[#0040B8]"
          }`}
        >
          Siguiente
        </button>
      </div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeDrawer}
        aria-hidden={!open}
      />

      {/* Drawer detalle (sin ID visible, muestra nombre de taller) */}
      <aside
        role="dialog"
        aria-modal="true"
        className={`fixed right-0 top-0 z-50 h-full w-full sm:w-[460px] bg-white shadow-2xl transform transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-base sm:text-lg font-semibold truncate">
            {selected ? `Orden de pago, ${workshopLabel(selected)}` : "Detalle de orden"}
          </h2>
          <button
            ref={closeBtnRef}
            onClick={closeDrawer}
            className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
            aria-label="Cerrar panel"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100%-56px)]">
          {selected ? (
            <div className="space-y-6">
              <div className="-mx-4 divide-y divide-gray-200">
                <InfoRow label="Taller" value={workshopLabel(selected)} />
                <InfoRow label="Estado" value={<Badge s={selected.status} />} />
                <InfoRow label="Cantidad" value={selected.quantity} />
                <InfoRow label="Precio unitario" value={<Money v={selected.unit_price} />} />
                <InfoRow label="Monto" value={<Money v={selected.amount} />} />
                <InfoRow label="Zona" value={selected.zone} />
                <InfoRow label="Creada" value={selected.created_at || "-"} />
                <InfoRow label="Actualizada" value={selected.updated_at || "-"} />
                <InfoRow
                  label="Comprobante"
                  value={
                    selected.receipt_url ? (
                      <a
                        href={selected.receipt_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#0040B8] hover:underline"
                      >
                        <FileText size={16} /> Ver
                      </a>
                    ) : (
                      "Sin archivo"
                    )
                  }
                />
              </div>

              {(selected.status === "PENDING" || selected.status === "IN_REVIEW") && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen("APPROVE")}
                    disabled={processing}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm"
                    title="Aprobar"
                  >
                    <CheckCircle2 size={16} />
                    Aprobar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmOpen("REJECT")}
                    disabled={processing}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm"
                    title="Rechazar"
                  >
                    <XCircle size={16} />
                    Rechazar
                  </button>
                </div>
              )}

              {errorMsg && <p className="text-sm text-rose-700">{errorMsg}</p>}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Selecciona una orden para ver sus datos.</p>
          )}
        </div>
      </aside>

      {/* Modal confirmar (sin mencionar ID) */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmOpen(null)} />
          <div className="relative bg-white w-[92%] max-w-md rounded-lg shadow-xl border border-gray-200 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {confirmOpen === "APPROVE" ? (
                  <CheckCircle2 size={20} className="text-emerald-600" />
                ) : (
                  <XCircle size={20} className="text-rose-600" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold">
                  {confirmOpen === "APPROVE" ? "Confirmar aprobación" : "Confirmar rechazo"}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  Vas a {confirmOpen === "APPROVE" ? "aprobar" : "rechazar"} esta orden de pago.
                </p>
              </div>
            </div>

            {errorMsg && <p className="mt-3 text-sm text-rose-700">{errorMsg}</p>}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(null)}
                className="px-4 py-2 rounded-md border border-gray-300 bg-white text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmAction}
                disabled={processing}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-white text-sm ${
                  confirmOpen === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                } disabled:opacity-60`}
              >
                {processing ? "Procesando..." : confirmOpen === "APPROVE" ? "Sí, aprobar" : "Sí, rechazar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-start justify-between py-2 px-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 max-w-[60%] text-right break-words">
        {typeof value === "undefined" || value === null || value === "" ? "-" : value}
      </span>
    </div>
  );
}
