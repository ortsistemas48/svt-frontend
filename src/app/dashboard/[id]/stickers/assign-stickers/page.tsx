"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Save,
  Trash2,
  ChevronDown,
  ChevronUp,
  Layers,
  ChevronRight,
  SquareStack,
  AlertTriangle,
} from "lucide-react";
import clsx from "clsx";

/* ===================== Tipos ===================== */
type RangeInput = {
  id: string;
  lead: string;
  start: string;
  end: string;
  tail: string;
};

type Group = {
  id: string;
  name: string;
  note?: string;
  ranges: RangeInput[];
  obleas: string[];
  createdAt: string;
};

/* ===================== Utils ===================== */
const uid = () => Math.random().toString(36).slice(2, 10);

function digitsOnly(v: string) {
  return v.replace(/\D/g, "");
}
function toNumberOrNaN(v: string): number {
  const d = digitsOnly(v);
  if (d === "") return NaN;
  const n = Number(d);
  return Number.isFinite(n) ? n : NaN;
}

/** Genera un rango, respeta el ancho según lo escrito en start/end */
function genRange(r: RangeInput): { list: string[]; error?: string } {
  const startDigits = digitsOnly(r.start);
  const endDigits = digitsOnly(r.end);
  const start = toNumberOrNaN(r.start);
  const end = toNumberOrNaN(r.end);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return { list: [], error: "Ingresá números válidos en inicio y fin." };
  }
  if (end < start) {
    return { list: [], error: "El fin no puede ser menor que el inicio." };
  }

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
      if (seen.has(it)) {
        dups.add(it);
        continue;
      }
      seen.add(it);
      out.push(it);
    }
  }
  return { list: out, dups };
}

