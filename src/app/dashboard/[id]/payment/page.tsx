"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronRight, ArrowRight, Info, X, Copy, Check } from "lucide-react";
import clsx from "clsx";
import PaymentDropzone from "@/components/PaymentDropzone";
import PaymentOrdersTable from "@/components/PaymentOrdersTable";

const API = "/api";

type Workshop = {
  id: number;
  name: string;
  province: string;
  city: string;
  available_inspections: number; 
};

const ZONE_BY_PROVINCE: Record<string, "SUR" | "CENTRO" | "NORTE"> = {
  "Santa Cruz": "SUR",
  "Tierra del Fuego": "SUR",
  Chubut: "SUR",
  Neuquén: "SUR",
  "Río Negro": "SUR",
  "Buenos Aires": "SUR",
  CABA: "SUR",
  "La Pampa": "CENTRO",
  "Santa Fe": "CENTRO",
  Córdoba: "CENTRO",
  Mendoza: "CENTRO",
  "San Luis": "CENTRO",
  "Entre Ríos": "CENTRO",
  "La Rioja": "CENTRO",
  "San Juan": "CENTRO",
  Salta: "NORTE",
  Jujuy: "NORTE",
  Catamarca: "NORTE",
  Chaco: "NORTE",
  Formosa: "NORTE",
  Corrientes: "NORTE",
  Misiones: "NORTE",
  "Santiago del Estero": "NORTE",
  Tucumán: "NORTE",
};

const UNIT_PRICE: Record<"SUR" | "CENTRO" | "NORTE", number> = {
  SUR: 4000,
  CENTRO: 3000,
  NORTE: 2500,
};

