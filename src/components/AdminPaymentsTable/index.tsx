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
  Download,
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
  PENDING: { text: "Pendiente de pago", bg: "bg-gray-100", fg: "text-gray-700" },
  IN_REVIEW: { text: "Pendiente de acreditación", bg: "bg-amber-100", fg: "text-amber-800" },
  APPROVED: { text: "Aprobado", bg: "bg-emerald-100", fg: "text-emerald-800" },
  REJECTED: { text: "Rechazado", bg: "bg-rose-100", fg: "text-rose-800" },
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

  const [downloading, setDownloading] = useState<number | null>(null);

  const handleDownload = async (orderId: number) => {
    try {
      setDownloading(orderId);
      const res = await fetch(`${API_BASE}/payments_admin/orders/${orderId}/receipt/download`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("No se pudo obtener el archivo");

      // Extraer filename del Content-Disposition si existe
      const disposition = res.headers.get("Content-Disposition") || "";
      let filename = `comprobante-orden-${orderId}`;
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match) filename = match[1];

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      setErrorMsg("No se pudo descargar el comprobante");
    } finally {
      setDownloading(null);
    }
  };

  const Badge = ({ s }: { s: PaymentOrder["status"] }) => {
    const b = STATUS_BADGES[s];
    return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide ${b.bg} ${b.fg}`}>{b.text}</span>;
  };

  const Money = ({ v }: { v: number }) => (
    <span className="font-medium">
      {v.toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
    </span>
  );

  const workshopLabel = (o: PaymentOrder) => o.workshop_name || `Taller ${o.workshop_id}`;

  return (
    <div className="p-1 sm:p-2 md:p-4 lg:p-6">
      {/* Búsqueda y acciones */}
      <div className="flex flex-row gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
        <div className="flex-1 flex items-center border border-gray-300 rounded-[4px] px-2 sm:px-3 py-1.5 sm:py-2 md:py-3 h-9 sm:h-10 md:h-12 focus-within:ring-2 focus-within:ring-[#0040B8] focus-within:border-transparent bg-white">
          <Search size={14} className="sm:w-[16px] sm:h-[16px] md:w-[18px] md:h-[18px] text-gray-500 mr-1 sm:mr-2 flex-shrink-0" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Buscar órdenes..."
            className="w-full text-xs sm:text-sm md:text-base focus:outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Filtro - solo icono en mobile, select completo en desktop */}
          <div className="relative bg-white border border-gray-300 rounded-[4px] h-9 sm:h-10 md:h-12 min-w-[36px] sm:min-w-[160px] flex items-center">
            {/* Mobile: icono visible */}
            <SlidersHorizontal size={16} className="sm:hidden text-gray-500 mx-auto" />
            {/* Desktop: select visible */}
            <select
              className="hidden sm:block w-full outline-none bg-transparent text-xs sm:text-sm px-3 py-1 cursor-pointer h-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PaymentOrder["status"] | "ALL")}
              title="Filtrar por estado"
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendiente de pago</option>
              <option value="IN_REVIEW">Pendiente de acreditación</option>
              <option value="APPROVED">Aprobado</option>
              <option value="REJECTED">Rechazado</option>
            </select>
            {/* Mobile: select invisible pero funcional */}
            <select
              className="sm:hidden absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PaymentOrder["status"] | "ALL")}
              title="Filtrar por estado"
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendiente de pago</option>
              <option value="IN_REVIEW">Pendiente de acreditación</option>
              <option value="APPROVED">Aprobado</option>
              <option value="REJECTED">Rechazado</option>
            </select>
          </div>
          <button
            className="hidden sm:flex bg-white border border-[#0040B8] text-[#0040B8] px-3 md:px-4 py-2 sm:py-3 rounded-[4px] items-center justify-center gap-2 hover:bg-[#0040B8] hover:text-white transition-colors duration-200 font-medium text-sm h-10 md:h-12"
            onClick={handleRefresh}
          >
            <RefreshCcw size={16} className="w-4 h-4" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Info superior de paginación */}
      <div className="mt-1 w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div className="text-xs sm:text-sm text-gray-600">
          Mostrando <strong>{totalItems === 0 ? 0 : start + 1}-{Math.min(end, totalItems)}</strong> de{" "}
          <strong>{totalItems}</strong> órdenes
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs sm:text-sm text-gray-600">Por página</label>
          <select
            className="border border-gray-300 rounded px-1.5 sm:px-2 py-1 text-xs sm:text-sm"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla con nombre de taller - vista desktop */}
      <div className="hidden xl:block rounded-lg sm:rounded-[14px] border border-gray-200 overflow-hidden bg-white mt-2 sm:mt-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm sm:text-base">
            <thead className="bg-white text-gray-600">
              <tr className="border-b border-gray-200">
                <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">Orden</th>
                <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">Taller</th>
                <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">Cantidad</th>
                <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">Monto</th>
                <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">Estado</th>
                <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">Comprobante</th>
                <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 sm:py-12 md:py-20 text-xs sm:text-sm text-gray-600">
                    No hay órdenes
                  </td>
                </tr>
              ) : (
                pageItems.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-2 sm:p-3 text-center">
                      <div className="mx-auto w-fit rounded-[4px] bg-gray-100 px-2 py-1 text-xs font-medium">#{o.id}</div>
                    </td>
                    <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">{workshopLabel(o)}</td>
                    <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">{o.quantity}</td>
                    <td className="p-2 sm:p-3 text-center text-xs sm:text-sm"><Money v={o.amount} /></td>
                    <td className="p-2 sm:p-3 text-center"><Badge s={o.status} /></td>
                    <td className="p-2 sm:p-3 text-center">
                      {o.receipt_url ? (
                        <div className="inline-flex items-center gap-1.5 justify-center">
                          <button
                            type="button"
                            onClick={() => handleDownload(o.id)}
                            disabled={downloading === o.id}
                            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-md text-[#0040B8] bg-blue-50/80 text-xs font-medium hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-150 disabled:opacity-50"
                            title="Descargar comprobante"
                          >
                            <Download size={13} className="flex-shrink-0" />
                            {downloading === o.id ? "Descargando..." : "Descargar"}
                          </button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <FileText size={13} className="flex-shrink-0" /> Sin archivo
                        </span>
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
                          <EllipsisVertical size={14} className="sm:w-4 sm:h-4" />
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

      {/* Vista de cards para mobile/tablet */}
      <div className="xl:hidden mt-2 sm:mt-3 space-y-2 sm:space-y-3">
        {pageItems.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-xs sm:text-sm text-gray-600 bg-white rounded-lg border border-gray-200 p-4">
            No hay órdenes
          </div>
        ) : (
          pageItems.map((o) => (
            <div
              key={o.id}
              className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="rounded-[4px] bg-gray-100 px-2 py-1 text-xs font-medium">#{o.id}</div>
                    <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
                      {workshopLabel(o)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1.5 rounded hover:bg-blue-50 transition-colors flex-shrink-0 ml-2"
                  title="Ver detalles"
                  onClick={() => openDrawer(o)}
                >
                  <EllipsisVertical size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div>
                  <div className="text-gray-500 mb-0.5">Cantidad</div>
                  <div className="text-gray-900 font-medium">{o.quantity}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-0.5">Monto</div>
                  <div className="text-gray-900 font-medium"><Money v={o.amount} /></div>
                </div>
                <div>
                  <div className="text-gray-500 mb-0.5">Estado</div>
                  <div><Badge s={o.status} /></div>
                </div>
                <div>
                  <div className="text-gray-500 mb-0.5">Comprobante</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {o.receipt_url ? (
                      <button
                        type="button"
                        onClick={() => handleDownload(o.id)}
                        disabled={downloading === o.id}
                        className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-md text-[#0040B8] bg-blue-50/80 text-xs font-medium hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-150 disabled:opacity-50"
                        title="Descargar comprobante"
                      >
                        <Download size={13} className="flex-shrink-0" />
                        {downloading === o.id ? "Descargando..." : "Descargar"}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <FileText size={13} className="flex-shrink-0" /> Sin archivo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación inferior */}
      <div className="w-full flex items-center justify-between gap-2 sm:gap-3 mt-3 sm:mt-4 bg-white border border-gray-200 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-150 ${
            currentPage <= 1
              ? "text-gray-300 bg-gray-50 cursor-not-allowed"
              : "text-gray-700 bg-gray-100 hover:bg-gray-200"
          }`}
        >
          Anterior
        </button>

        <div className="text-xs sm:text-sm text-gray-500">
          <span className="font-medium text-gray-700">{currentPage}</span> de <span className="font-medium text-gray-700">{totalPages}</span>
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-150 ${
            currentPage >= totalPages
              ? "text-gray-300 bg-gray-50 cursor-not-allowed"
              : "text-gray-700 bg-gray-100 hover:bg-gray-200"
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

      {/* Drawer detalle con ID y nombre de taller */}
      <aside
        role="dialog"
        aria-modal="true"
        className={`fixed right-0 top-0 z-50 h-full w-full sm:w-[460px] bg-white shadow-2xl transform transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b">
          <h2 className="text-sm sm:text-base md:text-lg font-semibold truncate">
            {selected ? `Orden #${selected.id} - ${workshopLabel(selected)}` : "Detalle de orden"}
          </h2>
          <button
            ref={closeBtnRef}
            onClick={closeDrawer}
            className="p-1.5 sm:p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
            aria-label="Cerrar panel"
            title="Cerrar"
          >
            <X size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>

        <div className="p-3 sm:p-4 overflow-y-auto h-[calc(100%-56px)]">
          {selected ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="-mx-3 sm:-mx-4 divide-y divide-gray-200">
                <InfoRow label="Orden" value={`#${selected.id}`} />
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
                      <button
                        type="button"
                        onClick={() => handleDownload(selected.id)}
                        disabled={downloading === selected.id}
                        className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-md text-[#0040B8] bg-blue-50/80 text-xs font-medium hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-150 disabled:opacity-50"
                        title="Descargar comprobante"
                      >
                        <Download size={13} className="flex-shrink-0" />
                        {downloading === selected.id ? "Descargando..." : "Descargar"}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <FileText size={13} /> Sin archivo
                      </span>
                    )
                  }
                />
              </div>

              {selected.status === "IN_REVIEW" && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen("APPROVE")}
                    disabled={processing}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-medium shadow-sm hover:shadow transition-all duration-150"
                    title="Aprobar"
                  >
                    <CheckCircle2 size={16} />
                    Aprobar pago
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmOpen("REJECT")}
                    disabled={processing}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 disabled:opacity-60 text-sm font-medium transition-all duration-150"
                    title="Rechazar"
                  >
                    <XCircle size={16} />
                    Rechazar
                  </button>
                </div>
              )}

              {selected.status === "PENDING" && (
                <div className="rounded-[4px] bg-amber-50 border border-amber-200 p-3 text-xs sm:text-sm text-amber-800">
                  Esta orden está pendiente de pago. El taller debe subir el comprobante antes de poder aprobarla.
                </div>
              )}

              {errorMsg && <p className="text-xs sm:text-sm text-rose-700">{errorMsg}</p>}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-gray-600">Selecciona una orden para ver sus datos.</p>
          )}
        </div>
      </aside>

      {/* Modal confirmar */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmOpen(null)} />
          <div className="relative bg-white w-[92%] max-w-md rounded-lg sm:rounded-[14px] shadow-xl border border-gray-200 p-4 sm:p-5">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="mt-0.5 sm:mt-1">
                {confirmOpen === "APPROVE" ? (
                  <CheckCircle2 size={18} className="sm:w-5 sm:h-5 text-emerald-600" />
                ) : (
                  <XCircle size={18} className="sm:w-5 sm:h-5 text-rose-600" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold">
                  {confirmOpen === "APPROVE" ? "Confirmar aprobación" : "Confirmar rechazo"}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-600">
                  Vas a {confirmOpen === "APPROVE" ? "aprobar" : "rechazar"} esta orden de pago.
                </p>
              </div>
            </div>

            {errorMsg && <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-rose-700">{errorMsg}</p>}

            <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmOpen(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors duration-150"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmAction}
                disabled={processing}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium shadow-sm transition-all duration-150 ${
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
    <div className="flex items-start justify-between py-2 px-3 sm:px-4">
      <span className="text-xs sm:text-sm text-gray-500">{label}</span>
      <span className="text-xs sm:text-sm text-gray-900 max-w-[60%] text-right break-words">
        {typeof value === "undefined" || value === null || value === "" ? "-" : value}
      </span>
    </div>
  );
}
