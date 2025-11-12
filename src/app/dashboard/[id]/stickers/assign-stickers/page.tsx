"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Save,
  Trash2,
  Layers,
  ChevronRight,
  SquareStack,
  AlertTriangle,
} from "lucide-react";
import clsx from "clsx";

/* ===================== Config ===================== */
const API = "/api";

/* ===================== Tipos ===================== */
type RangeInput = { id: string; lead: string; start: string; end: string; tail: string; };

type Group = {
  id: string;
  name: string;
  ranges: RangeInput[];
  obleas: string[];
  createdAt: string;
};

type CreateOrderResponse = {
  ok: boolean;
  order: {
    id: number;
    name: string;
    workshop_id: number;
    status: string;
    created_at?: string | null;
    amount: number;
  };
  inserted: number;
  duplicates: string[];
};

/* ===================== Utils ===================== */
const uid = () => Math.random().toString(36).slice(2, 10);
const digitsOnly = (v: string) => v.replace(/\D/g, "");
const toNumberOrNaN = (v: string): number => {
  const d = digitsOnly(v);
  if (d === "") return NaN;
  const n = Number(d);
  return Number.isFinite(n) ? n : NaN;
};

function genRange(r: RangeInput): { list: string[]; error?: string } {
  const startDigits = digitsOnly(r.start);
  const endDigits = digitsOnly(r.end);
  const start = toNumberOrNaN(r.start);
  const end = toNumberOrNaN(r.end);

  if (Number.isNaN(start) || Number.isNaN(end)) return { list: [], error: "Ingresá números válidos en inicio y fin." };
  if (end < start) return { list: [], error: "El fin no puede ser menor que el inicio." };

  const width = Math.max(startDigits.length, endDigits.length, 1);
  const items: string[] = [];
  for (let i = start; i <= end; i++) {
    const num = String(i).padStart(width, "0");
    items.push(`${r.lead || ""}${num}${r.tail || ""}`);
  }
  return { list: items };
}

function flattenUnique<T>(arrs: T[][]): { list: T[]; dups: Set<T> } {
  const seen = new Set<T>();
  const dups = new Set<T>();
  const out: T[] = [];
  for (const list of arrs) {
    for (const it of list) {
      if (seen.has(it)) { dups.add(it as any); continue; }
      seen.add(it); out.push(it);
    }
  }
  return { list: out, dups };
}

