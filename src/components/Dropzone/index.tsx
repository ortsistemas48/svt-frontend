// components/Dropzone.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Trash2, File as FileIcon, FileImage, FileText, FileArchive, FileAudio, FileVideo, FileCode, FileType } from "lucide-react";
import { compressManySmart } from "@/utils/image";

export type ExistingDoc = {
  id: number;
  file_name: string;
  file_url: string;
  size_bytes?: number;
  mime_type?: string;
  created_at?: string;
};

type Props = {
  onPendingChange?: (files: File[]) => void;
  existing?: ExistingDoc[];
  title?: string;
  maxSizeMB?: number;
  onDeleteExisting?: (docId: number) => Promise<void> | void;
  /** (OPCIONAL) Función que determina si un documento puede ser eliminado */
  canDeleteDocument?: (docId: number) => boolean;

  /** (OPCIONAL) Si cambia este token, el Dropzone limpia la cola de pendientes. */
  resetToken?: number | string;

  /** (OPCIONAL) Selección de "frente del vehículo" integrada al listado */
  frontSelection?: {
    selected: { kind: "queue"; index: number } | { kind: "existing"; id: number } | null;
    onChange: (sel: { kind: "queue"; index: number } | { kind: "existing"; id: number } | null) => void;
    message?: string;
  };
};

