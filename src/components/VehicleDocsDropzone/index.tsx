// components/VehicleDocsSimpleDrop.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Trash2, FileImage } from "lucide-react";

export type ExistingDoc = {
  id: number;
  file_name: string;
  file_url: string;
  size_bytes?: number;
  mime_type?: string;
  created_at?: string;
	type?: string | null;
};

type Props = {
  existing?: ExistingDoc[];
  resetToken?: number | string;
	onPendingChange?: (files: File[]) => void;
  onDeleteExisting?: (docId: number) => Promise<void> | void;
  onDoneCountChange?: (count: number) => void;
	/** Modo de uso: edit (sube archivos) o view (solo ver existentes) */
	mode?: "edit" | "view";
};

const ACCEPT_MIME = ["image/png", "image/jpeg", "image/webp"];

const prettySize = (bytes?: number) => {
  if (bytes == null) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

export default function VehicleDocsDropzone({
  existing = [],
  resetToken,
  onPendingChange,
  onDeleteExisting,
  onDoneCountChange,
	mode = "edit",
}: Props) {
	// Cola global de archivos
	const [queue, setQueue] = useState<File[]>([]);
	const [previews, setPreviews] = useState<(string | null)[]>([]);
	const [brokenPreview, setBrokenPreview] = useState<Record<number, boolean>>({});
	const inputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	// Reset al cambiar token
  useEffect(() => {
    if (resetToken === undefined) return;
		setQueue([]);
		setPreviews([]);
		setBrokenPreview({});
  }, [resetToken]);

	// Notificar al padre los pendientes tipados
  useEffect(() => {
    if (!onPendingChange) return;
		onPendingChange(queue);
  }, [queue, onPendingChange]);

	// Generar previews para pendientes
  useEffect(() => {
		const urls = queue.map((f) =>
			(f.type && f.type.startsWith("image/")) || /\.(jpe?g|png|webp)$/i.test(f.name)
				? URL.createObjectURL(f)
				: null
		);
		setPreviews(urls);
		return () => {
			urls.forEach((u) => {
				if (u) URL.revokeObjectURL(u);
			});
		};
  }, [queue]);

	// Progreso: total existentes + en cola
	const doneCount = useMemo(() => {
		return (existing?.length || 0) + queue.length;
	}, [existing, queue]);

	useEffect(() => {
		onDoneCountChange?.(doneCount);
	}, [doneCount, onDoneCountChange]);

	const addFiles = (files: FileList | null) => {
		if (!files || files.length === 0) return;
		const arr = Array.from(files).filter((f) => {
			const okType = ACCEPT_MIME.includes(f.type) || f.type === "" || /\.(jpe?g|png|webp)$/i.test(f.name);
			const okSize = f.size <= 20 * 1024 * 1024;
			return okType && okSize;
		});
		if (arr.length === 0) return;
		setQueue((prev) => [...prev, ...arr]);
	};

	const removeQueued = (idx: number) => {
		setQueue((prev) => prev.filter((_, i) => i !== idx));
		setBrokenPreview((prev) => {
			const next: Record<number, boolean> = {};
			Object.keys(prev).forEach((k) => {
				const i = Number(k);
				if (i < idx) next[i] = prev[i];
				else if (i > idx) next[i - 1] = prev[i];
			});
			return next;
		});
	};

	const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		setIsDragging(false);
		addFiles(e.dataTransfer.files);
	};

  return (
    <section className="mt-10">
			{mode === "edit" && (
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
						<img src="/images/icons/DropzoneIcon.svg" alt="" className="w-4 h-4" />
						<h3 className="text-[15px] font-medium text-neutral-800">Documentación del vehículo</h3>
        </div>
					<p className="text-xs text-neutral-500">Formatos: JPG, PNG, WEBP · hasta 20 MB</p>
      </div>
			)}

			{/* Alerta requerida */}
			{mode === "edit" && (
				<div className="mb-4 rounded-[4px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
					<strong className="font-medium">Importante:</strong> Obligatorio subir frente y dorso de la cédula verde, licencia de conducir y de la póliza de seguro.
				</div>
			)}

			{mode === "edit" && (
				<div
					onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
					onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
					className={`border-dashed border-2 rounded-xl text-center mt-2 transition-colors ${isDragging ? "border-[#0040B8] bg-[#0040B8]/5" : "border-[#D3D3D3]"}`}
              >
                <input
						ref={inputRef}
						type="file"
						multiple
                  className="hidden"
						onChange={(e) => {
							addFiles(e.target.files);
							// permitir volver a elegir el mismo archivo
							try { (e.target as HTMLInputElement).value = ""; } catch {}
						}}
						accept={ACCEPT_MIME.join(",")}
					/>
					<div className="py-8">
						<img src="/images/icons/DropzoneIcon.svg" alt="" className="mx-auto mb-3 h-12 w-12" />
						<button
							type="button"
							onClick={() => {
								// limpiar antes de abrir el diálogo para asegurar change con el mismo archivo
								if (inputRef.current) inputRef.current.value = "";
								inputRef.current?.click();
							}}
							className="rounded-[4px] border border-[#0040B8] px-4 py-2 text-sm text-[#0040B8] duration-150 hover:bg-[#0040B8] hover:text-white"
						>
							Elegí archivos
						</button>
						<p className="mt-2 text-sm text-[#00000080]">o arrastralos hasta aquí.</p>
					</div>
				</div>
			)}

			{/* Documentos */}
			<div className="mt-6">
				{(mode === "view" || existing.length > 0 || queue.length > 0) && (
					<p className="text-sm text-[#5c5c5c] mb-2">Documentos</p>
				)}
				{mode === "view" && existing.length === 0 && (
					<div className="flex items-center justify-center rounded-[4px] border border-dashed border-[#D3D3D3] bg-white py-10">
						<div className="text-center px-4">
							<img src="/images/icons/empty-file.svg" alt="" className="mx-auto mb-3 h-10 w-10 opacity-70" />
							<p className="text-sm text-neutral-500">No hay documentos disponibles</p>
                </div>
                  </div>
				)}
				<div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-2">
					{mode === "edit" && queue.map((f, i) => (
						<div key={`q-${i}-${f.name}`} className="relative rounded-[4px] bg-white ring-1 ring-[#d3d3d3]">
                    <button
                      type="button"
								onClick={() => removeQueued(i)}
								className="absolute top-1 right-1 rounded-full bg-white/80 ring-1 ring-[#E6E6E6] p-1 hover:bg-white"
								aria-label="Quitar"
								title="Quitar"
							>
								<X size={14} />
                    </button>
							<div className="w-full h-[84px] bg-neutral-50 flex items-center justify-center overflow-hidden rounded-t-[4px]">
								{previews[i] && !brokenPreview[i] ? (
									<img
										src={previews[i] as string}
										alt={f.name}
										className="w-full h-full object-cover"
										onError={() => setBrokenPreview((prev) => ({ ...prev, [i]: true }))}
									/>
								) : (
									<FileImage className="w-6 h-6 text-neutral-500" />
								)}
							</div>
							<div className="px-2 py-1">
								<p className="text-[11px] font-medium text-neutral-800 truncate" title={f.name}>{f.name}</p>
								<p className="text-[11px] text-neutral-500">{f.type || "imagen"} · {prettySize(f.size)}</p>
							</div>
						</div>
					))}
					{existing.map((d) => (
						<div key={`e-${d.id}`} className="relative rounded-[4px] bg-white ring-1 ring-[#d3d3d3]">
							{onDeleteExisting && mode === "edit" && (
                    <button
                      type="button"
									onClick={() => onDeleteExisting(d.id)}
									className="absolute top-1 right-1 rounded-full bg-white/90 p-1 ring-1 ring-neutral-200 hover:bg-white"
									title="Borrar"
                    >
                      <Trash2 className="w-4 h-4 text-neutral-600" />
                    </button>
                  )}
							<div className="w-full h-[84px] bg-neutral-50 flex items-center justify-center overflow-hidden rounded-t-[4px]">
								{d.mime_type?.startsWith("image/") ? (
									<img src={d.file_url} alt={d.file_name} className="w-full h-full object-cover" />
								) : (
									<div className="text-[11px] text-neutral-500 px-2 text-center truncate">{d.file_name}</div>
								)}
							</div>
							<div className="px-2 py-1">
								<p className="text-[11px] font-medium text-neutral-800 truncate" title={d.file_name}>{d.file_name}</p>
								<p className="text-[11px] text-neutral-500">{d.mime_type || "archivo"} · {prettySize(d.size_bytes)}</p>
                </div>
              </div>
					))}
				</div>
      </div>
    </section>
  );
}