/* ===================== Componente ===================== */
export default function AsignarObleasPage() {
  const params = useParams<{ id: string }>();
  const workshopId = Number(params.id);

  const [groupName, setGroupName] = useState("");
  const [ranges, setRanges] = useState<RangeInput[]>([{ id: uid(), lead: "", start: "", end: "", tail: "" }]);

  const [noExpiry, setNoExpiry] = useState(false);
  const [expirationDate, setExpirationDate] = useState<string>("");

  const [groups, setGroups] = useState<Group[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const calculatedQty = useMemo(() => {
    return ranges.reduce((acc, r) => {
      const start = toNumberOrNaN(r.start);
      const end = toNumberOrNaN(r.end);
      if (Number.isNaN(start) || Number.isNaN(end)) return acc;
      if (end < start) return acc;
      return acc + (end - start);
    }, 0);
  }, [ranges]);

  const preview = useMemo(() => {
    const results = ranges.map((r) => genRange(r));
    const anyError = results.find((r) => r.error)?.error;
    const { list, dups } = flattenUnique(results.map((r) => r.list));
    return { total: list.length, items: list, dupCount: dups.size, error: anyError };
  }, [ranges]);

  const addRange = () => setRanges((prev) => [...prev, { id: uid(), lead: "", start: "", end: "", tail: "" }]);
  const removeRange = (rid: string) => setRanges((prev) => prev.filter((r) => r.id !== rid));
  const updateRange = (rid: string, patch: Partial<RangeInput>) =>
    setRanges((prev) => prev.map((r) => (r.id === rid ? { ...r, ...patch } : r)));

  const resetForm = () => {
    setGroupName("");
    setRanges([{ id: uid(), lead: "", start: "", end: "", tail: "" }]);
    setNoExpiry(false);
    setExpirationDate("");
  };

  const canSave =
    !!workshopId &&
    groupName.trim().length > 0 &&
    ranges.length > 0 &&
    !preview.error &&
    preview.total > 0 &&
    (noExpiry || !!expirationDate);

  const saveGroup = async () => {
    setErrMsg(null);
    setOkMsg(null);
    if (!canSave) return;

    try {
      setIsSaving(true);

      const body = {
        workshop_id: workshopId,
        name: groupName.trim(),
        stickers: preview.items,
        expiration_date: noExpiry ? null : expirationDate || null,
      };

      const res = await fetch(`${API}/stickers/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || `Error ${res.status}`);
      }

      const data: CreateOrderResponse = await res.json();

      const newGroup: Group = {
        id: String(data.order.id),
        name: data.order.name,
        ranges,
        obleas: preview.items,
        createdAt: data.order.created_at || new Date().toISOString(),
      };
      setGroups((prev) => [newGroup, ...prev]);

      let msg = `Orden creada, ${data.inserted} obleas insertadas`;
      if (data.duplicates?.length) msg += `, ${data.duplicates.length} duplicadas`;
      setOkMsg(msg);

      resetForm();
    } catch (err: any) {
      setErrMsg(err?.message || "Error al guardar la orden");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="w-full px-6 py-6">
        <article className="flex items-center justify-between text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
            <ChevronRight size={16} className="sm:w-5 sm:h-5" />
            <span className="text-[#0040B8] font-medium">Obleas</span>
          </div>
        </article>

        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl text-[#0040B8] mb-2 sm:mb-3">
            Asignar obleas al taller
          </h2>
          <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Creá packs de obleas, generá las obleas que necesitás y guardalas para usarlas.
          </p>
        </div>

        {(errMsg || okMsg) && (
          <div className="mb-4">
            {errMsg && (
              <div className="rounded-[4px] border border-rose-300 bg-rose-50 text-rose-700 px-3 py-2 text-sm">
                {errMsg}
              </div>
            )}
            {okMsg && (
              <div className="rounded-[4px] border border-emerald-300 bg-emerald-50 text-emerald-700 px-3 py-2 text-sm">
                {okMsg}
              </div>
            )}
          </div>
        )}

        <section className="w-full">
          <div className="rounded-[10px] border border-[#d3d3d3] bg-white">
           <div className="p-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-[#0040B8]" />
              Nuevo pack de obleas
            </h2>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-700 mb-1">Nombre del pack (opcional)</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ej: Obleas Septiembre 2025"
                  className="w-full rounded-[4px] border border-gray-300 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm text-gray-700 mb-1">Fecha de vencimiento</label>
                <input
                  type="date"
                  value={noExpiry ? "" : expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  disabled={noExpiry}
                  className={clsx(
                    "w-full rounded-[4px] border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent",
                    noExpiry ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" : "border-gray-300"
                  )}
                />
                <label className="inline-flex items-center gap-2 text-sm mt-2">
                  <input
                    type="checkbox"
                    checked={noExpiry}
                    onChange={(e) => setNoExpiry(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Sin vencimiento
                </label>
              </div>
            </div>
          </div>

            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <SquareStack className="h-4 w-4 text-[#0040B8]" />
                  Rangos del pack de obleas
                </h3>
                <button
                  onClick={addRange}
                  className="inline-flex items-center gap-2 rounded-[4px] border border-[#0040B8] text-[#0040B8] px-3 py-1.5 text-xs font-medium hover:bg-[#0040B8]/5"
                >
                  <Plus className="h-4 w-4" />
                  Agregar rango
                </button>
              </div>

              {/* Lista de rangos */}
              <div className="mt-4 space-y-3">
                {ranges.map((r, idx) => (
                  <div key={r.id} className="rounded-[4px] border border-gray-200 p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block text-xs text-gray-600 mb-1">Prefijo (opcional)</label>
                        <input
                          value={r.lead}
                          onChange={(e) => updateRange(r.id, { lead: e.target.value })}
                          className="w-full rounded-[4px] border border-gray-300 px-2 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
                          placeholder="RA"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs text-gray-600 mb-1">Desde</label>
                        <input
                          value={r.start}
                          onChange={(e) => updateRange(r.id, { start: e.target.value })}
                          className="w-full rounded-[4px] border border-gray-300 px-2 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
                          placeholder="0001"
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                        <p className="mt-1 text-[11px] text-gray-500">Podés usar ceros, por ejemplo 0001</p>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                        <input
                          value={r.end}
                          onChange={(e) => updateRange(r.id, { end: e.target.value })}
                          className="w-full rounded-[4px] border border-gray-300 px-2 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
                          placeholder="0050"
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs text-gray-600 mb-1">Sufijo (opcional)</label>
                        <input
                          value={r.tail}
                          onChange={(e) => updateRange(r.id, { tail: e.target.value })}
                          className="w-full rounded-[4px] border border-gray-300 px-2 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
                          placeholder="-X"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-500">Rango {idx + 1}</span>
                      {ranges.length > 1 && (
                        <button
                          onClick={() => removeRange(r.id)}
                          className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 text-xs"
                        >
                          <Trash2 className="h-4 w-4" />
                          Quitar rango
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen y vista previa */}
              <div className="mt-4 rounded-[4px] border border-gray-200 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-sm">
                    <span className="text-gray-700 font-medium">Cantidad de obleas a asignar:</span>{" "}
                    <span className="text-gray-900 font-semibold">{calculatedQty}</span>
                  </div>

                  {preview.dupCount > 0 && (
                    <div className="inline-flex items-center gap-2 text-xs rounded-[4px] border border-amber-300 bg-amber-50 px-2 py-1 text-amber-800">
                      <AlertTriangle className="h-4 w-4" />
                      {preview.dupCount} repetidas, no se guardan
                    </div>
                  )}

                  {preview.error && (
                    <div className="w-full md:w-auto inline-flex items-center gap-2 text-xs rounded-[4px] border border-rose-300 bg-rose-50 px-2 py-1 text-rose-700">
                      <AlertTriangle className="h-4 w-4" />
                      {preview.error}
                    </div>
                  )}
                </div>

                {/* Vista previa removida */}
              </div>

              <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
                <button
                  onClick={resetForm}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-[4px] border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60"
                >
                  Limpiar
                </button>
                <button
                  onClick={saveGroup}
                  disabled={!canSave || isSaving}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-[4px] px-4 py-2 text-sm text-white",
                    canSave && !isSaving ? "bg-[#0040B8] hover:bg-[#00379f]" : "bg-[#0040B8]/50 cursor-not-allowed"
                  )}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Guardando..." : "Guardar pack"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {groups.length > 0 && (
          <div className="mt-8">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Últimos packs de obleas creados</h3>
            <ul className="space-y-2">
              {groups.map((g) => (
                <li key={g.id} className="rounded border border-gray-200 p-3 text-sm">
                  <div className="font-medium">{g.name}</div>
                  <div className="text-gray-500">{g.obleas.length} obleas</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="h-2" />
      </div>
    </div>
  );
}