/* ===================== Componente ===================== */
export default function AsignarObleasPage() {
  const { id } = useParams<{ id: string }>();

  // Form del grupo
  const [groupName, setGroupName] = useState("");
  const [groupNote, setGroupNote] = useState("");
  const [ranges, setRanges] = useState<RangeInput[]>([
    { id: uid(), lead: "", start: "", end: "", tail: "" },
  ]);
  const [showPreview, setShowPreview] = useState(false);

  // Grupos guardados locales
  const [groups, setGroups] = useState<Group[]>([]);

  // Preview
  const preview = useMemo(() => {
    const results = ranges.map((r) => genRange(r));
    const anyError = results.find((r) => r.error)?.error;
    const { list, dups } = flattenUnique(results.map((r) => r.list));
    return { total: list.length, items: list, dupCount: dups.size, error: anyError };
  }, [ranges]);

  /* ===================== Handlers ===================== */
  const addRange = () => setRanges((prev) => [...prev, { id: uid(), lead: "", start: "", end: "", tail: "" }]);
  const removeRange = (rid: string) => setRanges((prev) => prev.filter((r) => r.id !== rid));
  const updateRange = (rid: string, patch: Partial<RangeInput>) =>
    setRanges((prev) => prev.map((r) => (r.id === rid ? { ...r, ...patch } : r)));

  const resetForm = () => {
    setGroupName("");
    setGroupNote("");
    setRanges([{ id: uid(), lead: "", start: "", end: "", tail: "" }]);
    setShowPreview(false);
  };

  const canSave = groupName.trim().length > 0 && ranges.length > 0 && !preview.error && preview.total > 0;

  const saveGroup = () => {
    if (!canSave) return;
    const newGroup: Group = {
      id: uid(),
      name: groupName.trim(),
      note: groupNote.trim() || undefined,
      ranges,
      obleas: preview.items,
      createdAt: new Date().toISOString(),
    };
    setGroups((prev) => [newGroup, ...prev]);
    resetForm();
  };

  /* ===================== UI ===================== */
  return (
    <div className="bg-white">
      {/* contenedor ancho completo con px-6 */}
      <div className="w-full px-6 py-6">
        {/* Migas */}
        <article className="flex items-center justify-between text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
            <ChevronRight size={16} className="sm:w-5 sm:h-5" />
            <span className="text-[#0040B8] font-medium">Obleas</span>
          </div>
        </article>

        {/* Header centrado */}
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl text-[#0040B8] mb-2 sm:mb-3">
            Asignar obleas al taller
          </h2>
          <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Creá grupos y rangos, generá las obleas que necesitás y guardalas para usarlas.
          </p>
        </div>


        {/* Sección principal full width */}
        <section className="w-full">
          <div className="rounded-[10px] border border-[#d3d3d3] bg-white">
            {/* Datos del grupo */}
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#0040B8]" />
                Nuevo grupo
              </h2>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700 mb-1">Nombre del grupo</label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ej, Obleas Septiembre 2025"
                    className="w-full rounded-md border border-gray-300 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-sm text-gray-700 mb-1">Nota, opcional</label>
                  <input
                    type="text"
                    value={groupNote}
                    onChange={(e) => setGroupNote(e.target.value)}
                    placeholder="Observaciones"
                    className="w-full rounded-md border border-gray-300 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Rangos */}
            <div className="p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <SquareStack className="h-4 w-4 text-[#0040B8]" />
                  Rangos del grupo
                </h3>
                <button
                  onClick={addRange}
                  className="inline-flex items-center gap-2 rounded-md border border-[#0040B8] text-[#0040B8] px-3 py-1.5 text-xs font-medium hover:bg-[#0040B8]/5"
                >
                  <Plus className="h-4 w-4" />
                  Agregar rango
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {ranges.map((r, idx) => (
                  <div key={r.id} className="rounded-md border border-gray-200 p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block text-xs text-gray-600 mb-1">Prefijo</label>
                        <input
                          value={r.lead}
                          onChange={(e) => updateRange(r.id, { lead: e.target.value })}
                          className="w-full rounded-md border border-gray-300 px-2 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
                          placeholder="ABC"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs text-gray-600 mb-1">Número inicial</label>
                        <input
                          value={r.start}
                          onChange={(e) => updateRange(r.id, { start: e.target.value })}
                          className="w-full rounded-md border border-gray-300 px-2 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
                          placeholder="0001"
                          inputMode="numeric"
                        />
                        <p className="mt-1 text-[11px] text-gray-500">Podés usar ceros, por ejemplo 0001</p>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs text-gray-600 mb-1">Número final</label>
                        <input
                          value={r.end}
                          onChange={(e) => updateRange(r.id, { end: e.target.value })}
                          className="w-full rounded-md border border-gray-300 px-2 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
                          placeholder="0050"
                          inputMode="numeric"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs text-gray-600 mb-1">Sufijo</label>
                        <input
                          value={r.tail}
                          onChange={(e) => updateRange(r.id, { tail: e.target.value })}
                          className="w-full rounded-md border border-gray-300 px-2 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
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
              <div className="mt-4 rounded-md border border-gray-200 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-sm">
                    <span className="text-gray-700 font-medium">Total en vista previa,</span>{" "}
                    <span className="text-gray-900 font-semibold">{preview.total}</span>
                  </div>

                  {preview.dupCount > 0 && (
                    <div className="inline-flex items-center gap-2 text-xs rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-amber-800">
                      <AlertTriangle className="h-4 w-4" />
                      {preview.dupCount} repetidas, no se guardan
                    </div>
                  )}

                  {preview.error && (
                    <div className="w-full md:w-auto inline-flex items-center gap-2 text-xs rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-rose-700">
                      <AlertTriangle className="h-4 w-4" />
                      {preview.error}
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <button
                    onClick={() => setShowPreview((s) => !s)}
                    className="inline-flex items-center gap-2 text-xs text-[#0040B8] hover:underline"
                  >
                    {showPreview ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Ocultar detalle
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Ver detalle
                      </>
                    )}
                  </button>

                  {showPreview && (
                    <div className="mt-3 max-h-56 overflow-y-auto rounded border border-gray-200 p-2 text-xs [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-300/70 [&::-webkit-scrollbar-thumb]:rounded-full bg-white">
                      {preview.items.length === 0 ? (
                        <div className="text-gray-500 text-center py-6">Sin elementos en la vista previa</div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {preview.items.map((it, i) => (
                            <span
                              key={`${it}-${i}`}
                              className="inline-block rounded border border-gray-200 px-2 py-1 text-gray-700 bg-white"
                            >
                              {it}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="mt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
                <button
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Limpiar
                </button>
                <button
                  onClick={saveGroup}
                  disabled={!canSave}
                  className={clsx(
                    "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm text-white",
                    canSave ? "bg-[#0040B8] hover:bg-[#00379f]" : "bg-[#0040B8]/50 cursor-not-allowed"
                  )}
                >
                  <Save className="h-4 w-4" />
                  Guardar grupo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* espacio inferior */}
        <div className="h-2" />
      </div>
    </div>
  );
}
