// components/VehicleDocsSimpleDrop.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Check, X, Trash2, Image as ImageIcon } from "lucide-react";

export type CarDocType =
  | "green_card_front"
  | "green_card_back"
  | "license_front"
  | "license_back"
  | "insurance_front"
  | "insurance_back";

export type PendingCarDoc = { file: File; type: CarDocType };

export type ExistingDoc = {
  id: number;
  file_name: string;
  file_url: string;
  size_bytes?: number;
  mime_type?: string;
  created_at?: string;
  type?: CarDocType | string | null;
};

type Props = {
  existing?: ExistingDoc[];
  resetToken?: number | string;
  onPendingChange?: (items: PendingCarDoc[]) => void;
  onDeleteExisting?: (docId: number) => Promise<void> | void;
};

const accept = ["image/png", "image/jpeg", "image/webp"];

const GROUPS = ["Cédula", "Licencia", "Seguro"] as const;
type Group = typeof GROUPS[number];

const groupToTypes: Record<Group, { front: CarDocType; back: CarDocType }> = {
  "Cédula": { front: "green_card_front", back: "green_card_back" },
  "Licencia": { front: "license_front", back: "license_back" },
  "Seguro": { front: "insurance_front", back: "insurance_back" },
};

const ALL_TYPES: CarDocType[] = [
  "green_card_front",
  "green_card_back",
  "license_front",
  "license_back",
  "insurance_front",
  "insurance_back",
];