function formatARS(n: number) {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const workshopId = Number(id);
  const [submitting, setSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [proofError, setProofError] = useState<string | null>(null);

  const [ws, setWs] = useState<Workshop | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [qty, setQty] = useState(250);
  const [qtyInput, setQtyInput] = useState(String(qty));
  const minQty = 250;
  const maxQty = 20000;
  const progress = useMemo(() => {
    const pct = ((qty - minQty) / (maxQty - minQty)) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }, [qty]);
  useEffect(() => {
    setQtyInput(String(qty));
  }, [qty]);

  const [showModal, setShowModal] = useState(false);

  // copiar datos
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1200);
  };

  useEffect(() => {
    const fetchWorkshop = async () => {
      if (!workshopId) return;
      try {
        const res = await fetch(`${API}/workshops/${workshopId}`, { credentials: "include" });
        if (!res.ok) throw new Error("No se pudieron cargar datos del taller");
        const data = await res.json();
        setWs({
          id: data.id,
          name: data.name,
          province: data.province,
          city: data.city,
          available_inspections: Number(data.available_inspections ?? 0),
        });
      } catch (e: any) {
        setErrorMsg(e?.message || "Error cargando el taller");
      }
    };
    fetchWorkshop();
  }, [workshopId]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const zone = useMemo(() => {
    if (!ws) return "CENTRO" as const;
    return ZONE_BY_PROVINCE[ws.province] ?? "CENTRO";
  }, [ws]);

  const unit = UNIT_PRICE[zone];
  const total = qty * unit;
  const stock = ws?.available_inspections ?? 0;
  const stockState = stock < 100 ? "zero" : stock < minQty ? "low" : "ok";
  const stockClasses =
    stockState === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : stockState === "low"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-rose-200 bg-rose-50 text-rose-700";

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

    const onConfirmPayment = async () => {
    if (!ws) return;

    // obligatorio: al menos un archivo
    if (pendingFiles.length === 0) {
        setProofError("Subí el comprobante para continuar");
        return;
    }

    try {
        setSubmitting(true);
        setErrorMsg(null);
        setOkMsg(null);
        setProofError(null);

        // 1) crear orden pendiente
        const body = {
        workshop_id: ws.id,
        quantity: qty,
        zone,
        unit_price: unit,
        amount: total,
        };
        const res = await fetch(`${API}/payments/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
        });
        if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || `Error ${res.status}`);
        }
        const { order } = await res.json();

        const fd = new FormData();
        fd.append("file", pendingFiles[0]);

        const up = await fetch(`${API}/payment_receipts/orders/${order.id}/receipt`, {
        method: "POST",
        credentials: "include",
        body: fd,
        });

        if (!up.ok) {
        if (up.status === 413) throw new Error("El archivo excede 15MB, subí un comprobante más liviano");
        if (up.status === 415) throw new Error("Formato inválido, permitidos, JPG, PNG, WEBP o PDF");
        const t = await up.text().catch(() => "");
        throw new Error(t || "No se pudo subir el comprobante");
        }

        setOkMsg("Orden generada y comprobante subido, la estamos revisando");
        setPendingFiles([]);
        setShowModal(false);
    } catch (e: any) {
        setErrorMsg(e?.message || "No se pudo generar la orden o subir el comprobante");
    } finally {
        setSubmitting(false);
    }
    };

  return (
    <div className="bg-white">
      <div className="w-full px-6 py-6">
        {/* Migas */}
        <article className="mb-6 flex items-center justify-between text-sm sm:text-base lg:text-lg">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
            <ChevronRight size={16} className="sm:w-5 sm:h-5" />
            <span className="text-[#0040B8] font-medium">Pagos</span>
          </div>
        </article>

        {/* Hero minimal */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl text-[#0040B8] mb-2 sm:mb-3">
            Pagos del taller
          </h2>
          <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Elegí la cantidad de revisiones, y realiza una transferencia para habilitar tu cupo.
          </p>
        </div>

        {(errorMsg || okMsg) && (
          <div className="mb-4">
            {errorMsg && (
              <div className="rounded-[4px] border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorMsg}
              </div>
            )}
            {okMsg && (
              <div className="rounded-[4px] border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {okMsg}
              </div>
            )}
          </div>
        )}

        {/* Card principal, ahora con slider centrado y resumen debajo */}
        <section className="w-full">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* Encabezado compacto */}
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-5">
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-gray-700">
                <span className="font-medium">Zona</span>
                <span className="rounded-full bg-[#F3F6FF] px-2 py-0.5 text-[#0040B8]">{zone}</span>
              </span>
              
              <span
                className={clsx(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                  stockClasses
                )}
                title="Revisiones disponibles en este taller"
              >
                <span className="font-medium">Stock disponible</span>
                <span className={clsx(
                  "rounded-full px-2 py-0.5",
                  stockState === "ok" ? "bg-emerald-100/70 text-emerald-800" :
                  stockState === "low" ? "bg-amber-100/70 text-amber-800" :
                  "bg-rose-100/70 text-rose-800"
                )}>
                  {stock.toLocaleString("es-AR")} {stock === 1 ? "revisión" : "revisiones"}
                </span>
              </span>

              <span className="text-xs text-gray-500">
                Precio unitario: <span className="font-semibold text-gray-900">{formatARS(UNIT_PRICE[zone])}</span> por revisión
              </span>

              {/* NUEVO, stock disponible */}
            </div>
            {/* Contenido centrado, slider grueso y resumen alineado */}
            <div className="p-6">
              {/* Slider centrado */}
              <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white/60 p-6">
                <label htmlFor="qty" className="mb-3 block text-center text-sm text-gray-700">
                  Cantidad de revisiones
                </label>

                <div className="mx-auto grid w-full grid-cols-[auto_1fr_auto] items-center gap-4">
                  <button
                    className="h-10 rounded-[4px] border px-3 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setQty((q) => Math.max(minQty, q - 1))}
                    aria-label="Restar"
                  >
                    −1
                  </button>

                  <input
                    id="qty"
                    type="range"
                    min={minQty}
                    max={maxQty}
                    /* sin step => por default es 1 */
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value || "0", 10))}
                    className="range-modern w-full"
                    style={{
                      background: `linear-gradient(90deg, #0040B8 ${progress}%, #e5e7eb ${progress}%)`,
                    }}
                  />

                  <button
                    className="h-10 rounded-[4px] border px-3 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    aria-label="Sumar"
                  >
                    +1
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-3 items-center text-xs text-gray-600">
                  <span>{minQty}</span>
                  <div className="text-center">
                    Selección actual: <span className="font-semibold text-gray-900">{qty}</span>
                  </div>
                  <span className="text-right">{maxQty.toLocaleString("es-AR")}</span>
                </div>

                {/* input numérico para accesibilidad */}
                <div className="mt-4 flex items-center justify-center gap-3">
                  <input
                    type="number"
                    min={minQty}
                    max={maxQty}
                    value={qtyInput}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onChange={(e) => {
                      const v = e.target.value;
                      // Permití vacío para que el usuario pueda borrar y tipear
                      if (v === "") {
                        setQtyInput("");
                        return;
                      }
                      // Solo dígitos
                      if (/^\d+$/.test(v)) {
                        setQtyInput(v);
                      }
                      // si no son dígitos, ignoramos
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        (e.currentTarget as HTMLInputElement).blur();
                      }
                    }}
                    onBlur={() => {
                      // Al salir, normalizamos y aplicamos límites
                      const n = parseInt(qtyInput || "0", 10);
                      if (!Number.isFinite(n)) {
                        setQty(minQty);
                        return;
                      }
                      const clamped = Math.max(minQty, Math.min(maxQty, n));
                      setQty(clamped);       // actualiza el número real
                      setQtyInput(String(clamped)); // refleja en el input
                    }}
                    className="w-40 rounded-[4px] border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-[#0040B8]"
                  />
                  <span className="text-xs text-gray-500">Mínimo 250</span>
                </div>
              </div>

              {/* Resumen debajo, simétrico y minimal */}
              <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-[#F8FAFF] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <div className="rounded-[4px] bg-[#F3F6FF] p-2 text-[#0040B8]">
                    <Info className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900">Resumen</h4>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <SummaryItem label="Revisiones" value={qty.toLocaleString("es-AR")} />
                  <SummaryItem label="Unitario" value={formatARS(unit)} />
                  <SummaryItem label="Total" value={formatARS(total)} highlight />
                </div>

                <button
                  onClick={openModal}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-[6px] bg-[#0040B8] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#00379f]"
                >
                  Generar orden de transferencia
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Tabla de órdenes */}
        <div className="mt-10">
          <PaymentOrdersTable />
        </div>

        {/* Modal transferencia, layout vertical y más limpio */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4 overflow-y-auto overscroll-none">
            <div className="w-full max-w-xs sm:max-w-lg md:max-w-2xl max-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl my-4 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b p-3 sm:p-4 flex-shrink-0">
                <h3 className="text-base sm:text-lg font-semibold">Transferencia bancaria</h3>
                <button className="rounded-full border p-1 hover:bg-gray-50" onClick={closeModal} aria-label="Cerrar">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body en columna, pasos simples */}
              <div className="space-y-4 sm:space-y-6 p-3 sm:p-5 overflow-y-auto flex-1 scrollbar-hide">
                {/* Paso 1, monto */}
                <section className="rounded-[4px] border bg-white/60 p-3 sm:p-4">
                  <h4 className="text-sm font-semibold text-gray-900">1- Monto a transferir</h4>
                  <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#0040B8]">{formatARS(total)}</p>
                  <p className="mt-1 text-xs sm:text-sm text-gray-600 break-words">Concepto: Revisiones - {qty} - {zone}</p>
                </section>

                {/* Paso 2, datos bancarios copiable */}
                <section className="rounded-[4px] border bg-gradient-to-b from-[#F8FAFF] to-white p-3 sm:p-4">
                  <h4 className="text-sm font-semibold text-gray-900">2- Datos para transferencia</h4>
                  <ul className="mt-3 space-y-2 text-xs sm:text-sm text-gray-800">
                    <CopyRow label="Titular" value="Talleres SRL" onCopy={copy} copiedKey={copied} k="titular" />
                    <CopyRow label="CUIT" value="30-00000000-0" onCopy={copy} copiedKey={copied} k="cuit" />
                    <CopyRow label="Banco" value="Banco Demo" onCopy={copy} copiedKey={copied} k="banco" />
                    <CopyRow label="CBU" value="0000000000000000000000" onCopy={copy} copiedKey={copied} k="cbu" />
                    <CopyRow label="Alias" value="talleres.demo.ar" onCopy={copy} copiedKey={copied} k="alias" />
                  </ul>
                  <p className="mt-2 text-xs text-gray-500">Copiá los datos y realizá la transferencia</p>
                </section>

                {/* Paso 3, comprobante */}
                <section className={clsx(
                "rounded-[4px] border bg-white/60 p-3 sm:p-4",
                proofError ? "border-rose-300" : "border-gray-200" // <--- resalta si falta
                )}>
                <h4 className="text-sm font-semibold text-gray-900">3- Subí el comprobante <span className="text-rose-600">*</span></h4>
                <div className="mt-2">
                    <PaymentDropzone onPendingChange={(files) => {
                    setPendingFiles(files);
                    if (files.length > 0 && proofError) setProofError(null);
                    }} title="Comprobante, imagen o PDF" />
                </div>
                {proofError && (
                    <p className="mt-2 text-sm text-rose-700">{proofError}</p>
                )}
                </section>
              </div>

                {/* Footer del modal */}
                <div className="flex items-center justify-end gap-2 sm:gap-3 border-t bg-white p-3 sm:p-4 flex-shrink-0">
                <button
                    onClick={closeModal}
                    className="rounded-[4px] border px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50"
                    type="button"
                >
                    Cancelar
                </button>
                <button
                    onClick={onConfirmPayment}
                    disabled={submitting || pendingFiles.length === 0}
                    className={clsx(
                    "rounded-[4px] px-3 sm:px-4 py-2 text-xs sm:text-sm text-white",
                    submitting || pendingFiles.length === 0
                        ? "bg-[#0040B8]/60 cursor-not-allowed"
                        : "bg-[#0040B8] hover:bg-[#00379f]"
                    )}
                    type="button"
                    title={pendingFiles.length === 0 ? "Subí el comprobante para continuar" : undefined}
                >
                    {submitting ? "Enviando..." : "Enviar"}
                </button>
                </div>
            </div>
          </div>
        )}
      </div>

      {/* estilos del slider moderno */}
      <style jsx global>{`
        .range-modern {
            -webkit-appearance: none;
            appearance: none;
            height: 12px;
            border-radius: 9999px;
            outline: none;
        }
        .range-modern::-webkit-slider-runnable-track {
            height: 12px;
            border-radius: 9999px;
            background: transparent; /* el background lo damos inline con el gradient */
        }
        .range-modern::-moz-range-track {
            height: 12px;
            border-radius: 9999px;
            background: transparent;
        }
        .range-modern::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 28px;
            height: 28px;
            border-radius: 9999px;
            background: white;
            border: 3px solid #0040b8;
            box-shadow: 0 2px 8px rgba(0,0,0,.12);
            margin-top: -8px; /* centra el thumb en el track de 12px */
        }
        .range-modern::-moz-range-thumb {
            width: 28px;
            height: 28px;
            border-radius: 9999px;
            background: white;
            border: 3px solid #0040b8;
            box-shadow: 0 2px 8px rgba(0,0,0,.12);
        }
        `}</style>

    </div>
  );
}

/* resumen mini card */
function SummaryItem({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={clsx(
        "rounded-[4px] border p-4 text-center",
        highlight ? "bg-[#0040B8]/5 border-[#0040B8]/30" : "bg-white/60 border-gray-200"
      )}
    >
      <div className="text-xs text-gray-600">{label}</div>
      <div className={clsx("mt-1 text-lg font-semibold", highlight ? "text-[#0040B8]" : "text-gray-900")}>{value}</div>
    </div>
  );
}

/* fila copiable compacta */
function CopyRow({
  label,
  value,
  onCopy,
  copiedKey,
  k,
}: {
  label: string;
  value: string;
  onCopy: (text: string, key: string) => void;
  copiedKey: string | null;
  k: string;
}) {
  const copied = copiedKey === k;
  return (
    <li className="flex items-center justify-between gap-3">
      <div className="text-gray-600">
        {label}: <span className="text-gray-900">{value}</span>
      </div>
      <button
        type="button"
        onClick={() => onCopy(value, k)}
        className="inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copiado" : "Copiar"}
      </button>
    </li>
  );
}
