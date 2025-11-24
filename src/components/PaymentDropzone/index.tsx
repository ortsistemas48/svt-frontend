"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { compressAnySmart } from "@/utils/image";

export default function PaymentDropzone({
  onPendingChange,
  title = "Comprobante",
  maxSizeMB = 15,
}: {
  onPendingChange?: (files: File[]) => void;
  title?: string;
  maxSizeMB?: number;
}) {
  const [queue, setQueue] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const acceptMime = useMemo(
    () => ["image/png", "image/jpeg", "image/webp", "application/pdf"],
    []
  );

  useEffect(() => { onPendingChange?.(queue); }, [queue, onPendingChange]);

  const onBrowse = () => inputRef.current?.click();

  const pickFirstValid = (files: FileList | null): File | null => {
    if (!files || files.length === 0) return null;
    for (const f of Array.from(files)) {
      const okType = acceptMime.includes(f.type) || f.type === "";
      const okSize = f.size <= maxSizeMB * 1024 * 1024;
      if (okType && okSize) return f;
    }
    return null;
  };

  const addFiles = (files: FileList | null) => {
    const first = pickFirstValid(files);
    if (!first) return;
    (async () => {
      try {
        setIsCompressing(true);
        const compressed = await compressAnySmart(first);
        setQueue([compressed]);
      } catch {
        setQueue([first]);
      } finally {
        setIsCompressing(false);
      }
    })();
  };

  const remove = () => setQueue([]);

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">{title}</h4>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
        className={`rounded-xl border-2 border-dashed text-center transition-colors relative ${
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
          multiple={false}                 // <<< único archivo
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
          accept={acceptMime.join(",")}
        />

      <div className="py-8">
        <img
          src="/images/icons/DropzoneIcon.svg"
          alt=""
          className="mx-auto mb-3 h-12 w-12"
          loading="lazy"
          decoding="async"
        />
        <button
          type="button"
          onClick={onBrowse}
          className="rounded-[4px] border border-[#0040B8] px-4 py-2 text-sm text-[#0040B8] duration-150 hover:bg-[#0040B8] hover:text-white"
        >
          Elegí archivo
        </button>
        <p className="mt-2 text-sm text-[#00000080]">o arrastralo hasta aquí</p>
        <p className="mt-2 text-xs text-gray-500">
          Formatos, JPG, PNG, WEBP o PDF, hasta {maxSizeMB}MB
        </p>
      </div>
      </div>

      {queue.length === 1 && (
        <ul className="mt-4 grid grid-cols-1 gap-2">
          <li className="flex items-center justify-between rounded-[14px] border p-2 text-sm">
            <div className="min-w-0 truncate">
              {queue[0].name}{" "}
              <span className="text-gray-500"> - {(queue[0].size / 1024).toFixed(0)} KB</span>
            </div>
            <button
              onClick={remove}
              className="rounded-full border p-1 hover:bg-gray-50"
              aria-label="Quitar"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
