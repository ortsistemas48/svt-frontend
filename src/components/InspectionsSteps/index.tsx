// components/inspections/InspectionStepsClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Step = { step_id: number; name: string; description: string; order: number };
type Status = "Apto" | "Condicional" | "Rechazado";
type ObservationRow = { id: number; description: string; checked: boolean };

const STATUS_UI: Record<Status, { btn: string; stepBorder: string }> = {
  Apto: {
    btn: "border-[#0040B8] text-[#0040B8] bg-[#0040B8]/10",
    stepBorder: "border-[#0040B8]/50",
  },
  Condicional: {
    btn: "border-amber-600 text-amber-700 bg-amber-50",
    stepBorder: "border-amber-600/50",
  },
  Rechazado: {
    btn: "border-black text-black bg-black/5",
    stepBorder: "border-black/50",
  },
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

  // nuevo: modal de certificado
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certStatus, setCertStatus] = useState<Status>("Apto");

  const stepNameById = useMemo(() => {
    const map: Record<number, string> = {};
    steps.forEach((s) => {
      map[s.step_id] = s.name;
    });
    return map;
  }, [steps]);

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

  const handlePick = (stepId: number, val: Status) => {
    setStatusByStep((prev) => {
      const current = prev[stepId];
      if (current === val) {
        const { [stepId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [stepId]: val };
    });
  };

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
          results.forEach((r) => {
            if (r) copy[r.stepId] = r.data;
          });
          return copy;
        });
      } catch {
        // silencio
      }
    };
    run();
    return () => abort.abort();
  }, [apiBase, inspectionId, steps, initialObsByStep]);

  const fetchStepObservations = async (stepId: number) => {
    if (!apiBase) {
      setError("Falta configurar NEXT_PUBLIC_API_URL");
      return;
    }
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
      return {
        ...prev,
        [stepId]: list.map((o) => (o.id === obsId ? { ...o, checked } : o)),
      };
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
    try {
      const current = obsByStepList[stepId]?.find((o) => o.id === obsId)?.checked ?? false;
      setCheckedLocal(stepId, obsId, !current);
    } catch {
      // silencio
    }
  };

  const uncheckFromChip = async (stepId: number, obsId: number) => {
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

  const saveAll = async () => {
    if (!apiBase) {
      setError("Falta configurar NEXT_PUBLIC_API_URL");
      return;
    }
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
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
        throw new Error(j?.error || "No se pudieron guardar las observaciones globales");
      }

      setMsg("Datos guardados");
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const generateCertificate = async (status: Status) => {
    if (!apiBase) {
      setError("Falta configurar NEXT_PUBLIC_API_URL");
      return;
    }

    const newTab = window.open("about:blank", "_blank");
    if (!newTab) {
      setError("El navegador bloqueó la ventana emergente");
      return;
    }

    try {
      try { newTab.opener = null; } catch {}

      // HTML con estilos modernos + spinner
      newTab.document.write(`
        <html>
          <head>
            <title>Generando certificado...</title>
            <style>
              body {
                margin: 0;
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                font-family: system-ui, sans-serif;
                background: #fff;
                color: #0040B8;
              }
              .container {
                text-align: center;
                animation: fadeIn 0.6s ease;
              }
              .spinner {
                width: 60px;
                height: 60px;
                border: 6px solid rgba(255,255,255,0.3);
                border-top-color:  #0040B8;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
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

      setCertLoading(true);
      setError(null);
      setMsg(null);

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
      setCertModalOpen(false);
    } catch (e: any) {
      try { if (!newTab.closed) newTab.close(); } catch {}
      setError(e.message || "Error generando certificado");
    } finally {
      setCertLoading(false);
    }
  };

  return (
    <div className="w-full px-4 pb-10">
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
                  <p className="hidden min-[1300px]:block text-sm md:max-w-[400px] text-zinc-500">
                    {s.description}
                  </p>
                </div>

                <div className="flex items-center gap-5 flex-wrap">
                  {options.map((opt) => {
                    const selected = statusByStep[s.step_id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handlePick(s.step_id, opt)}
                        className={clsx(
                          "w-[140px] px-4 py-2.5 rounded-[4px] border text-sm transition",
                          selected ? STATUS_UI[opt].btn : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
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
                        className={clsx(
                          "ml-2 px-4 py-2.5 rounded-[4px] border text-sm flex items-center gap-2",
                          "border-[#0040B8] text-[#0040B8] hover:bg-zinc-50"
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
                                      onChange={() => onToggleCheckbox(s.step_id, o.id)}
                                      className="mt-1"
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

      <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-4 mt-8 w-full">
        <div className="rounded-[10px] text-sm border border-zinc-200 bg-white p-4 w-full self-start">
          <textarea
            value={globalObs}
            onChange={(e) => setGlobalObs(e.target.value)}
            placeholder="Observaciones generales..."
            className="w-full h-40 outline-none resize-none"
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
                    <span className={clsx("truncate", isOpen ? "text-zinc-900" : "text-zinc-600")}>
                      {item.stepName}
                    </span>
                    <svg
                      className={clsx("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "rotate-0")}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="p-3 space-y-2">
                      {all.map((o) => (
                        <div key={o.id} className="flex items-center justify-between rounded border border-zinc-200 bg-white px-3 py-2">
                          <p className="text-sm text-zinc-800">{o.description}</p>
                          <button
                            className="p-1 rounded hover:bg-zinc-100"
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

      <div className="flex items-center justify-center gap-5 mt-10 w-full">
        <button
          type="button"
          className="px-5 py-2.5 rounded-[4px] border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
          onClick={() => router.back()}
        >
          Cancelar
        </button>

        {/* botón Certificado, ahora abre modal */}
        <button
          type="button"
          disabled={certLoading}
          onClick={() => {
            // si hay algún paso no apto, sugerimos arrancar en Condicional
            setCertStatus(hasNonApto ? "Condicional" : "Apto");
            setCertModalOpen(true);
          }}
          className={clsx(
            "px-5 py-2.5 rounded-[4px] border text-[#0040B8]",
            certLoading ? "bg-blue-100 border-blue-200" : "border-[#0040B8] hover:bg-zinc-50"
          )}
          title="Generar y abrir certificado"
        >
          {certLoading ? "Generando..." : "Certificado"}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={saveAll}
          className={clsx("px-5 py-2.5 rounded-[4px] text-white", saving ? "bg-blue-300" : "bg-[#0040B8] hover:opacity-95")}
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {/* Modal de confirmación de certificado */}
      {certModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => !certLoading && setCertModalOpen(false)}
          />
          {/* content */}
          <div className="relative z-10 w-[min(92vw,520px)] rounded-[10px] border border-zinc-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-zinc-900">Generar certificado</h3>
              <button
                className="p-1 rounded hover:bg-zinc-100"
                onClick={() => !certLoading && setCertModalOpen(false)}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-2 text-sm text-zinc-600">
              Elegí la condición del certificado y confirmá para generarlo.
            </p>

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
                className={clsx(
                  "px-4 py-2 rounded-[4px] bg-[#0040B8] text-white text-sm hover:opacity-95 disabled:opacity-60"
                )}
                onClick={() => generateCertificate(certStatus)}
              >
                {certLoading ? "Generando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {msg && <div className="mt-4 text-sm text-[#41c227] border border-[#41c227] p-3 rounded-[6px] text-center">{msg}</div>}
      {error && <div className="mt-4 text-sm text-[#d11b2d] border border-[#d11b2d] p-3 rounded-[6px] text-center">{error}</div>}
    </div>
  );
}
