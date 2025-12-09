"use client";

import { useState, useEffect } from "react";
import { FileImage, FileText, FileArchive, FileIcon, Download } from "lucide-react";
import { apiFetch } from "@/utils";

interface InspDoc {
  id: number;
  file_name: string;
  file_url: string;
  mime_type?: string;
  size_bytes?: number;
  created_at?: string;
}

const prettySize = (bytes?: number) => {
  if (bytes == null) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
};

const iconForMime = (mime?: string) => {
  const m = (mime || "").toLowerCase();
  if (m.startsWith("image/")) return <FileImage className="w-5 h-5 sm:w-7 sm:h-7" />;
  if (m === "application/pdf") return <FileText className="w-5 h-5 sm:w-7 sm:h-7" />;
  if (m.includes("zip") || m.includes("compressed")) return <FileArchive className="w-5 h-5 sm:w-7 sm:h-7" />;
  return <FileIcon className="w-5 h-5 sm:w-7 sm:h-7" />;
};

function fmtDate(d?: string | null) {
  if (!d) return "No disponible";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "No disponible";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const handleDownload = async (fileUrl: string, fileName: string) => {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error("Error al descargar el archivo");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error al descargar:", error);
    // Fallback: abrir en nueva pestaña si falla la descarga
    window.open(fileUrl, "_blank");
  }
};

export default function VehiclePhotos({ inspectionId, inspectionDate }: { inspectionId?: number | null; inspectionDate?: string | null }) {
  const [photos, setPhotos] = useState<InspDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!inspectionId) {
      setLoading(false);
      return;
    }

    const fetchPhotos = async () => {
      try {
        setLoading(true);
        // Usar endpoint público de QR para obtener las fotos
        const res = await apiFetch(`/api/qr/get-vehicle-photos/${inspectionId}`);
        if (!res.ok) {
          throw new Error("No se pudieron cargar las fotos");
        }
        const data: InspDoc[] = await res.json();
        setPhotos(data);
      } catch (err) {
        console.error("Error al cargar fotos:", err);
        setError("No se pudieron cargar las fotos del vehículo");
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [inspectionId]);

  if (!inspectionId) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto rounded-2xl border border-[#d3d3d3] overflow-hidden">
        <div className="bg-white px-5 py-4">
          <p className="text-sm text-zinc-600">Cargando fotos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto rounded-2xl border border-[#d3d3d3] overflow-hidden">
        <div className="bg-white px-5 py-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto rounded-2xl border border-[#d3d3d3] overflow-hidden">
      <div className="bg-green-50 px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-green-100 rounded-[14px] flex items-center justify-center">
          <FileImage className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-[15px] font-semibold text-zinc-900">Fotos del vehículo</h2>
          <p className="text-xs text-zinc-600">
            Fecha de toma: {fmtDate(inspectionDate)}
          </p>
        </div>
      </div>
      <div className="border-t border-[#eaeaea]" />
      <div className="px-5 py-5 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative rounded-lg sm:rounded-[14px] border border-[#E6E6E6] bg-white p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                <a href={photo.file_url} target="_blank" rel="noopener noreferrer" className="w-full group">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-lg sm:rounded-[14px] bg-[#F5F7FF] flex items-center justify-center overflow-hidden group-hover:opacity-90">
                    {photo.mime_type?.startsWith("image/") ? (
                      <img src={photo.file_url} alt={photo.file_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-zinc-400">
                        {iconForMime(photo.mime_type)}
                      </div>
                    )}
                  </div>
                  <div className="w-full mt-2">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate group-hover:underline" title={photo.file_name}>
                      {photo.file_name}
                    </p>
                    <p className="text-[10px] sm:text-xs text-[#7a7a7a] mt-1">
                      {photo.mime_type || "archivo"} · {prettySize(photo.size_bytes)}
                    </p>
                  </div>
                </a>
                <div className="w-full flex justify-center gap-3">
                  <a
                    href={photo.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] sm:text-xs text-[#0040B8] hover:underline"
                  >
                    Ver
                  </a>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDownload(photo.file_url, photo.file_name);
                    }}
                    className="text-[10px] sm:text-xs text-[#0040B8] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                  >
                    <Download className="w-3 h-3" />
                    Descargar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

