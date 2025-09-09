"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Settings,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Loader2,
  Pencil,
  Trash2,
  ChevronRight,
  Plus,
  Check,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Workshop = {
  id: number;
  name: string;
  razonSocial: string;
  phone: string;
  cuit: string;
  province: string;
  city: string;
  plant_number: number | null;
};

type StepRow = {
  step_id: number;
  name: string;
  description: string | null;
  number: number;
};

type Observation = { id: number; description: string };

const API = process.env.NEXT_PUBLIC_API_URL || "";

export default function WorkshopSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const workshopId = Number(id);

  // Datos del taller
  const [ws, setWs] = useState<Workshop | null>(null);
  const [phone, setPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  // Pasos
  const [steps, setSteps] = useState<StepRow[]>([]);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [err, setErr] = useState("");

  // Observaciones
  const [obsOpen, setObsOpen] = useState(false);
  const [obsStep, setObsStep] = useState<{ step_id: number; title: string; description?: string | null } | null>(null);
  const [obs, setObs] = useState<Observation[]>([]);
  const [obsLoading, setObsLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  // Toggle de animación de layout
  const [layoutOn, setLayoutOn] = useState(true);

  // Cargar taller
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setErr("");
        const res = await fetch(`${API}/workshops/${workshopId}`, { credentials: "include" });
        if (!res.ok) throw new Error("No se pudo cargar el taller");
        const data = (await res.json()) as Workshop;
        if (cancel) return;
        setWs(data);
        setPhone(data.phone ?? "");
      } catch (e: any) {
        if (!cancel) setErr(e.message || "Error al cargar el taller");
      }
    })();
    return () => {
      cancel = true;
    };
  }, [workshopId]);

  // Cargar pasos
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoadingSteps(true);
        const res = await fetch(`${API}/workshops/${workshopId}/steps-order`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("No se pudo cargar el orden de pasos");
        const data = (await res.json()) as StepRow[];
        if (!cancel) setSteps(data.sort((a, b) => a.number - b.number));
      } catch (e: any) {
        if (!cancel) setErr(e.message || "Error al cargar pasos");
      } finally {
        if (!cancel) setLoadingSteps(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [workshopId]);

  // Phone handler
  const savePhone = async () => {
    try {
      setSavingPhone(true);
      setErr("");
      const res = await fetch(`${API}/workshops/${workshopId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "No se pudo guardar el teléfono");
      }
      // Update the workshop data
      setWs(prev => prev ? { ...prev, phone: phone.trim() } : null);
    } catch (e: any) {
      setErr(e.message || "Error al guardar el teléfono");
    } finally {
      setSavingPhone(false);
    }
  };

  // Split en 2 columnas
  const mid = Math.ceil(steps.length / 2);
  const left = steps.slice(0, mid);
  const right = steps.slice(mid);

  // Drag and drop (sin animación de layout durante drag)
  const dragIndex = useRef<number | null>(null);
  const onDragStartIdx = (globalIdx: number) => () => {
    dragIndex.current = globalIdx;
    setLayoutOn(false); // desactiva animación al arrastrar
  };
  const onDragOverIdx = (globalIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === globalIdx) return;
    setSteps((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(globalIdx, 0, item);
      dragIndex.current = globalIdx;
      return arr.map((s, i) => ({ ...s, number: i + 1 }));
    });
  };
  const onDragEnd = () => {
    dragIndex.current = null;
    setLayoutOn(true); // vuelve a activar animación
  };

  // Reordenar con flechas (con animación)
  const move = (index: number, dir: -1 | 1) => {
    setLayoutOn(true); // asegura animación en este caso
    setSteps((prev) => {
      const arr = [...prev];
      const j = index + dir;
      if (j < 0 || j >= arr.length) return arr;
      [arr[index], arr[j]] = [arr[j], arr[index]];
      return arr.map((s, idx) => ({ ...s, number: idx + 1 }));
    });
  };

  const saveOrder = async () => {
    try {
      setSavingOrder(true);
      setErr("");
      const items = steps.map((s) => ({ step_id: s.step_id, number: s.number }));
      const res = await fetch(`${API}/workshops/${workshopId}/steps-order`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "No se pudo guardar el orden");
      }
    } catch (e: any) {
      setErr(e.message || "Error al guardar el orden");
    } finally {
      setSavingOrder(false);
    }
  };

  // Observaciones
  const openObs = async (s: StepRow) => {
    setObsStep({ step_id: s.step_id, title: s.name, description: s.description });
    setObsOpen(true);
    setObs([]);
    setEditingId(null);
    setComposerOpen(false);
    setInputValue("");
    try {
      setObsLoading(true);
      const res = await fetch(
        `${API}/workshops/${workshopId}/steps/${s.step_id}/observations`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("No se pudieron cargar las observaciones");
      const data = (await res.json()) as Observation[];
      setObs(data);
    } catch (e: any) {
      setErr(e.message || "Error al cargar observaciones");
    } finally {
      setObsLoading(false);
    }
  };

  const createObs = async () => {
    const desc = inputValue.trim();
    if (!desc) return;
    const res = await fetch(
      `${API}/workshops/${workshopId}/steps/${obsStep!.step_id}/observations`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc }),
      }
    );
    if (!res.ok) return;
    const created = await res.json();
    setObs((prev) => [...prev, created]);
    setComposerOpen(false);
    setInputValue("");
  };

  const startEdit = (o: Observation) => {
    setEditingId(o.id);
    setComposerOpen(true);
    setInputValue(o.description);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const desc = inputValue.trim();
    if (!desc) return;
    const res = await fetch(
      `${API}/workshops/${workshopId}/steps/${obsStep!.step_id}/observations/${editingId}`,
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc }),
      }
    );
    if (!res.ok) return;
    setObs((prev) => prev.map((o) => (o.id === editingId ? { ...o, description: desc } : o)));
    setEditingId(null);
    setComposerOpen(false);
    setInputValue("");
  };

  const cancelEditOrAdd = () => {
    setEditingId(null);
    setComposerOpen(false);
    setInputValue("");
  };

  const removeObs = async (idObs: number) => {
    const res = await fetch(
      `${API}/workshops/${workshopId}/steps/${obsStep!.step_id}/observations/${idObs}`,
      {
        method: "DELETE",
        credentials: "include",
      }
    );
    if (!res.ok) return;
    setObs((prev) => prev.filter((o) => o.id !== idObs));
    if (editingId === idObs) cancelEditOrAdd();
  };

  return (
    <div className="min-h-screen px-4 md:px-10 py-8">
      {/* Breadcrumb */}
      <article className="flex items-center justify-between text-lg mb-6">
        <div className="flex items-center gap-1">
          <span>Inicio</span>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">Configuración</span>
        </div>
      </article>

      {err && <p className="mb-4 text-sm text-red-600">{err}</p>}

      {/* Sección 1, información */}
      <section className="mb-10 mt-14">
        <h2 className="text-[#0040B8] text-lg">Información del taller</h2>
        <p className="text-sm text-[#00000080] mb-4">
          Solo puedes actualizar el número de teléfono. El resto de la información es de solo lectura.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Nombre"
            value={ws?.name ?? ""}
            placeholder="Taller BV San Juan 887"
            readOnly
            
          />
          <Field
            label="Teléfono"
            value={phone}
            onChange={setPhone}
            placeholder="3510000000"
          />
          <Field
            label="CUIT"
            value={ws?.cuit ?? ""}
            placeholder="20-00000000-0"
            readOnly
          />
          <Field
            label="Razón social"
            value={ws?.razonSocial ?? ""}
            placeholder="Ejemplo SRL"
            readOnly
          />
          <Field label="Ubicación" value={ws ? `${ws.city}, ${ws.province}` : ""} readOnly />
          <Field label="Nº de planta" value={ws?.plant_number?.toString() ?? ""} readOnly />
        </div>

        <div className="mt-10">
          <button
            onClick={savePhone}
            disabled={savingPhone}
            className="inline-flex items-center gap-2 rounded-[4px] bg-[#0040B8] duration-150 text-white px-5 py-3 hover:bg-[#0A4DCC] disabled:opacity-60"
          >
            {savingPhone && <Loader2 className="animate-spin" size={16} />} Guardar teléfono
          </button>
        </div>
      </section>

      <hr className="my-8" />

      {/* Sección 2, ordenar pasos */}
      <section>
        <h2 className="text-[#0040B8] text-lg mb-1">Ordena los pasos para la inspección técnica</h2>
        <p className="text-sm text-[#00000080] mb-10">
          Mantené presionado el ícono de arrastre para reordenar, tocá el engranaje para configurar las observaciones del paso.
        </p>

        {loadingSteps ? (
          <div className="md:grid md:grid-cols-2 md:gap-4">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`s1-${i}`}
                  className="h-14 rounded-[4px] border border-gray-200 bg-white overflow-hidden"
                >
                  <div className="h-full w-full animate-pulse bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
                </div>
              ))}
            </div>
            <div className="space-y-4 mt-4 md:mt-0">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`s2-${i}`}
                  className="h-14 rounded-[4px] border border-gray-200 bg-white overflow-hidden"
                >
                  <div className="h-full w-full animate-pulse bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="md:grid md:grid-cols-2 md:gap-4">
            {/* Columna izquierda */}
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {left.map((s, i) => {
                  const globalIdx = i;
                  return (
                    <motion.div
                      key={s.step_id}
                      layout={layoutOn}
                      initial={false}
                      transition={
                        layoutOn
                          ? { type: "spring", stiffness: 350, damping: 26, mass: 0.6 }
                          : undefined
                      }
                      className="flex items-center gap-3 rounded-[4px] border border-gray-200 bg-white p-3 cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={onDragStartIdx(globalIdx)}
                      onDragOver={onDragOverIdx(globalIdx)}
                      onDragEnd={onDragEnd}
                    >
                      <div className="w-6 text-xs text-gray-500">{globalIdx + 1}</div>

                      <button className="p-1 rounded-[4px] hover:bg-gray-100" title="Arrastrar">
                        <GripVertical size={18} />
                      </button>

                      <div className="flex-1">
                        <div className="text-sm font-medium">{s.name}</div>
                        {/* sin descripción */}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => move(globalIdx, -1)}
                          className="p-1 rounded-[4px] border hover:bg-gray-50"
                          title="Subir"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          onClick={() => move(globalIdx, +1)}
                          className="p-1 rounded-[4px] border hover:bg-gray-50"
                          title="Bajar"
                        >
                          <ChevronDown size={16} />
                        </button>
                        <button
                          onClick={() => openObs(s)}
                          className="ml-2 p-1.5 rounded-[4px] border hover:bg-gray-50"
                          title="Configurar observaciones"
                        >
                          <Settings size={16} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Columna derecha */}
            <div className="space-y-4 mt-4 md:mt-0">
              <AnimatePresence initial={false}>
                {right.map((s, i) => {
                  const globalIdx = mid + i;
                  return (
                    <motion.div
                      key={s.step_id}
                      layout={layoutOn}
                      initial={false}
                      transition={
                        layoutOn
                          ? { type: "spring", stiffness: 350, damping: 26, mass: 0.6 }
                          : undefined
                      }
                      className="flex items-center gap-3 rounded-[4px] border border-gray-200 bg-white p-3 cursor-grab active:cursor-grabbing"
                      draggable
                      onDragStart={onDragStartIdx(globalIdx)}
                      onDragOver={onDragOverIdx(globalIdx)}
                      onDragEnd={onDragEnd}
                    >
                      <div className="w-6 text-xs text-gray-500">{globalIdx + 1}</div>

                      <button className="p-1 rounded-[4px] hover:bg-gray-100" title="Arrastrar">
                        <GripVertical size={18} />
                      </button>

                      <div className="flex-1">
                        <div className="text-sm font-medium">{s.name}</div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => move(globalIdx, -1)}
                          className="p-1 rounded-[4px] border hover:bg-gray-50"
                          title="Subir"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          onClick={() => move(globalIdx, +1)}
                          className="p-1 rounded-[4px] border hover:bg-gray-50"
                          title="Bajar"
                        >
                          <ChevronDown size={16} />
                        </button>
                        <button
                          onClick={() => openObs(s)}
                          className="ml-2 p-1.5 rounded-[4px] border hover:bg-gray-50"
                          title="Configurar observaciones"
                        >
                          <Settings size={16} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Botones centrados */}
        <div className="mt-14 flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="rounded-[4px] border border-[#0A4DCC] text-[#0A4DCC] px-6 py-3 hover:bg-[#0A4DCC] hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={saveOrder}
            disabled={savingOrder}
            className="rounded-[4px] bg-[#0A4DCC] text-white px-6 py-3 hover:bg-[#0843B2] disabled:opacity-60"
          >
            {savingOrder ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </section>

      {/* Modal Observaciones */}
      {obsOpen && obsStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setObsOpen(false);
              cancelEditOrAdd();
            }}
          />
          <div className="relative w-full max-w-2xl rounded-[8px] bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold">{obsStep.title}</h3>
            {obsStep.description && (
              <p className="text-xs text-gray-500 mt-1">{obsStep.description}</p>
            )}

            <div className="h-px bg-gray-200 my-4" />

            {obsLoading ? (
              <p className="text-sm text-gray-600">Cargando…</p>
            ) : (
              <div>
                {obs.length === 0 && !composerOpen && (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-600">No tienes ninguna observación</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Agrega observaciones tocando el botón de abajo.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {obs.map((o) => (
                    <div key={o.id} className="flex items-center gap-2">
                      <input
                        className="flex-1 rounded-[4px] border px-3 py-2 text-sm bg-gray-50"
                        value={o.description}
                        readOnly
                      />
                      <button
                        onClick={() => startEdit(o)}
                        className="p-2 rounded-[4px] border hover:bg-gray-50"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => removeObs(o.id)}
                        className="p-2 rounded-[4px] border hover:bg-gray-50"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {composerOpen && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      autoFocus
                      className="flex-1 rounded-[4px] border px-3 py-2 text-sm"
                      placeholder="Escribe la observación"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                    {editingId ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="h-9 w-9 flex items-center justify-center rounded-[4px] bg-emerald-600 text-white hover:bg-emerald-700"
                          title="Guardar"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelEditOrAdd}
                          className="h-9 w-9 flex items-center justify-center rounded-[4px] bg-gray-200 hover:bg-gray-300"
                          title="Cancelar"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={createObs}
                          disabled={!inputValue.trim()}
                          className="h-9 w-9 flex items-center justify-center rounded-[4px] bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                          title="Agregar"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelEditOrAdd}
                          className="h-9 w-9 flex items-center justify-center rounded-[4px] bg-gray-200 hover:bg-gray-300"
                          title="Cancelar"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    setComposerOpen(true);
                    setEditingId(null);
                    setInputValue("");
                  }}
                  className="mt-6 w-full flex items-center justify-center gap-2 rounded-[4px] bg-[#EDF2FF] text-[#0040B8] py-3 hover:bg-[#E3EAFF]"
                >
                  <Plus size={18} />
                  Agregar nueva observación
                </button>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setObsOpen(false);
                  cancelEditOrAdd();
                }}
                className="rounded-[4px] border border-gray-300 px-4 py-2 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Campo reutilizable */
function Field({
  label,
  value,
  onChange,
  placeholder,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="text-black">{label}</span>
      <input
        className={`mt-1 w-full rounded-[4px] border px-4 py-3 ${
          readOnly ? "bg-gray-100 text-gray-700 border-gray-200" : "border-gray-300"
        }`}
        value={value}
        readOnly={!!readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
