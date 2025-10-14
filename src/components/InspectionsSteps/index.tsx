// components/inspections/InspectionStepsClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Dropzone, { type ExistingDoc as InspDoc } from "@/components/Dropzone";
import { useParams } from "next/navigation";

type Step = { step_id: number; name: string; description: string; order: number };
type Status = "Apto" | "Condicional" | "Rechazado";
type ObservationRow = { id: number; description: string; checked: boolean };

const STATUS_UI: Record<Status, { btn: string; stepBorder: string }> = {
  Apto: { btn: "border-[#0040B8] text-[#0040B8] bg-[#0040B8]/10", stepBorder: "border-[#0040B8]/50" },
  Condicional: { btn: "border-amber-600 text-amber-700 bg-amber-50", stepBorder: "border-amber-600/50" },
  Rechazado: { btn: "border-black text-black bg-black/5", stepBorder: "border-black/50" },
};

export default function InspectionStepsClient({
  inspectionId,
  appId,
  steps,
  initialStatuses,
  apiBase,
  initialObsByStep,
  initialGlobalObs,
}: {
  inspectionId: number;
  appId: number;
  steps: Step[];
  initialStatuses: Record<number, Status | undefined>;
  apiBase: string | undefined;
  initialObsByStep?: Record<number, ObservationRow[]>;
  initialGlobalObs?: string;
}) {
  const { id } = useParams();
  const [isCompleted, setIsCompleted] = useState(false);
  const [statusByStep, setStatusByStep] = useState<Record<number, Status | undefined>>(initialStatuses || {});
  const [saving, setSaving] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openObsStepId, setOpenObsStepId] = useState<number | null>(null);
  const [obsLoading, setObsLoading] = useState(false);
  const [summaryOpenByStep, setSummaryOpenByStep] = useState<Record<number, boolean>>({});
  const router = useRouter();
  const [globalObs, setGlobalObs] = useState(initialGlobalObs || "");
  const [obsByStepList, setObsByStepList] = useState<Record<number, ObservationRow[]>>(initialObsByStep || {});
  const [dzResetToken, setDzResetToken] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Documentos globales de la revisión
  const [inspDocs, setInspDocs] = useState<InspDoc[]>([]);
  const [pendingInspFiles, setPendingInspFiles] = useState<File[]>([]);
  const [inspDocsLoading, setInspDocsLoading] = useState(false);
  const [inspDocsDeletingId, setInspDocsDeletingId] = useState<number | null>(null);

  // modal certificado
  // const [certModalOpen, setCertModalOpen] = useState(false);
  // const [certStatus, setCertStatus] = useState<Status>("Apto");

  const stepNameById = useMemo(() => {
    const map: Record<number, string> = {};
    steps.forEach((s) => { map[s.step_id] = s.name; });
    return map;
  }, [steps]);

  const overallStatus: Status | null = useMemo(() => {
    const values = steps.map(s => statusByStep[s.step_id]);
    if (values.some(v => v === "Rechazado")) return "Rechazado";
    if (values.some(v => v === "Condicional")) return "Condicional";
    if (values.some(v => !v)) return null;
    return "Apto";
  }, [steps, statusByStep]);

  const summary = useMemo(() => {
    return Object.entries(obsByStepList)
      .map(([sid, list]) => {
        const stepId = Number(sid);
        const checked = (list || []).filter((o) => o.checked);
        if (checked.length === 0) return null;
        return { stepId, stepName: stepNameById[stepId] ?? `Paso ${stepId}`, checked };
      })
      .filter(Boolean) as { stepId: number; stepName: string; checked: ObservationRow[] }[];
  }, [obsByStepList, stepNameById]);

  const totalChecked = useMemo(() => summary.reduce((acc, it) => acc + it.checked.length, 0), [summary]);
  const hasNonApto = useMemo(() => Object.values(statusByStep).some((s) => s && s !== "Apto"), [statusByStep]);
  const allStepsMarked = useMemo(
    () => steps.every((s) => Boolean(statusByStep[s.step_id])),
    [steps, statusByStep]
  );

  const remainingSteps = useMemo(
    () => steps.filter((s) => !statusByStep[s.step_id]).length,
    [steps, statusByStep]
  );

  // Estado de la aplicación
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!apiBase) return;
      try {
        const res = await fetch(`${apiBase}/applications/get-applications/${appId}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "Completado") setIsCompleted(true);
        }
      } catch (err) {
        console.error("Error checking application status:", err);
      }
    };
    checkApplicationStatus();
  }, [apiBase, appId]);

  // Cargar observaciones faltantes
  useEffect(() => {
    if (!apiBase) return;
    const missing = steps.filter((s) => !(s.step_id in (initialObsByStep || {})));
    if (missing.length === 0) return;

    const abort = new AbortController();
    const run = async () => {
      try {
        const promises = missing.map(async (s) => {
          const res = await fetch(
            `${apiBase}/inspections/inspections/${inspectionId}/steps/${s.step_id}/observations`,
            { credentials: "include", signal: abort.signal }
          );
          if (!res.ok) return null;
          const data: ObservationRow[] = await res.json();
          return { stepId: s.step_id, data };
        });
        const results = await Promise.all(promises);
        setObsByStepList((prev) => {
          const copy = { ...prev };
          results.forEach((r) => { if (r) copy[r.stepId] = r.data; });
          return copy;
        });
      } catch {
        // silencio
      }
    };
    run();
    return () => abort.abort();
  }, [apiBase, inspectionId, steps, initialObsByStep]);

  // Docs globales
  const fetchInspectionDocuments = async () => {
    if (!apiBase) return;
    try {
      setInspDocsLoading(true);
      const url = `${apiBase}/inspections/inspections/${inspectionId}/documents?role=global`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "No se pudieron cargar los documentos");
      }
      const data: InspDoc[] = await res.json();
      setInspDocs(data);
    } catch (e: any) {
      setError(e.message || "Error cargando documentos");
    } finally {
      setInspDocsLoading(false);
    }
  };

  // cargar docs al montar
  useEffect(() => {
    if (!apiBase) return;
    fetchInspectionDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, inspectionId]);

  const onPendingInspectionDocsChange = (files: File[]) => {
    // se muestran como "pendientes, se van a subir al continuar"
    setPendingInspFiles(files);
  };

  const deleteInspectionDocument = async (docId: number) => {
    if (!apiBase) {
      setError("Falta configurar NEXT_PUBLIC_API_URL");
      return;
    }
    if (isCompleted) return;
    try {
      setInspDocsDeletingId(docId);
      const res = await fetch(
        `${apiBase}/inspections/inspections/${inspectionId}/documents/${docId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "No se pudo borrar el documento");
      }
      await fetchInspectionDocuments();
    } catch (e: any) {
      setError(e.message || "Error borrando documento");
    } finally {
      setInspDocsDeletingId(null);
    }
  };

  const fetchStepObservations = async (stepId: number) => {
    if (!apiBase) { setError("Falta configurar NEXT_PUBLIC_API_URL"); return; }
    try {
      setObsLoading(true);
      const res = await fetch(`${apiBase}/inspections/inspections/${inspectionId}/steps/${stepId}/observations`, {
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "No se pudieron cargar las observaciones");
      }
      const data: ObservationRow[] = await res.json();
      setObsByStepList((prev) => ({ ...prev, [stepId]: data }));
    } catch (e: any) {
      setError(e.message || "Error cargando observaciones");
    } finally {
      setObsLoading(false);
    }
  };

  const toggleObsPopover = async (stepId: number) => {
    const willOpen = openObsStepId !== stepId ? stepId : null;
    setOpenObsStepId(willOpen);
    if (willOpen && !obsByStepList[stepId]) {
      await fetchStepObservations(stepId);
    }
  };

  const setCheckedLocal = (stepId: number, obsId: number, checked: boolean) => {
    setObsByStepList((prev) => {
      const list = prev[stepId] || [];
      return { ...prev, [stepId]: list.map((o) => (o.id === obsId ? { ...o, checked } : o)) };
    });
  };

  const persistStepObs = async (stepId: number) => {
    if (!apiBase) return;
    const list = obsByStepList[stepId] || [];
    const checkedIds = list.filter((o) => o.checked).map((o) => o.id);
    const res = await fetch(`${apiBase}/inspections/inspections/${inspectionId}/steps/${stepId}/observations/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ checked_ids: checkedIds }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || "No se pudieron guardar las observaciones");
    }
  };

  const onToggleCheckbox = async (stepId: number, obsId: number) => {
    if (isCompleted) return;
    try {
      const current = obsByStepList[stepId]?.find((o) => o.id === obsId)?.checked ?? false;
      setCheckedLocal(stepId, obsId, !current);
    } catch {
      // silencio
    }
  };

  const uncheckFromChip = async (stepId: number, obsId: number) => {
    if (isCompleted) return;
    try {
      setCheckedLocal(stepId, obsId, false);
      await persistStepObs(stepId);
      setMsg("Observación desmarcada");
      setTimeout(() => setMsg(null), 1400);
    } catch (e: any) {
      setError(e.message || "No se pudo desmarcar");
    }
  };

  const saveObsFromPopover = async (stepId: number) => {
    try {
      await persistStepObs(stepId);
      setMsg("Observaciones del paso guardadas");
      setTimeout(() => setMsg(null), 1400);
      setOpenObsStepId(null);
    } catch (e: any) {
      setError(e.message || "Error guardando observaciones");
    }
  };

  const saveAll = async (): Promise<boolean> => {
    if (!apiBase) {
      setError("Falta configurar NEXT_PUBLIC_API_URL");
      return false;
    }
    if (isCompleted) return false;

    setSaving(true);
    setMsg(null);
    setError(null);

    try {
      // 1) subir archivos pendientes
      if (pendingInspFiles.length > 0) {
        const form = new FormData();
        pendingInspFiles.forEach((f) => form.append("files", f));
        form.append("role", "global");
        const uploadRes = await fetch(`${apiBase}/inspections/inspections/${inspectionId}/documents`, {
          method: "POST",
          credentials: "include",
          body: form,
        });
        const upData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          throw new Error(upData?.error || "No se pudieron subir los archivos de la revisión");
        }
        setPendingInspFiles([]);
        await fetchInspectionDocuments();
      }

      // 2) guardar estados de pasos y observaciones generales
      const items = steps
        .map((s) => {
          const st = statusByStep[s.step_id];
          if (!st) return null;
          return { step_id: s.step_id, status: st, observations: "" };
        })
        .filter(Boolean);

      const [bulkRes, putRes] = await Promise.all([
        fetch(`${apiBase}/inspections/inspections/${inspectionId}/details/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ items }),
        }),
        fetch(`${apiBase}/inspections/inspections/${inspectionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ global_observations: globalObs.trim() }),
        }),
      ]);

      if (!bulkRes.ok) {
        const j = await bulkRes.json().catch(() => ({}));
        throw new Error(j?.error || "No se pudieron guardar los pasos");
      }
      if (!putRes.ok) {
        const j = await putRes.json().catch(() => ({}));
        throw new Error(j?.error || "No se pudieron guardar las observaciones generales");
      }

      setMsg("Revisión guardada");
      setPendingInspFiles([]);
      setDzResetToken((t) => t + 1);
      await fetchInspectionDocuments();
      setTimeout(() => setMsg(null), 1500);

      return true;
    } catch (e: any) {
      setError(e.message || "Error al guardar");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const generateCertificate = async (status: Status) => {
    if (!apiBase) { setError("Falta configurar NEXT_PUBLIC_API_URL"); return; }
    if (isCompleted) { setError("La revisión ya está completada"); return; }
    const allMarkedNow = steps.every((s) => Boolean(statusByStep[s.step_id]));
    if (!allMarkedNow) {
      setError("Marcá un estado en todos los pasos antes de generar el certificado");
      return;
    }

    setCertLoading(true);
    setError(null);
    setMsg(null);

    // Abrimos la pestaña primero para evitar bloqueos
    const newTab = window.open("", "_blank");
    if (!newTab) {
      setCertLoading(false);
      setError("El navegador bloqueó la ventana emergente");
      return;
    }
    try {
      try { newTab.opener = null; } catch {}

      // HTML con CSS correcto, usando punto y coma
      newTab.document.write(`
        <html>
          <head>
            <title>Generando certificado...</title>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
              html, body { height: 100%; }
              body {
                margin: 0;
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
                background: #fff;
                color: #0040B8;
              }
              .container { text-align: center; padding: 24px; }
              .spinner {
                width: 60px;
                height: 60px;
                border: 6px solid rgba(0,0,0,.1);
                border-top-color: #0040B8;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
              h2 { margin: 8px 0 4px; font-weight: 600; }
              p { margin: 0; color: #2b3d6b; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="spinner"></div>
              <h2>Generando certificado</h2>
              <p>Por favor espera un momento...</p>
            </div>
          </body>
        </html>
      `);
      newTab.document.close();

      // Guardar todo antes de generar
      const saved = await saveAll();
      if (!saved) {
        try { if (!newTab.closed) newTab.close(); } catch {}
        setCertLoading(false);
        return;
      }

      // Generar certificado
      const res = await fetch(`${apiBase}/certificates/certificates/application/${appId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ condicion: status }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.error || "No se pudo generar el certificado");

      const url = data?.public_url || data?.template_url;
      if (!url) throw new Error("No se recibió el link del certificado");

      newTab.location.href = url;
      setMsg("Certificado generado");
      setConfirmOpen(false);
      router.push(`/dashboard/${id}/inspections-queue`);
      // setCertModalOpen(false);
    } catch (e: any) {
      try { if (!newTab.closed) newTab.close(); } catch {}
      setError(e.message || "Error generando certificado");
    } finally {
      setCertLoading(false);
    }
  };


  return (
    <div className="w-full px-4 pb-10">
      {isCompleted && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Revisión Completada</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Esta revisión ya fue completada, no se pueden realizar modificaciones.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="w-full space-y-4">
        {steps.map((s) => {
          const current = statusByStep[s.step_id];
          const isNonApto = current === "Condicional" || current === "Rechazado";
          const options: Status[] = isNonApto ? ([current] as Status[]) : (["Apto", "Condicional", "Rechazado"] as Status[]);
          const listForStep = obsByStepList[s.step_id] || [];

          return (
            <section
              key={s.step_id}
              className={clsx(
                "w-full rounded-[10px] bg-white transition-colors",
                statusByStep[s.step_id] ? STATUS_UI[statusByStep[s.step_id] as Status].stepBorder : "border-zinc-200",
                "border"
              )}
            >
              <div className="flex flex-col lg:flex-row md:items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <h3 className="font-medium text-zinc-900">{s.name}</h3>
                  <p className="hidden min-[1300px]:block text-sm md:max-w-[400px] text-zinc-500">{s.description}</p>
                </div>

                <div className="flex items-center gap-5 flex-wrap">
                  {options.map((opt) => {
                    const selected = current === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={isCompleted}
                        onClick={() =>
                          setStatusByStep((prev) => {
                            const cur = prev[s.step_id];
                            if (cur === opt) {
                              const { [s.step_id]: _, ...rest } = prev;
                              return rest;
                            }
                            return { ...prev, [s.step_id]: opt };
                          })
                        }
                        className={clsx(
                          "w-[140px] px-4 py-2.5 rounded-[4px] border text-sm transition",
                          selected ? STATUS_UI[opt].btn : "border-zinc-200 text-zinc-700 hover:bg-zinc-50",
                          isCompleted && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}

                  {isNonApto && (
                    <div className="relative">
                      <button
                        type="button"
                        disabled={isCompleted}
                        className={clsx(
                          "ml-2 px-4 py-2.5 rounded-[4px] border text-sm flex items-center gap-2",
                          "border-[#0040B8] text-[#0040B8] hover:bg-zinc-50",
                          isCompleted && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => toggleObsPopover(s.step_id)}
                      >
                        <span>Observaciones</span>
                        <ChevronRight size={16} />
                      </button>

                      {openObsStepId === s.step_id && (
                        <div className="absolute z-40 top-full right-0 mt-2 w-[min(90vw,32rem)] max-h-80 overflow-auto rounded-[4px] border border-zinc-200 bg-white shadow-lg">
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-[#00000080] text-sm">Observaciones</h4>
                              <button className="p-1 rounded hover:bg-zinc-100" onClick={() => setOpenObsStepId(null)}>
                                <X size={16} />
                              </button>
                            </div>

                            {obsLoading ? (
                              <div className="text-sm text-zinc-500 p-2">Cargando...</div>
                            ) : (
                              <ul className="space-y-2">
                                {listForStep.map((o) => (
                                  <li key={o.id} className="flex items-start gap-2">
                                    <input
                                      id={`obs-${s.step_id}-${o.id}`}
                                      type="checkbox"
                                      checked={o.checked}
                                      disabled={isCompleted}
                                      onChange={() => onToggleCheckbox(s.step_id, o.id)}
                                      className={clsx("mt-1", isCompleted && "opacity-50 cursor-not-allowed")}
                                    />
                                    <label htmlFor={`obs-${s.step_id}-${o.id}`} className="text-sm text-zinc-800">
                                      {o.description}
                                    </label>
                                  </li>
                                ))}
                                {listForStep.length === 0 && (
                                  <li className="text-sm text-zinc-500">No hay observaciones configuradas para este paso.</li>
                                )}
                              </ul>
                            )}

                            <div className="mt-3 flex justify-end gap-2">
                              <button
                                className="px-3 py-1.5 rounded-[4px] border border-zinc-300 text-zinc-700 hover:bg-zinc-50 text-sm"
                                onClick={() => setOpenObsStepId(null)}
                              >
                                Cerrar
                              </button>
                              <button
                                className="px-3 py-1.5 rounded-[4px] bg-[#0040B8] text-white hover:opacity-95 text-sm"
                                onClick={() => saveObsFromPopover(s.step_id)}
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Adjuntos globales, sin botones, se suben al guardar */}
      <section className="rounded-[10px] border border-zinc-200 bg-white p-4 w-full mt-6">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-medium text-zinc-900">Adjuntos de la revisión</h4>
          {inspDocsLoading && <span className="text-xs text-zinc-500">Actualizando...</span>}
        </div>
        <p className="text-xs text-zinc-500 mb-3">
          Los archivos que agregues quedan pendientes y se suben cuando guardás la revisión.
        </p>

        <div className={clsx(isCompleted && "opacity-50")}>
          <Dropzone
            onPendingChange={onPendingInspectionDocsChange}
            existing={inspDocs}
            onDeleteExisting={(docId) => deleteInspectionDocument(docId)}
            title=""
            maxSizeMB={15}
            resetToken={dzResetToken}
          />
        </div>
      </section>

      {/* Observaciones generales y resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-4 mt-8 w-full">
        <div className="rounded-[10px] text-sm border border-zinc-200 bg-white p-4 w-full self-start">
          <textarea
            value={globalObs}
            onChange={(e) => setGlobalObs(e.target.value)}
            placeholder="Observaciones generales..."
            disabled={isCompleted}
            className={clsx("w-full h-40 outline-none resize-none", isCompleted && "opacity-50 cursor-not-allowed")}
            maxLength={400}
          />
          <div className="mt-2 text-right text-xs text-zinc-400">{globalObs.length}/400</div>
        </div>

        <div className="rounded-[10px] border border-zinc-200 bg-white p-4 w-full self-start">
          <div className="w-full flex items-center justify-between rounded-[6px] border px-3 py-2 text-sm border-[#0040B8] text-[#0040B8]">
            <span>Observaciones marcadas</span>
            <span className="text-xs rounded bg-[#0040B8] text-white px-2 py-0.5">{totalChecked}</span>
          </div>

          <div className="mt-3 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {summary.map((item) => {
              const isOpen = !!summaryOpenByStep[item.stepId];
              const all = item.checked;
              return (
                <div key={item.stepId} className="rounded-[4px] border border-zinc-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setSummaryOpenByStep((prev) => ({ ...prev, [item.stepId]: !prev[item.stepId] }))}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm bg-white"
                  >
                    <span className={clsx("truncate", isOpen ? "text-zinc-900" : "text-zinc-600")}>{item.stepName}</span>
                    <svg className={clsx("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "rotate-0")} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="p-3 space-y-2">
                      {all.map((o) => (
                        <div key={o.id} className="flex items-center justify-between rounded border border-zinc-200 bg-white px-3 py-2">
                          <p className="text-sm text-zinc-800">{o.description}</p>
                          <button
                            className={clsx("p-1 rounded hover:bg-zinc-100", isCompleted && "opacity-50 cursor-not-allowed")}
                            disabled={isCompleted}
                            onClick={() => uncheckFromChip(item.stepId, o.id)}
                            aria-label="Desmarcar observación"
                            title="Desmarcar"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {summary.length === 0 && <div className="text-xs text-zinc-500">No hay observaciones marcadas todavía.</div>}
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-center gap-5 mt-10 w-full">
        <button
          type="button"
          className="px-5 py-2.5 rounded-[4px] border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
          onClick={() => router.back()}
        >
          Cancelar
        </button>

        <button
          type="button"
          disabled={certLoading || isCompleted}
          onClick={() => {
            if (!overallStatus) {
              setError("Marcá un estado en todos los pasos antes de generar el certificado");
              return;
            }
            setConfirmOpen(true);
          }}
          className={clsx(
            "px-5 py-2.5 rounded-[4px] border text-[#0040B8]",
            certLoading ? "bg-blue-100 border-blue-200" : "border-[#0040B8] hover:bg-zinc-50",
            isCompleted && "opacity-50 cursor-not-allowed"
          )}
          title={isCompleted ? "No se puede generar certificado, revisión completada" : "Generar y abrir certificado"}
        >
          {certLoading ? "Generando..." : "Certificado"}
        </button>


        <button
          type="button"
          disabled={saving || isCompleted}
          onClick={saveAll}
          className={clsx(
            "px-5 py-2.5 rounded-[4px] text-white",
            saving ? "bg-blue-300" : "bg-[#0040B8] hover:opacity-95",
            isCompleted && "opacity-50 cursor-not-allowed"
          )}
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {/* Modal certificado */}
      {/* {certModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/30" onClick={() => !certLoading && setCertModalOpen(false)} />
          <div className="relative z-10 w-[min(92vw,520px)] rounded-[10px] border border-zinc-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-zinc-900">Generar certificado</h3>
              <button className="p-1 rounded hover:bg-zinc-100" onClick={() => !certLoading && setCertModalOpen(false)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 text-sm text-zinc-600">Elegí la condición del certificado y confirmá para generarlo.</p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {(["Apto", "Condicional", "Rechazado"] as Status[]).map((opt) => {
                const selected = certStatus === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={certLoading}
                    onClick={() => setCertStatus(opt)}
                    className={clsx(
                      "w-full px-4 py-2.5 rounded-[4px] border text-sm transition",
                      selected ? STATUS_UI[opt].btn : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={certLoading}
                className="px-4 py-2 rounded-[4px] border border-zinc-300 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                onClick={() => setCertModalOpen(false)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                disabled={certLoading} 
                className="px-4 py-2 rounded-[4px] bg-[#0040B8] text-white text-sm hover:opacity-95 disabled:opacity-60" 
                onClick={() => generateCertificate(certStatus)} 
              > 
                {certLoading ? "Generando..." : "Confirmar"} 
              </button>            
            </div>
          </div>
        </div>
      )} */}
      {confirmOpen && overallStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/30" onClick={() => !certLoading && setConfirmOpen(false)} />
          <div className="relative z-10 w-[min(92vw,520px)] rounded-[10px] border border-zinc-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-zinc-900">Confirmar certificado</h3>
              <button className="p-1 rounded hover:bg-zinc-100" onClick={() => !certLoading && setConfirmOpen(false)} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 text-sm text-zinc-600">
              Se generará el certificado con condición
              <span className={clsx(
                "ml-1 px-2 py-0.5 rounded border text-sm",
                overallStatus === "Apto" ? "border-[#0040B8] text-[#0040B8]" :
                overallStatus === "Condicional" ? "border-amber-600 text-amber-700" :
                "border-black text-black"
              )}>
                {overallStatus}
              </span>
            </p>

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={certLoading}
                className="px-4 py-2 rounded-[4px] border border-zinc-300 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                onClick={() => setConfirmOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={certLoading}
                className="px-4 py-2 rounded-[4px] bg-[#0040B8] text-white text-sm hover:opacity-95 disabled:opacity-60"
                onClick={() => generateCertificate(overallStatus)}
              >
                {certLoading ? "Generando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!allStepsMarked && (
        <div className="mt-4 text-sm text-amber-700 text-center">
          Te faltan {remainingSteps} paso{remainingSteps === 1 ? "" : "s"} por marcar.
        </div>
      )}
      {msg && <div className="mt-4 text-sm text-[#41c227] border border-[#41c227] p-3 rounded-[6px] text-center">{msg}</div>}
      {error && <div className="mt-4 text-sm text-[#d11b2d] border border-[#d11b2d] p-3 rounded-[6px] text-center">{error}</div>}
    </div>
  );
}
