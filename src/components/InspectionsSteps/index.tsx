// components/inspections/InspectionStepsClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronRight, X, Plus, Check } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Dropzone, { type ExistingDoc as InspDoc } from "@/components/Dropzone";

type Step = { step_id: number; name: string; description: string; order: number };
type Status = "Apto" | "Condicional" | "Rechazado";

type Category = { category_id: number; name: string };
type ObservationLeaf = { observation_id: number; description: string };

type LeafSelectionState = {
  [stepId: number]: {
    [categoryId: number]: {
      categoryName: string;
      leaves: string[];
    };
  };
};

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
  initialGlobalObs,
}: {
  inspectionId: number;
  appId: number;
  steps: Step[];
  initialStatuses: Record<number, Status | undefined>;
  apiBase: string | undefined;
  initialGlobalObs?: string;
}) {
  const { id } = useParams();
  const router = useRouter();

  const [isCompleted, setIsCompleted] = useState(false);
  const [statusByStep, setStatusByStep] = useState<Record<number, Status | undefined>>(
    initialStatuses || {}
  );

  const [selectionMap, setSelectionMap] = useState<LeafSelectionState>({});
  const [globalText, setGlobalText] = useState<string>((initialGlobalObs || "").trim());

  const [saving, setSaving] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [obsModalStepId, setObsModalStepId] = useState<number | null>(null);
  const [obsLoading, setObsLoading] = useState(false);
  type ObsView = "parents" | "items";
  const [obsView, setObsView] = useState<ObsView>("parents");

  const [categories, setCategories] = useState<Category[]>([]);
  const [leaves, setLeaves] = useState<ObservationLeaf[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const [inspDocs, setInspDocs] = useState<InspDoc[]>([]);
  const [pendingInspFiles, setPendingInspFiles] = useState<File[]>([]);
  const [inspDocsLoading, setInspDocsLoading] = useState(false);
  const [inspDocsDeletingId, setInspDocsDeletingId] = useState<number | null>(null);
  const [dzResetToken, setDzResetToken] = useState(0);

  const MAX_CHARS = 1200;
  const obsCharCount = globalText.length;

  const stepNameById = useMemo(() => {
    const map: Record<number, string> = {};
    steps.forEach((s) => (map[s.step_id] = s.name));
    return map;
  }, [steps]);

  const overallStatus: Status | null = useMemo(() => {
    const values = steps.map((s) => statusByStep[s.step_id]);
    if (values.some((v) => v === "Rechazado")) return "Rechazado";
    if (values.some((v) => v === "Condicional")) return "Condicional";
    if (values.some((v) => !v)) return null;
    return "Apto";
  }, [steps, statusByStep]);

  const allStepsMarked = useMemo(
    () => steps.every((s) => Boolean(statusByStep[s.step_id])),
    [steps, statusByStep]
  );

  const remainingSteps = useMemo(
    () => steps.filter((s) => !statusByStep[s.step_id]).length,
    [steps, statusByStep]
  );

  useEffect(() => {
    if (!apiBase) return;
    (async () => {
      try {
        const res = await fetch(`${apiBase}/applications/get-applications/${appId}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === "Completado") setIsCompleted(true);
        }
      } catch {}
    })();
  }, [apiBase, appId]);

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

  useEffect(() => {
    if (!apiBase) return;
    fetchInspectionDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, inspectionId]);

  const onPendingInspectionDocsChange = (files: File[]) => setPendingInspFiles(files);

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

  const openObsModalForStep = async (stepId: number) => {
    setObsModalStepId(stepId);
    setObsView("parents");
    setSelectedCategory(null);
    setCategories([]);
    setLeaves([]);
    await fetchCategories(stepId);
  };

  const closeObsModal = () => {
    setObsModalStepId(null);
    setObsView("parents");
    setSelectedCategory(null);
    setCategories([]);
    setLeaves([]);
  };

  const fetchCategories = async (stepId: number) => {
    if (!apiBase) {
      setError("Falta configurar NEXT_PUBLIC_API_URL");
      return;
    }
    try {
      setObsLoading(true);
      const res = await fetch(
        `${apiBase}/inspections/inspections/${inspectionId}/steps/${stepId}/categories`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "No se pudieron cargar las categorías");
      }
      const data: Category[] = await res.json();
      setCategories(data);
    } catch (e: any) {
      setError(e.message || "Error cargando categorías");
    } finally {
      setObsLoading(false);
    }
  };

  const goToLeaves = async (cat: Category) => {
    if (!apiBase || obsModalStepId === null) return;
    try {
      setObsLoading(true);
      setSelectedCategory(cat);
      setObsView("items");
      setLeaves([]);

      const res = await fetch(
        `${apiBase}/inspections/inspections/${inspectionId}/steps/${obsModalStepId}/categories/${cat.category_id}/observations`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "No se pudieron cargar las observaciones");
      }
      const data: ObservationLeaf[] = await res.json();
      setLeaves(data);
    } catch (e: any) {
      setError(e.message || "Error cargando observaciones");
    } finally {
      setObsLoading(false);
    }
  };

  function buildCategoryParts(selMap: LeafSelectionState): Record<string, string> {
    const agg: Record<string, Set<string>> = {};
    Object.values(selMap).forEach((catsForStep) => {
      Object.values(catsForStep).forEach(({ categoryName, leaves }) => {
        if (!agg[categoryName]) agg[categoryName] = new Set<string>();
        leaves.forEach((lv) => agg[categoryName].add(lv));
      });
    });
    const out: Record<string, string> = {};
    Object.entries(agg).forEach(([cat, leavesSet]) => {
      const arr = Array.from(leavesSet);
      out[cat] = arr.length > 0 ? `${cat} (${arr.join(", ")})` : cat;
    });
    return out;
  }

  function mergePartsIntoGlobalText(currentText: string, parts: Record<string, string>) {
    if (!currentText.trim()) {
      return Object.values(parts).join("/");
    }

    const tokens = currentText
      .split("/")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const lowerTokens = tokens.map((t) => t.toLowerCase());

    Object.entries(parts).forEach(([cat, newPart]) => {
      const idx = lowerTokens.findIndex((tok) =>
        tok.startsWith(cat.toLowerCase())
      );
      if (idx >= 0) {
        tokens[idx] = newPart;
        lowerTokens[idx] = newPart.toLowerCase();
      } else {
        tokens.push(newPart);
        lowerTokens.push(newPart.toLowerCase());
      }
    });

    return tokens.join("/");
  }

  const addLeafToSelection = (stepId: number, cat: Category, leaf: ObservationLeaf) => {
    setSelectionMap((prev) => {
      const prevStep = prev[stepId] || {};
      const prevCat = prevStep[cat.category_id] || {
        categoryName: cat.name,
        leaves: [],
      };

      let newLeaves = prevCat.leaves;
      if (!newLeaves.includes(leaf.description)) {
        newLeaves = [...newLeaves, leaf.description];
      } else {
        return prev;
      }

      const draft: LeafSelectionState = {
        ...prev,
        [stepId]: {
          ...prevStep,
          [cat.category_id]: {
            categoryName: cat.name,
            leaves: newLeaves,
          },
        },
      };

      const draftParts = buildCategoryParts(draft);
      const mergedText = mergePartsIntoGlobalText(globalText, draftParts);

      if (mergedText.length > MAX_CHARS) {
        setError("No se puede agregar: superarías el límite de 1200 caracteres.");
        return prev;
      }

      setGlobalText(mergedText);
      setMsg("Observación agregada");
      setTimeout(() => setMsg(null), 1000);

      return draft;
    });
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
      if (pendingInspFiles.length > 0) {
        const form = new FormData();
        pendingInspFiles.forEach((f) => form.append("files", f));
        form.append("role", "global");
        const uploadRes = await fetch(
          `${apiBase}/inspections/inspections/${inspectionId}/documents`,
          {
            method: "POST",
            credentials: "include",
            body: form,
          }
        );
        const upData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          throw new Error(upData?.error || "No se pudieron subir los archivos");
        }
        setPendingInspFiles([]);
        await fetchInspectionDocuments();
      }

      const items = steps
        .map((s) => {
          const st = statusByStep[s.step_id];
          if (!st) return null;
          return { step_id: s.step_id, status: st, observations: "" };
        })
        .filter(Boolean);

      const payloadText = globalText.trim();

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
          body: JSON.stringify({ global_observations: payloadText }),
        }),
      ]);

      if (!bulkRes.ok) {
        const j = await bulkRes.json().catch(() => ({}));
        throw new Error(j?.error || "No se pudieron guardar los pasos");
      }
      if (!putRes.ok) {
        const j = await putRes.json().catch(() => ({}));
        throw new Error(j?.error || "No se pudieron guardar las observaciones");
      }

      setMsg("Revisión guardada");
      setDzResetToken((t) => t + 1);
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
    if (!apiBase) {
      setError("Falta configurar NEXT_PUBLIC_API_URL");
      return;
    }
    if (isCompleted) {
      setError("La revisión ya está completada");
      return;
    }

    const allMarkedNow = steps.every((s) => Boolean(statusByStep[s.step_id]));
    if (!allMarkedNow) {
      setError("Marcá un estado en todos los pasos antes de generar el certificado");
      return;
    }

    setCertLoading(true);
    setError(null);
    setMsg(null);

    const newTab = window.open("", "_blank");
    if (!newTab) {
      setCertLoading(false);
      setError("El navegador bloqueó la ventana emergente");
      return;
    }
    try {
      try {
        newTab.opener = null;
      } catch {}

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
                width: 60px; height: 60px;
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

      const saved = await saveAll();
      if (!saved) {
        try {
          if (!newTab.closed) newTab.close();
        } catch {}
        setCertLoading(false);
        return;
      }

      const res = await fetch(
        `${apiBase}/certificates/certificates/application/${appId}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ condicion: status }),
        }
      );

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.error || "No se pudo generar el certificado");

      const url = data?.public_url || data?.template_url;
      if (!url) throw new Error("No se recibió el link del certificado");

      newTab.location.href = url;
      setMsg("Certificado generado");
      setConfirmOpen(false);
      router.push(`/dashboard/${id}/inspections-queue`);
    } catch (e: any) {
      try {
        if (!newTab.closed) newTab.close();
      } catch {}
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
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
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

      <div className="w-full space-y-4">
        {steps.map((s) => {
          const current = statusByStep[s.step_id];
          const isNonApto = current === "Condicional" || current === "Rechazado";
          const options: Status[] = isNonApto ? ([current] as Status[]) : (["Apto", "Condicional", "Rechazado"] as Status[]);
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
                  {options.map((opt) => {
                    const selected = current === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        disabled={isCompleted}
                        onClick={() =>
                          setStatusByStep((prev) => ({
                            ...prev,
                            [s.step_id]: prev[s.step_id] === opt ? undefined : opt,
                          }))
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
                    <button
                      type="button"
                      disabled={isCompleted}
                      className={clsx(
                        "ml-2 px-4 py-2.5 rounded-[4px] border text-sm flex items-center gap-2",
                        "border-[#0040B8] text-[#0040B8] hover:bg-zinc-50",
                        isCompleted && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => openObsModalForStep(s.step_id)}
                    >
                      <span>Observaciones</span>
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <section className="rounded-[10px] border border-zinc-200 bg-white p-4 w-full mt-6">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-medium text-zinc-900">Subir informes técnicos y fotos del vehiculo.</h4>
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

      <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-4 mt-8 w-full">
        <div className="rounded-[10px] text-sm border border-zinc-200 bg-white p-4 w-full self-start md:col-span-2">
          <textarea
            value={globalText}
            onChange={(e) => {
              const txt = e.target.value;
              if (txt.length <= MAX_CHARS) {
                setGlobalText(txt);
              }
            }}
            disabled={isCompleted}
            className={clsx(
              "w-full h-40 outline-none resize-none",
              isCompleted && "opacity-50 cursor-not-allowed"
            )}
            maxLength={MAX_CHARS}
          />
          <div className="mt-2 text-right text-xs text-zinc-400">
            {obsCharCount}/{MAX_CHARS}
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

      {confirmOpen && overallStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/30" onClick={() => !certLoading && setConfirmOpen(false)} />
          <div className="relative z-10 w-[min(92vw,520px)] rounded-[10px] border border-zinc-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-semibold text-zinc-900">Confirmar certificado</h3>
              <button
                className="p-1 rounded hover:bg-zinc-100"
                onClick={() => !certLoading && setConfirmOpen(false)}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <p className="mt-6 mb-2 text-md text-zinc-600">
              Se generará el certificado con condición{" "}
              <span
                className={clsx(
                  "ml-2 px-2 py-0.5 rounded border text-sm",
                  overallStatus === "Apto"
                    ? "border-[#0040B8] text-[#0040B8]"
                    : overallStatus === "Condicional"
                    ? "border-amber-600 text-amber-700"
                    : "border-black text-black"
                )}
              >
                {overallStatus}
              </span>
            </p>

            <div className="mt-10 flex items-center justify-center gap-4">
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

      {obsModalStepId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => !obsLoading && closeObsModal()} />
          <div className="relative z-10 w-[min(92vw,520px)] max-h-[80vh] flex flex-col rounded-[16px] border border-zinc-200 bg-white shadow-xl">
            <div className="flex items-start justify-between p-4 border-b border-zinc-200">
              <div className="flex flex-col">
                {obsView === "parents" && (
                  <>
                    <h3 className="text-base font-semibold text-zinc-900">
                      Observaciones — {stepNameById[obsModalStepId] || `Paso ${obsModalStepId}`}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">Elegí una categoría</p>
                  </>
                )}

                {obsView === "items" && (
                  <>
                    <button
                      className="text-[#0040B8] text-xs font-medium flex items-center gap-1 mb-1"
                      onClick={() => {
                        setObsView("parents");
                        setSelectedCategory(null);
                        setLeaves([]);
                      }}
                    >
                      <ChevronRight size={14} className="rotate-180" />
                      Volver a categorías
                    </button>
                    <h3 className="text-base font-semibold text-zinc-900">
                      {selectedCategory?.name || "Categoría"}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500">Tocá para agregar al texto</p>
                  </>
                )}
              </div>

              <button
                className="p-1 rounded hover:bg-zinc-100 text-zinc-500"
                onClick={() => !obsLoading && closeObsModal()}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {obsLoading ? (
                <div className="text-sm text-zinc-500 py-10 text-center">Cargando...</div>
              ) : (
                <>
                  {obsView === "parents" && (
                    <ul className="divide-y divide-zinc-200">
                      {categories.map((c) => {
                        const selectedCount =
                          selectionMap[obsModalStepId!]?.[c.category_id]?.leaves.length || 0;
                        return (
                          <li key={c.category_id} className="flex items-center justify-between py-3">
                            <button
                              className="flex items-center text-left flex-1 pr-3 gap-2"
                              disabled={isCompleted}
                              onClick={() => goToLeaves(c)}
                            >
                              <span className="text-sm text-zinc-900">{c.name}</span>
                              {selectedCount > 0 && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {selectedCount} agregado{selectedCount > 1 ? "s" : ""}
                                </span>
                              )}
                            </button>
                            <ChevronRight size={16} className="text-zinc-500" />
                          </li>
                        );
                      })}

                      {categories.length === 0 && (
                        <li className="py-6 text-center text-sm text-zinc-500">
                          No hay categorías configuradas
                        </li>
                      )}
                    </ul>
                  )}

                  {obsView === "items" && (
                    <ul className="space-y-2">
                      {leaves.map((leaf) => {
                        const already =
                          !!selectionMap[obsModalStepId!]?.[selectedCategory!.category_id]?.leaves.includes(
                            leaf.description
                          );
                        return (
                          <li
                            key={leaf.observation_id}
                            className={clsx(
                              "flex items-center justify-between rounded border p-3",
                              already ? "border-emerald-300 bg-emerald-50/40" : "border-zinc-200"
                            )}
                          >
                            <span className="text-sm text-zinc-800">{leaf.description}</span>

                            {already ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 text-sm px-2 py-1 rounded border border-emerald-300 bg-white">
                                <Check size={16} />
                                Agregado
                              </span>
                            ) : (
                              <button
                                className="inline-flex items-center gap-1 text-[#0040B8] text-sm px-2 py-1 rounded hover:bg-zinc-50"
                                disabled={isCompleted}
                                onClick={() =>
                                  addLeafToSelection(
                                    obsModalStepId!,
                                    selectedCategory!,
                                    leaf
                                  )
                                }
                                title="Agregar al texto"
                              >
                                <Plus size={16} />
                                Agregar
                              </button>
                            )}
                          </li>
                        );
                      })}
                      {leaves.length === 0 && (
                        <li className="text-sm text-zinc-500 text-center py-6">
                          No hay observaciones en esta categoría
                        </li>
                      )}
                    </ul>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-zinc-200 p-4 flex justify-end">
              <button
                className="px-4 py-2 rounded-[6px] border border-zinc-300 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                disabled={isCompleted}
                onClick={() => closeObsModal()}
              >
                Cerrar
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
      {msg && (
        <div className="mt-4 text-sm text-[#41c227] border border-[#41c227] p-3 rounded-[6px] text-center">
          {msg}
        </div>
      )}
      {error && (
        <div className="mt-4 text-sm text-[#d11b2d] border border-[#d11b2d] p-3 rounded-[6px] text-center">
          {error}
        </div>
      )}
    </div>
  );
}
