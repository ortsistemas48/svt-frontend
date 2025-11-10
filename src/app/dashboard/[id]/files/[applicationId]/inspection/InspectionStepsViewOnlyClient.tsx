"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { FileImage, FileText, FileArchive, FileIcon } from "lucide-react";

type Step = { step_id: number; name: string; description: string; order: number };
type Status = "Apto" | "Condicional" | "Rechazado";

type InspDoc = {
  id: number;
  file_name: string;
  file_url: string;
  size_bytes?: number;
  mime_type?: string;
  created_at?: string;
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
  if (m.startsWith("image/")) return <FileImage className="w-7 h-7" />;
  if (m === "application/pdf") return <FileText className="w-7 h-7" />;
  if (m.includes("zip") || m.includes("compressed")) return <FileArchive className="w-7 h-7" />;
  return <FileIcon className="w-7 h-7" />;
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

  const overallStatus: Status | null = useMemo(() => {
    const values = steps.map((s) => statusByStep[s.step_id]);
    if (values.some((v) => v === "Rechazado")) return "Rechazado";
    if (values.some((v) => v === "Condicional")) return "Condicional";
    if (values.some((v) => !v)) return null;
    return "Apto";
  }, [steps, statusByStep]);

  return (
    <div className="w-full">
      <div className="w-full space-y-4">
        {steps.map((s) => {
          const current = statusByStep[s.step_id];
          return (
            <section
              key={s.step_id}
              className={clsx(
                "w-full rounded-[10px] bg-white transition-colors border",
                current ? STATUS_UI[current as Status].stepBorder : "border-zinc-200"
              )}
            >
              <div className="flex flex-col lg:flex-row md:items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <h3 className="font-medium text-zinc-900">{s.name}</h3>
                  <p className="hidden min-[1300px]:block text-sm md:max-w-[400px] text-zinc-500">
                    {s.description}
                  </p>
                </div>

                <div className="flex items-center gap-5 flex-wrap">
                  {current && (
                    <span
                      className={clsx(
                        "w-[140px] px-4 py-2.5 rounded-[4px] border text-sm text-center",
                        STATUS_UI[current].stepBorder,
                        STATUS_UI[current].text,
                        "bg-white"
                      )}
                    >
                      {current}
                    </span>
                  )}
                  {!current && (
                    <span className="w-[140px] px-4 py-2.5 rounded-[4px] border border-zinc-200 text-zinc-400 text-sm text-center">
                      Sin estado
                    </span>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-4 mt-8 w-full">
        <div className="md:col-span-2">
          <h4 className="text-sm font-medium text-zinc-900">Observaciones generales</h4>
          <p className="text-xs text-zinc-500 mt-1">
            Observaciones del vehículo registradas en la revisión.
          </p>
        </div>

        <div className="rounded-[10px] text-sm border border-zinc-200 bg-white p-4 w-full self-start md:col-span-2">
          {initialGlobalObs ? (
            <p className="text-zinc-800 whitespace-pre-wrap">{initialGlobalObs}</p>
          ) : (
            <p className="text-zinc-400 italic">No hay observaciones registradas</p>
          )}
        </div>
      </div>

      {inspectionDocs.length > 0 && (
        <section className="rounded-[10px] border border-zinc-200 bg-white p-4 w-full mt-6">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-zinc-900">Informes técnicos y/o fotos del vehículo</h4>
          </div>
          <p className="text-xs text-zinc-500 mb-3">
            Documentos adjuntos a la revisión técnica.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
            {inspectionDocs.map((d) => (
              <div
                key={d.id}
                className="relative rounded-lg border border-[#E6E6E6] bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-lg bg-[#F5F7FF] flex items-center justify-center overflow-hidden">
                    {d.mime_type?.startsWith("image/") ? (
                      <img src={d.file_url} alt={d.file_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-zinc-400">
                        {iconForMime(d.mime_type)}
                      </div>
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
        </section>
      )}

      {showBackButton && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => router.push(`/dashboard/${id}/files/${appId}`)}
            className="px-4 py-2.5 border border-[#0040B8] rounded-[4px] text-[#0040B8] hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <ChevronRight size={16} className="rotate-180" />
            Volver
          </button>
        </div>
      )}
    </div>
  );
}

