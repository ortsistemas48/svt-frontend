"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { FileImage, FileText, FileArchive, FileIcon, Eye, Download } from "lucide-react";

type Step = { step_id: number; name: string; description: string; order: number };
type Status = "Apto" | "Condicional" | "Rechazado";

type InspDoc = {
  id: number;
  file_name: string;
  file_url: string;
  size_bytes?: number;
  mime_type?: string;
  created_at?: string;
  type?: string;
};

const STATUS_UI: Record<Status, { stepBorder: string; text: string }> = {
  Apto: {
    stepBorder: "border-[#0040B8]/50",
    text: "text-[#0040B8]",
  },
  Condicional: {
    stepBorder: "border-amber-600/50",
    text: "text-amber-700",
  },
  Rechazado: {
    stepBorder: "border-black/50",
    text: "text-black",
  },
};

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

export function InspectionStepsViewOnlyClient({
  inspectionId,
  appId,
  steps,
  initialStatuses,
  apiBase,
  initialGlobalObs,
  userType,
  inspectionDocs,
  showBackButton = false,
}: {
  inspectionId: number;
  appId: number;
  steps: Step[];
  initialStatuses: Record<number, Status | undefined>;
  apiBase: string;
  initialGlobalObs: string;
  userType: string;
  inspectionDocs: InspDoc[];
  showBackButton?: boolean;
}) {
  const { id } = useParams();
  const router = useRouter();

  const statusByStep = initialStatuses;

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
      // Fallback: open in new tab
      window.open(fileUrl, '_blank');
    }
  };

  const overallStatus: Status | null = useMemo(() => {
    const values = steps.map((s) => statusByStep[s.step_id]);
    if (values.some((v) => v === "Rechazado")) return "Rechazado";
    if (values.some((v) => v === "Condicional")) return "Condicional";
    if (values.some((v) => !v)) return null;
    return "Apto";
  }, [steps, statusByStep]);

  return (
    <div className="w-full px-1 sm:px-2 md:px-4 pb-6 sm:pb-8 md:pb-10">
      <div className="w-full space-y-3 sm:space-y-4">
        {steps.map((s) => {
          const current = statusByStep[s.step_id];
          return (
            <section
              key={s.step_id}
              className={clsx(
                "w-full rounded-lg sm:rounded-[14px] bg-white transition-colors border",
                current ? STATUS_UI[current as Status].stepBorder : "border-zinc-200"
              )}
            >
              <div className="flex flex-col lg:flex-row md:items-center justify-between gap-3 p-3 sm:p-4">
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-medium text-zinc-900">{s.name}</h3>
                  <p className="hidden min-[1300px]:block text-xs sm:text-sm md:max-w-[400px] text-zinc-500">
                    {s.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
                  {current && (
                    <span
                      className={clsx(
                        "w-full sm:w-[140px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-[4px] border text-xs sm:text-sm text-center",
                        STATUS_UI[current].stepBorder,
                        STATUS_UI[current].text,
                        "bg-white"
                      )}
                    >
                      {current}
                    </span>
                  )}
                  {!current && (
                    <span className="w-full sm:w-[140px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-[4px] border border-zinc-200 text-zinc-400 text-xs sm:text-sm text-center">
                      Sin estado
                    </span>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-3 sm:gap-4 mt-6 sm:mt-8 w-full">
        <div className="md:col-span-2">
          <h4 className="text-xs sm:text-sm font-medium text-zinc-900">Observaciones generales</h4>
          <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">
            Observaciones del vehículo registradas en la revisión.
          </p>
        </div>

        <div className="rounded-lg sm:rounded-[14px] text-xs sm:text-sm border border-zinc-200 bg-white p-3 sm:p-4 w-full self-start md:col-span-2">
          {initialGlobalObs ? (
            <p className="text-zinc-800 whitespace-pre-wrap">{initialGlobalObs}</p>
          ) : (
            <p className="text-zinc-400 italic">No hay observaciones registradas</p>
          )}
        </div>
      </div>

      {inspectionDocs.length > 0 && (
        <section className="rounded-lg sm:rounded-[14px] border border-zinc-200 bg-white p-3 sm:p-4 w-full mt-4 sm:mt-6">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs sm:text-sm font-medium text-zinc-900">Documentos de la revisión</h4>
          </div>
          <p className="text-[10px] sm:text-xs text-zinc-500 mb-2 sm:mb-3">
            Documentos adjuntos a esta revisión técnica, agrupados por tipo.
          </p>

          {/* Informes técnicos */}
          {inspectionDocs.filter(d => d.type === "technical_report").length > 0 && (
            <div className="mt-2">
              <h5 className="text-xs sm:text-sm font-medium text-zinc-800">Informes técnicos</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 mt-2 sm:mt-3">
                {inspectionDocs.filter(d => d.type === "technical_report").map((d) => (
                  <div
                    key={d.id}
                    className="relative rounded-lg sm:rounded-[14px] border border-[#E6E6E6] bg-white p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="w-full group">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-lg sm:rounded-[14px] bg-[#F5F7FF] flex items-center justify-center overflow-hidden group-hover:opacity-90">
                          {d.mime_type?.startsWith("image/") ? (
                            <img src={d.file_url} alt={d.file_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-zinc-400">
                              {iconForMime(d.mime_type)}
                            </div>
                          )}
                        </div>
                        <div className="w-full mt-1.5 sm:mt-2">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate group-hover:underline" title={d.file_name}>
                            {d.file_name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-[#7a7a7a] mt-0.5 sm:mt-1">
                            {d.mime_type || "archivo"} · {prettySize(d.size_bytes)}
                          </p>
                        </div>
                      </a>
                      <div className="w-full flex justify-center gap-2">
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-[4px] transition-colors duration-200"
                          title="Ver documento"
                        >
                          <Eye size={14} className="sm:w-4 sm:h-4" />
                        </a>
                        <button
                          onClick={() => handleDownload(d.file_url, d.file_name)}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-[4px] transition-colors duration-200"
                          title="Descargar documento"
                        >
                          <Download size={14} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fotos del vehículo */}
          {inspectionDocs.filter(d => d.type === "vehicle_photo").length > 0 && (
            <div className="mt-4 sm:mt-5">
              <h5 className="text-xs sm:text-sm font-medium text-zinc-800">Fotos del vehículo</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 mt-2 sm:mt-3">
                {inspectionDocs.filter(d => d.type === "vehicle_photo").map((d) => (
                  <div
                    key={d.id}
                    className="relative rounded-lg sm:rounded-[14px] border border-[#E6E6E6] bg-white p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="w-full group">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-lg sm:rounded-[14px] bg-[#F5F7FF] flex items-center justify-center overflow-hidden group-hover:opacity-90">
                          {d.mime_type?.startsWith("image/") ? (
                            <img src={d.file_url} alt={d.file_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-zinc-400">
                              {iconForMime(d.mime_type)}
                            </div>
                          )}
                        </div>
                        <div className="w-full mt-1.5 sm:mt-2">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate group-hover:underline" title={d.file_name}>
                            {d.file_name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-[#7a7a7a] mt-0.5 sm:mt-1">
                            {d.mime_type || "archivo"} · {prettySize(d.size_bytes)}
                          </p>
                        </div>
                      </a>
                      <div className="w-full flex justify-center gap-2">
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-[4px] transition-colors duration-200"
                          title="Ver documento"
                        >
                          <Eye size={14} className="sm:w-4 sm:h-4" />
                        </a>
                        <button
                          onClick={() => handleDownload(d.file_url, d.file_name)}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-[4px] transition-colors duration-200"
                          title="Descargar documento"
                        >
                          <Download size={14} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Otros documentos sin tipo conocido */}
          {inspectionDocs.filter(d => !d.type || (d.type !== "technical_report" && d.type !== "vehicle_photo")).length > 0 && (
            <div className="mt-4 sm:mt-5">
              <h5 className="text-xs sm:text-sm font-medium text-zinc-800">Otros</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 mt-2 sm:mt-3">
                {inspectionDocs
                  .filter(d => !d.type || (d.type !== "technical_report" && d.type !== "vehicle_photo"))
                  .map((d) => (
                  <div
                    key={d.id}
                    className="relative rounded-lg sm:rounded-[14px] border border-[#E6E6E6] bg-white p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="w-full group">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-lg sm:rounded-[14px] bg-[#F5F7FF] flex items-center justify-center overflow-hidden group-hover:opacity-90">
                          {d.mime_type?.startsWith("image/") ? (
                            <img src={d.file_url} alt={d.file_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-zinc-400">
                              {iconForMime(d.mime_type)}
                            </div>
                          )}
                        </div>
                        <div className="w-full mt-1.5 sm:mt-2">
                          <p className="text-xs sm:text-sm font-medium text-gray-900 truncate group-hover:underline" title={d.file_name}>
                            {d.file_name}
                          </p>
                          <p className="text-[10px] sm:text-xs text-[#7a7a7a] mt-0.5 sm:mt-1">
                            {d.mime_type || "archivo"} · {prettySize(d.size_bytes)}
                          </p>
                        </div>
                      </a>
                      <div className="w-full flex justify-center gap-2">
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-[4px] transition-colors duration-200"
                          title="Ver documento"
                        >
                          <Eye size={14} className="sm:w-4 sm:h-4" />
                        </a>
                        <button
                          onClick={() => handleDownload(d.file_url, d.file_name)}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-[4px] transition-colors duration-200"
                          title="Descargar documento"
                        >
                          <Download size={14} className="sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {showBackButton && (
        <div className="mt-4 sm:mt-6 flex justify-center">
          <button
            onClick={() => router.push(`/dashboard/${id}/files/${appId}`)}
            className="w-full sm:w-auto px-4 py-2 sm:py-2.5 border border-[#0040B8] rounded-[4px] text-xs sm:text-sm text-[#0040B8] hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <ChevronRight size={14} className="sm:w-4 sm:h-4 rotate-180" />
            Volver
          </button>
        </div>
      )}
    </div>
  );
}

