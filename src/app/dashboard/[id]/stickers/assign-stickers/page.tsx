"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  Save,
  Trash2,
  Layers,
  ChevronRight,
  ChevronLeft,
  SquareStack,
  AlertTriangle,
} from "lucide-react";
import clsx from "clsx";

/* ===================== Config ===================== */
const API = "/api";

/* ===================== Tipos ===================== */
type RangeInput = { id: string; lead: string; start: string; end: string; };

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
    items.push(`${r.lead || ""}${num}`);
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
  const router = useRouter();
  const workshopId = Number(params.id);

  const [groupName, setGroupName] = useState("");
  const [ranges, setRanges] = useState<RangeInput[]>([{ id: uid(), lead: "", start: "", end: "" }]);

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
      // Incluir ambos extremos: si va de 100 a 103, son 4 obleas (100, 101, 102, 103)
      return acc + (end - start + 1);
    }, 0);
  }, [ranges]);

  const preview = useMemo(() => {
    const results = ranges.map((r) => genRange(r));
    const anyError = results.find((r) => r.error)?.error;
    const { list, dups } = flattenUnique(results.map((r) => r.list));
    return { total: list.length, items: list, dupCount: dups.size, error: anyError };
  }, [ranges]);

  const addRange = () => setRanges((prev) => [...prev, { id: uid(), lead: "", start: "", end: "" }]);
  const removeRange = (rid: string) => setRanges((prev) => prev.filter((r) => r.id !== rid));
  const updateRange = (rid: string, patch: Partial<RangeInput>) =>
    setRanges((prev) => prev.map((r) => (r.id === rid ? { ...r, ...patch } : r)));

  const resetForm = () => {
    setGroupName("");
    setRanges([{ id: uid(), lead: "", start: "", end: "" }]);
  };

  const canSave =
    !!workshopId &&
    ranges.length > 0 &&
    !preview.error &&
    preview.total > 0;

  const saveGroup = async () => {
    setErrMsg(null);
    setOkMsg(null);
    if (!canSave) return;

    try {
      setIsSaving(true);

      const body = {
        workshop_id: workshopId,
        name: groupName.trim() || "",
        stickers: preview.items,
        expiration_date: null,
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
      <div className="w-full px-0 sm:px-4 md:px-6 py-3 sm:py-6">
        <article className="flex items-center justify-between text-xs sm:text-sm md:text-base lg:text-lg mb-2 sm:mb-4 md:mb-6 px-1 sm:px-0">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
            <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
            <span className="text-[#0040B8] font-medium">Obleas</span>
          </div>
        </article>

        <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-10 px-1 sm:px-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#0040B8] mb-2 sm:mb-3">
            Asignar obleas al taller
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Creá packs de obleas, generá las obleas que necesitás y guardalas para usarlas.
          </p>
        </div>
        {(errMsg || okMsg) && (
          <div className="mb-4 mx-1 sm:mx-0">
            {errMsg && (
              <div className="rounded-[4px] border border-rose-300 bg-rose-50 text-rose-700 px-3 py-2 text-xs sm:text-sm">
                {errMsg}
              </div>
            )}
            {okMsg && (
              <div className="rounded-[4px] border border-emerald-300 bg-emerald-50 text-emerald-700 px-3 py-2 text-xs sm:text-sm">
                {okMsg}
              </div>
            )}
          </div>
        )}

        <section className="w-full mx-1 sm:mx-0">
          <div className="rounded-lg sm:rounded-[14px] border border-[#d3d3d3] bg-white">
           <div className="p-3 sm:p-4 md:p-5 border-b border-gray-100">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
              <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-[#0040B8]" />
              Nuevo pack de obleas
            </h2>

            <div className="mt-3 sm:mt-4">
              <div>
                <label className="block text-xs sm:text-sm text-gray-700 mb-1">Nombre del pack (opcional)</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ej: Obleas Septiembre 2025"
                  className="w-full rounded-[4px] border border-gray-300 px-3 py-2.5 sm:py-3 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
                />
              </div>
            </div>
          </div>

            <div className="p-3 sm:p-4 md:p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <SquareStack className="h-3 w-3 sm:h-4 sm:w-4 text-[#0040B8]" />
                  Rangos del pack de obleas
                </h3>
                <button
                  onClick={addRange}
                  className="inline-flex items-center gap-2 rounded-[4px] border border-[#0040B8] text-[#0040B8] px-3 py-1.5 text-xs font-medium hover:bg-[#0040B8]/5 w-full sm:w-auto"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  Agregar rango
                </button>
              </div>

              {/* Lista de rangos */}
              <div className="mt-3 sm:mt-4 space-y-3">
                {ranges.map((r, idx) => (
                  <div key={r.id} className="rounded-[4px] border border-gray-200 p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="block text-xs text-gray-600 mb-1">Prefijo (opcional)</label>
                        <input
                          value={r.lead}
                          onChange={(e) => updateRange(r.id, { lead: e.target.value.toUpperCase() })}
                          className="w-full rounded-[4px] border border-gray-300 px-2 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent uppercase"
                          placeholder="RA"
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-xs text-gray-600 mb-1">Desde</label>
                        <input
                          value={r.start}
                          onChange={(e) => updateRange(r.id, { start: e.target.value })}
                          className="w-full rounded-[4px] border border-gray-300 px-2 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
                          placeholder="0001"
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                        <p className="mt-1 text-[10px] sm:text-[11px] text-gray-500">Podés usar ceros, por ejemplo 0001</p>
                      </div>

                      <div className="sm:col-span-1">
                        <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                        <input
                          value={r.end}
                          onChange={(e) => updateRange(r.id, { end: e.target.value })}
                          className="w-full rounded-[4px] border border-gray-300 px-2 py-2 sm:py-2.5 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
                          placeholder="0050"
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-gray-500">Rango {idx + 1}</span>
                      {ranges.length > 1 && (
                        <button
                          onClick={() => removeRange(r.id)}
                          className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 text-[10px] sm:text-xs"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          Quitar rango
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumen y vista previa */}
              <div className="mt-3 sm:mt-4 rounded-[4px] border border-gray-200 p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
                  <div className="text-xs sm:text-sm">
                    <span className="text-gray-700 font-medium">Cantidad de obleas a asignar:</span>{" "}
                    <span className="text-gray-900 font-semibold">{calculatedQty}</span>
                  </div>

                  {preview.dupCount > 0 && (
                    <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs rounded-[4px] border border-amber-300 bg-amber-50 px-2 py-1 text-amber-800">
                      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                      {preview.dupCount} repetidas, no se guardan
                    </div>
                  )}

                  {preview.error && (
                    <div className="w-full sm:w-auto inline-flex items-center gap-2 text-[10px] sm:text-xs rounded-[4px] border border-rose-300 bg-rose-50 px-2 py-1 text-rose-700">
                      <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                      {preview.error}
                    </div>
                  )}
                </div>

                {/* Vista previa removida */}
              </div>

              <div className="mt-4 sm:mt-5 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-end">
                <button
                  onClick={saveGroup}
                  disabled={!canSave || isSaving}
                  className={clsx(
                    "inline-flex items-center justify-center gap-2 rounded-[4px] px-4 py-2.5 sm:py-2 text-xs sm:text-sm text-white w-full sm:w-auto",
                    canSave && !isSaving ? "bg-[#0040B8] hover:bg-[#00379f]" : "bg-[#0040B8]/50 cursor-not-allowed"
                  )}
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                  {isSaving ? "Guardando..." : "Guardar pack"}
                </button>
                <button
                  onClick={resetForm}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-[4px] border border-gray-300 bg-white px-4 py-2.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-50 disabled:opacity-60 w-full sm:w-auto"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </section>

        {groups.length > 0 && (
          <div className="mt-6 sm:mt-8 mx-1 sm:mx-0">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Últimos packs de obleas creados</h3>
            <ul className="space-y-2">
              {groups.map((g) => (
                <li key={g.id} className="rounded border border-gray-200 p-3 text-xs sm:text-sm">
                  <div className="font-medium">{g.name}</div>
                  <div className="text-gray-500">{g.obleas.length} obleas</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 sm:mt-8 flex justify-center px-1 sm:px-0">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 rounded-[4px] border border-gray-300 bg-white px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto min-w-[120px] sm:min-w-[140px]"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            Volver
          </button>
        </div>

        <div className="h-2" />
      </div>
    </div>
  );
}