const prettySize = (bytes?: number) => {
  if (bytes == null) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

const iconByMime = (mime?: string) => {
  if (!mime) return "📄";
  if (mime.startsWith("image/")) return "🖼️";
  if (mime === "application/pdf") return "📕";
  if (mime.includes("zip") || mime.includes("compressed")) return "🗜️";
  if (mime.startsWith("text/")) return "📄";
  return "📎";
};

export default function Dropzone({
  onPendingChange,
  existing = [],
  title,
  maxSizeMB = 15,
  onDeleteExisting,
  canDeleteDocument,
  resetToken, // 👈 NUEVO prop
  frontSelection,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<File[]>([]);
  const [previews, setPreviews] = useState<(string | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewer, setViewer] = useState<{ url: string; title: string } | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleDelete = async (docId: number) => {
    if (!onDeleteExisting) return;
    try {
      setDeletingId(docId);
      await onDeleteExisting(docId);
    } finally {
      setDeletingId(null);
    }
  };

  const acceptMime = useMemo(
    () => ["image/png","image/jpeg","application/pdf","image/webp","text/plain"],
    []
  );

  const getExt = (name?: string, mime?: string) => {
    const n = (name || "").toLowerCase();
    const m = (mime || "").toLowerCase();
    const byName = n.includes(".") ? n.split(".").pop()! : "";
    if (byName) return byName;
    if (m.includes("pdf")) return "pdf";
    if (m.includes("zip")) return "zip";
    if (m.includes("image")) return "img";
    if (m.includes("audio")) return "audio";
    if (m.includes("video")) return "video";
    if (m.includes("text")) return "txt";
    if (m.includes("json")) return "json";
    return "";
  };

  // 🎨 ícono por MIME (lucide)
  const iconForMime = (mime?: string) => {
    const m = (mime || "").toLowerCase();
    if (m.startsWith("image/")) return <FileImage className="w-7 h-7" />;
    if (m === "application/pdf") return <FileText className="w-7 h-7" />;
    if (m.includes("zip") || m.includes("compressed")) return <FileArchive className="w-7 h-7" />;
    if (m.startsWith("audio/")) return <FileAudio className="w-7 h-7" />;
    if (m.startsWith("video/")) return <FileVideo className="w-7 h-7" />;
    if (m.startsWith("text/")) return <FileText className="w-7 h-7" />;
    if (m.includes("json") || m.includes("javascript") || m.includes("xml")) return <FileCode className="w-7 h-7" />;
    return <FileIcon className="w-7 h-7" />;
  };

  // (opcional) color de fondo por tipo
  const bgForMime = (mime?: string) => {
    const m = (mime || "").toLowerCase();
    if (m.startsWith("image/")) return "bg-[#F5F7FF]";
    if (m === "application/pdf") return "bg-rose-50";
    if (m.includes("zip") || m.includes("compressed")) return "bg-amber-50";
    if (m.startsWith("audio/")) return "bg-emerald-50";
    if (m.startsWith("video/")) return "bg-purple-50";
    if (m.startsWith("text/")) return "bg-sky-50";
    return "bg-slate-50";
  };

  // Notificar al padre cuando cambia la cola (post-render)
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    onPendingChange?.(queue);
  }, [queue, onPendingChange]);

  // Generar y limpiar previews para imágenes
  useEffect(() => {
    const urls = queue.map(f => (f.type?.startsWith("image/") ? URL.createObjectURL(f) : null));
    setPreviews(urls);
    return () => { urls.forEach(u => { if (u) URL.revokeObjectURL(u); }); };
  }, [queue]);

  // 👇 NUEVO: limpiar cola de pendientes cuando cambia el token
  useEffect(() => {
    if (resetToken === undefined) return;
    setQueue([]);
  }, [resetToken]);

  const onBrowse = () => inputRef.current?.click();

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);

    const filtered = arr.filter(f => {
      const okType = acceptMime.includes(f.type) || f.type === "";
      const okSize = f.size <= maxSizeMB * 1024 * 1024;
      return okType && okSize;
    });

    if (filtered.length === 0) return;
    (async () => {
      try {
        setIsCompressing(true);
        const compressed = await compressManySmart(filtered);
        setQueue(prev => [...prev, ...compressed]);
      } catch {
        setQueue(prev => [...prev, ...filtered]);
      } finally {
        setIsCompressing(false);
      }
    })();
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFromQueue = (idx: number) => {
    setQueue(prev => prev.filter((_, i) => i !== idx));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  useEffect(() => {
    if (!viewer) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setViewer(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewer]);

  // Datos combinados para render unificado: existentes + pendientes
  const combinedItems = useMemo(() => {
    const ex = (existing || []).map((d) => ({
      kind: "existing" as const,
      id: d.id,
      file_name: d.file_name,
      file_url: d.file_url,
      size_bytes: d.size_bytes,
      mime_type: d.mime_type,
      created_at: d.created_at,
    }));

    const q = queue.map((f, i) => ({
      kind: "queue" as const,
      index: i,
      file_name: f.name,
      file_url: previews[i], // puede ser null si no es imagen
      size_bytes: f.size,
      mime_type: f.type,
      created_at: undefined as string | undefined,
    }));
    return [...ex, ...q];
  }, [existing, queue, previews]);

  const totalCount = combinedItems.length;

  return (
    <div className="mx-auto">

      {title !== undefined ? (
        <h3 className="text-lg mb-3">{title || ""}</h3>
      ) : null}

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`border-dashed border-2 rounded-xl text-center mt-2 transition-colors relative ${
          isDragging ? "border-[#0040B8] bg-[#0040B8]/5" : "border-[#D3D3D3]"
        }`}
      >
        {isCompressing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 text-sm font-medium">
            Comprimiendo...
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
          accept={acceptMime.join(",")}
        />

        <div className="flex justify-center mb-2 mt-10">
          <img src="/images/icons/DropzoneIcon.svg" alt="" className="mr-3 ml-2" />
        </div>

        <button
          type="button"
          onClick={onBrowse}
          className="mt-4 mb-2 px-4 py-2 bg-[#fff] text-[#0040B8] border border-[#0040B8] rounded-[4px] text-sm duration-150 hover:bg-[#0040B8] hover:text-[#fff]"
        >
          Elegí archivos
        </button>
        <p className="mb-6 text-[#00000080] text-sm">
          o arrastralos hasta aquí.
        </p>
      </div>

      {frontSelection?.message && totalCount > 0 && (
        <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-[4px] px-3 py-2 text-left">
          {frontSelection.message}
        </div>
      )}

      {totalCount > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#5c5c5c]">Documentos</p>
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="text-xs text-[#0040B8] hover:underline"
                type="button"
              >
                Vaciar selección
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {combinedItems.map((item) => {
              const isExisting = item.kind === "existing";
              const isQueue = item.kind === "queue";
              const mime = item.mime_type;
              const name = item.file_name;
              const previewUrl = item.file_url;
              const isImage = (mime || "").toLowerCase().startsWith("image/") && Boolean(previewUrl || isExisting);

              return (
                <div
                  key={`${isExisting ? "e" : "q"}-${isExisting ? item.id : item.index}-${name}`}
                  className="relative rounded-[14px] border border-[#E6E6E6] bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {frontSelection && (
                    <label className="absolute top-2 left-2 z-10 inline-flex items-center gap-1 bg-white/90 border border-[#E6E6E6] rounded px-2 py-1 text-[11px] cursor-pointer select-none">
                      <input
                        type="radio"
                        name="front-photo"
                        className="accent-[#0040B8]"
                        checked={
                          (frontSelection.selected?.kind === "existing" && isExisting && (frontSelection.selected as any).id === item.id) ||
                          (frontSelection.selected?.kind === "queue" && isQueue && (frontSelection.selected as any).index === item.index)
                        }
                        onChange={() => {
                          if (isExisting) frontSelection.onChange({ kind: "existing", id: (item as any).id });
                          else frontSelection.onChange({ kind: "queue", index: (item as any).index });
                        }}
                      />
                      Frente
                    </label>
                  )}

                  {isExisting ? (
                    onDeleteExisting && (canDeleteDocument === undefined || canDeleteDocument((item as any).id)) && (
                      <button
                        type="button"
                        onClick={() => handleDelete((item as any).id)}
                        disabled={deletingId === (item as any).id}
                        className="absolute top-2 right-2 rounded-full bg-white/90 border border-[#E6E6E6] p-1 hover:bg-white disabled:opacity-60 z-10"
                        aria-label="Borrar documento"
                        title="Borrar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => removeFromQueue((item as any).index)}
                      className="absolute top-2 right-2 rounded-full bg-white/80 border border-[#E6E6E6] p-1 hover:bg-white"
                      aria-label="Quitar"
                    >
                      <X size={16} />
                    </button>
                  )}

                  <div className="flex flex-col items-center text-center space-y-3">
                    <div
                      className={`w-16 h-16 rounded-[14px] ${bgForMime(mime)} flex items-center justify-center overflow-hidden ${isImage ? "cursor-zoom-in" : ""}`}
                      onClick={() => {
                        if (isImage) setViewer({ url: (previewUrl || (isExisting ? (item as any).file_url : "")) as string, title: name });
                      }}
                      title={isImage ? "Ver imagen" : undefined}
                    >
                      {isImage ? (
                        <img src={(previewUrl || (isExisting ? (item as any).file_url : "")) as string} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{iconByMime(mime)}</span>
                      )}
                    </div>
                    <div className="w-full">
                      <p className="text-sm font-medium text-gray-900 truncate" title={name}>
                        {name}
                      </p>
                      <p className="text-xs text-[#7a7a7a] mt-1">
                        {(mime || "archivo")}{isExisting ? ` · ${prettySize((item as any).size_bytes)}` : ` · ${prettySize((item as any).size_bytes)}`}
                      </p>
                      {isImage && (
                        <button
                          type="button"
                          className="mt-1 text-xs text-[#0040B8] hover:underline"
                          onClick={() => setViewer({ url: (previewUrl || (isExisting ? (item as any).file_url : "")) as string, title: name })}
                        >
                          Ver imagen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewer && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          aria-modal="true"
          role="dialog"
          aria-label="Visor de imagen"
        >
          <div className="absolute inset-0 bg-black/60" onClick={() => setViewer(null)} />
          <div className="relative bg-white rounded-[14px] shadow-2xl border border-[#E6E6E6] max-w-[90vw] max-h-[90vh] p-2">
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-sm font-medium truncate max-w-[70vw]">{viewer.title}</p>
              <button
                type="button"
                className="px-2 py-1 text-sm border border-[#E6E6E6] rounded hover:bg-neutral-50"
                onClick={() => setViewer(null)}
              >
                Cerrar
              </button>
            </div>
            <div className="p-1 overflow-auto">
              <img
                src={viewer.url}
                alt={viewer.title}
                className="max-w-[86vw] max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