function prettySize(bytes?: number) {
  if (bytes == null) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

export default function VehicleDocsSimpleDrop({
  existing = [],
  resetToken,
  onPendingChange,
  onDeleteExisting,
}: Props) {
  // helpers para inicialización
  const makeEmptyQueue = () =>
    Object.fromEntries(ALL_TYPES.map((t) => [t, null])) as Record<CarDocType, File | null>;
  const makeEmptyPreviews = () =>
    Object.fromEntries(ALL_TYPES.map((t) => [t, null])) as Record<CarDocType, string | null>;

  const [queue, setQueue] = useState<Record<CarDocType, File | null>>(makeEmptyQueue);
  const [previews, setPreviews] = useState<Record<CarDocType, string | null>>(makeEmptyPreviews);

  // mapear existentes por type, tolerante a mayúsculas, espacios, nulos
  const existingByType = useMemo(() => {
    const map: Partial<Record<CarDocType, ExistingDoc>> = {};
    for (const d of existing) {
      const raw = d?.type == null ? "" : String(d.type);
      const t = raw.trim().toLowerCase() as CarDocType;
      if ((ALL_TYPES as string[]).includes(t)) {
        map[t] = d;
      } else if (raw) {
        // útil para detectar datos mal tipeados en dev
        console.warn("Documento con type desconocido, lo ignoro:", raw, d);
      }
    }
    return map;
  }, [existing]);

  // selección actual
  const [group, setGroup] = useState<Group>("Cédula");
  const [face, setFace] = useState<"Frente" | "Dorso">("Frente");
  const activeType: CarDocType =
    face === "Frente" ? groupToTypes[group].front : groupToTypes[group].back;

  const has = (t: CarDocType) => Boolean(queue[t] || existingByType[t]);

  const getNextMissing = (): { group: Group; face: "Frente" | "Dorso" } | null => {
    for (const g of GROUPS) {
      const set = groupToTypes[g];
      if (!has(set.front)) return { group: g, face: "Frente" };
      if (!has(set.back)) return { group: g, face: "Dorso" };
    }
    return null;
  };

  // reset al cambiar token
  useEffect(() => {
    if (resetToken === undefined) return;
    setQueue(makeEmptyQueue());
    setPreviews(makeEmptyPreviews());
    setGroup("Cédula");
    setFace("Frente");
  }, [resetToken]);

  // avisar al padre lo que está en cola
  useEffect(() => {
    if (!onPendingChange) return;
    const list: PendingCarDoc[] = [];
    for (const t of ALL_TYPES) {
      if (queue[t]) list.push({ file: queue[t]!, type: t });
    }
    onPendingChange(list);
  }, [queue, onPendingChange]);

  // previews, regenero desde cero por cada cambio en queue
  useEffect(() => {
    const next = makeEmptyPreviews();
    const created: string[] = [];
    for (const t of ALL_TYPES) {
      const f = queue[t];
      if (f) {
        const u = URL.createObjectURL(f);
        next[t] = u;
        created.push(u);
      }
    }
    setPreviews(next);
    return () => created.forEach((u) => URL.revokeObjectURL(u));
  }, [queue]);

  // refs por tipo para inputs individuales (mini dropzone por tarjeta)
  const inputRefs = useRef<Record<CarDocType, HTMLInputElement | null>>({
    green_card_front: null,
    green_card_back: null,
    license_front: null,
    license_back: null,
    insurance_front: null,
    insurance_back: null,
  });

  // validación y seteo por tipo
  const pickForType = (type: CarDocType, files: FileList | null) => {
    if (!files || !files.length) return;
    const file = files[0];
    const okType =
      accept.includes(file.type) ||
      file.type === "" ||
      /\.(jpe?g|png|webp)$/i.test(file.name);
    const okSize = file.size <= 20 * 1024 * 1024;
    if (!okType || !okSize) return;

    setQueue((prev) => ({ ...prev, [type]: file }));

    // mover foco sugerido, igual que en pickForActive
    const isFront = Object.values(groupToTypes[group])[0] === type || type.endsWith("_front");
    if (isFront && (type === groupToTypes[group].front)) {
      setFace("Dorso");
    } else {
      const nextMissing = getNextMissing();
      if (nextMissing) {
        setGroup(nextMissing.group);
        setFace(nextMissing.face);
      }
    }
  };

  // drag and drop por tarjeta
  const makeDropHandlers = (type: CarDocType) => {
    return {
      onDragOver: (e: React.DragEvent) => { e.preventDefault(); },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        pickForType(type, e.dataTransfer.files);
      },
    };
  };

  const clearQueued = (t: CarDocType) =>
    setQueue((prev) => ({ ...prev, [t]: null }));

  const deleteExisting = async (t: CarDocType) => {
    const ex = existingByType[t];
    if (!ex || !onDeleteExisting) return;
    await onDeleteExisting(ex.id);
  };

  const doneCount = ALL_TYPES.filter((t) => has(t)).length;

  const nextMissing = getNextMissing();
  const thisType = activeType;
  const thisReady = has(thisType);

  const bannerPrimary = `AGREGAR ${group.toUpperCase()} - ${face.toUpperCase()}`;
  let bannerSecondary = "";
  if (thisReady && nextMissing) bannerSecondary = `Sugerido: ${nextMissing.group} - ${nextMissing.face}`;
  else if (!nextMissing && !thisReady) bannerSecondary = "Te falta este y listo";
  else if (!nextMissing && thisReady) bannerSecondary = "Todo listo";

  return (
    <section className="mt-10">
      {/* header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* iconito svg a la izquierda del título */}
          <img
            src="/images/icons/DropzoneIcon.svg"
            alt=""
            className="w-4 h-4"
          />
          <h3 className="text-[15px] font-medium text-neutral-800">
            Documentación del vehículo
          </h3>
        </div>
        <p className="text-xs text-neutral-500">
          Listos: {doneCount}/6, Formatos: JPG, PNG, WEBP, hasta 20 MB
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {GROUPS.map((g) =>
          (["Frente", "Dorso"] as const).map((f) => {
            const t = f === "Frente" ? groupToTypes[g].front : groupToTypes[g].back;
            const q = queue[t];
            const p = previews[t];
            const ex = existingByType[t];
            const ready = Boolean(q || ex);
            const { onDragOver, onDrop } = makeDropHandlers(t);

            return (
              <div
                key={`${g}-${f}`}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setGroup(g);
                  setFace(f);
                  inputRefs.current[t]?.click(); // abrir file picker de la tarjeta
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setGroup(g);
                    setFace(f);
                    inputRefs.current[t]?.click();
                  }
                }}
                onDragOver={onDragOver}
                onDrop={onDrop}
                className={[
                  "relative rounded-[4px] bg-white ring-1 ring-[#d3d3d3] transition focus:outline-none hover:ring-[#0040B8]",
                ].join(" ")}
              >
                {/* input oculto por tarjeta */}
                <input
                  ref={(el) => { inputRefs.current[t] = el; }}
                  className="hidden"
                  type="file"
                  accept={accept.join(",")}
                  onChange={(e) => pickForType(t, e.target.files)}
                />

                <div className="w-full h-[86px] bg-neutral-50 flex items-center justify-center overflow-hidden rounded-t-[4px]">
                  {q ? (
                    p ? (
                      <ImageIcon className="w-5 h-5 text-neutral" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-neutral" />
                    )
                  ) : ex ? (
                    ex.mime_type?.startsWith("image/") ? (
                      <img src={ex.file_url} alt={ex.file_name} className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-5 h-5 text-neutral-400" />
                    )
                  ) : (
                    <Upload className="w-5 h-5 text-neutral-300" />
                  )}
                </div>

                <div className="px-2 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-neutral-600">
                      {g} - {f}
                    </p>
                    {ready && (
                      <span className="inline-flex items-center justify-center rounded-full bg-white p-1 ring-1 ring-emerald-300">
                        <Check className="w-4 h-4 text-emerald-600" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-neutral-800 truncate">
                    {q?.name || ex?.file_name || "Sin archivo"}
                  </p>
                  {q && (
                    <p className="text-[11px] text-neutral-400">
                      {q.type || "imagen"} · {prettySize(q.size)}
                    </p>
                  )}
                </div>

                <div className="absolute top-1 right-1 flex gap-1">
                  {q && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearQueued(t); }}
                      className="rounded-full bg-white/90 p-1 ring-1 ring-neutral-200 hover:bg-white"
                      title="Quitar selección"
                    >
                      <X className="w-4 h-4 text-neutral-600" />
                    </button>
                  )}
                  {!q && ex && onDeleteExisting && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); deleteExisting(t); }}
                      className="rounded-full bg-white/90 p-1 ring-1 ring-neutral-200 hover:bg-white"
                      title="Borrar existente"
                    >
                      <Trash2 className="w-4 h-4 text-neutral-600" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
