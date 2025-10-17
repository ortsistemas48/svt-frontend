// components/Dropzone.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Trash2 } from "lucide-react";

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

  /** (OPCIONAL) Si cambia este token, el Dropzone limpia la cola de pendientes. */
  resetToken?: number | string;
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
  resetToken, // 👈 NUEVO prop
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<File[]>([]);
  const [previews, setPreviews] = useState<(string | null)[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

    setQueue(prev => [...prev, ...filtered]);
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

  return (
    <div className="mx-auto">

      {title ? (
        <h3 className="text-lg mb-3">{title}</h3>
      ) : null}

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`border-dashed border-2 rounded-xl text-center mt-2 transition-colors ${
          isDragging ? "border-[#0040B8] bg-[#0040B8]/5" : "border-[#D3D3D3]"
        }`}
      >
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
          className="mt-4 mb-2 px-4 py-2 bg-[#fff] text-[#0040B8] border border-[#0040B8] rounded-md text-sm duration-150 hover:bg-[#0040B8] hover:text-[#fff]"
        >
          Elegí archivos
        </button>
        <p className="mb-6 text-[#00000080] text-sm">
          o arrastralos hasta aquí.
        </p>
      </div>

      {queue.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-[#5c5c5c]">
              Pendientes, se van a subir al continuar
            </p>
            <button
              onClick={clearQueue}
              className="text-xs text-[#0040B8] hover:underline"
              type="button"
            >
              Vaciar selección
            </button>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {queue.map((f, i) => {
              const url = previews[i];

              return (
                <li
                  key={`${f.name}-${i}`}
                  className="relative rounded-xl border border-[#E6E6E6] bg-white p-3 shadow-sm hover:shadow-md transition"
                >
                  <button
                    type="button"
                    onClick={() => removeFromQueue(i)}
                    className="absolute top-2 right-2 rounded-full bg-white/80 border border-[#E6E6E6] p-1 hover:bg-white"
                    aria-label="Quitar"
                  >
                    <X size={16} />
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg bg-[#F5F7FF] flex items-center justify-center overflow-hidden">
                      {url ? (
                        <img src={url} alt={f.name} className="w/full h/full object-cover" />
                      ) : (
                        <span className="text-xl">{iconByMime(f.type)}</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      <p className="text-xs text-[#7a7a7a]">
                        {f.type || "archivo"} · {prettySize(f.size)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {existing.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-[#5c5c5c] mb-2">Ya subidos</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {existing.map((d) => (
              <div
                key={d.id}
                className="relative rounded-lg border border-[#E6E6E6] bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                {onDeleteExisting && (
                  <button
                    type="button"
                    onClick={() => handleDelete(d.id)}
                    disabled={deletingId === d.id}
                    className="absolute top-2 right-2 rounded-full bg-white/90 border border-[#E6E6E6] p-1 hover:bg-white disabled:opacity-60 z-10"
                    aria-label="Borrar documento"
                    title="Borrar"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-lg bg-[#F5F7FF] flex items-center justify-center overflow-hidden">
                    {d.mime_type?.startsWith("image/") ? (
                      <img src={d.file_url} alt={d.file_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">{iconByMime(d.mime_type)}</span>
                    )}
                  </div>
                  <div className="w-full">
                    <p className="text-sm font-medium text-gray-900 truncate" title={d.file_name}>
                      {d.file_name}
                    </p>
                    <p className="text-xs text-[#7a7a7a] mt-1">
                      {d.mime_type || "archivo"} · {prettySize(d.size_bytes)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
