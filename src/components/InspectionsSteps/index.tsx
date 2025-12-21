// components/inspections/InspectionStepsClient.tsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import clsx from "clsx";
import { ChevronRight, X, Plus, Check, Minus } from "lucide-react";
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
  previousStatuses,
  apiBase,
  initialGlobalObs,
  previousGlobalObs,
  userType,
  isSecondInspection,
  initialInspDocs,
  firstInspectionId,
  initialIsCompleted,
  usageType
}: {
  inspectionId: number;
  appId: number;
  steps: Step[];
  initialStatuses: Record<number, Status | undefined>;
  previousStatuses?: Record<number, Status | undefined>;
  apiBase: string | undefined;
  initialGlobalObs?: string;
  previousGlobalObs?: string;
  userType: string;
  isSecondInspection?: boolean;
  initialInspDocs?: InspDoc[];
  firstInspectionId?: number | null;
  initialIsCompleted?: boolean;
  usageType?: string;
}) {
  const { id } = useParams();
  const router = useRouter();

  const [isCompleted, setIsCompleted] = useState(Boolean(initialIsCompleted));
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
  const [obsModalError, setObsModalError] = useState<string | null>(null);
  type ObsView = "parents" | "items";
  const [obsView, setObsView] = useState<ObsView>("parents");

  const [categories, setCategories] = useState<Category[]>([]);
  const [leaves, setLeaves] = useState<ObservationLeaf[]>([]);
  const [stepObservations, setStepObservations] = useState<ObservationLeaf[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoriesWithObservations, setCategoriesWithObservations] = useState<Set<number>>(new Set());

  // Inicializar desde props si están disponibles para render inmediato
  const initialTech = useMemo(() => {
    return (initialInspDocs || []).filter((d: any) => d.type === "technical_report");
  }, [initialInspDocs]);
  const initialPhotos = useMemo(() => {
    return (initialInspDocs || []).filter((d: any) => d.type === "vehicle_photo");
  }, [initialInspDocs]);
  
  const [inspDocsTech, setInspDocsTech] = useState<InspDoc[]>(initialTech);
  const [inspDocsPhotos, setInspDocsPhotos] = useState<InspDoc[]>(initialPhotos);
  const [pendingTechFiles, setPendingTechFiles] = useState<File[]>([]);
  const [pendingPhotoFiles, setPendingPhotoFiles] = useState<File[]>([]);
  const [inspDocsLoading, setInspDocsLoading] = useState(false);
  const [inspDocsDeletingId, setInspDocsDeletingId] = useState<number | null>(null);
  const [dzResetTokenTech, setDzResetTokenTech] = useState(0);
  const [dzResetTokenPhotos, setDzResetTokenPhotos] = useState(0);
  // Selección de foto de frente: puede ser una pendiente (queue) o una existente
  const [frontPhotoSel, setFrontPhotoSel] = useState<{ kind: "queue"; index: number } | { kind: "existing"; id: number } | null>(null);

  const MAX_CHARS = 750;
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

  // Estado de completado provisto desde el servidor para evitar un fetch extra al montar

  const fetchInspectionDocumentsByType = async (typeKey: "technical_report" | "vehicle_photo") => {
    if (!apiBase) return;
    const url = `${apiBase}/inspections/inspections/${inspectionId}/documents?role=global&type=${typeKey}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || "No se pudieron cargar los documentos");
    }
    const data: InspDoc[] = await res.json();
    // No actualizar estados directamente aquí, solo retornar datos
    return data;
  };

  const fetchBothTypes = async () => {
    if (!apiBase) return;
    try {
      setInspDocsLoading(true);
      const [techData, photosData] = await Promise.all([
        fetchInspectionDocumentsByType("technical_report"),
        fetchInspectionDocumentsByType("vehicle_photo"),
      ]);
      
      // Combinar documentos iniciales (de primera inspección) con los nuevos de la inspección actual
      // Usar los estados actuales que ya tienen los documentos iniciales
      setInspDocsTech((currentTech) => {
        const hasInitial = (initialInspDocs || []).length > 0;
        if (!hasInitial) return techData || [];
        
        // Combinar: mantener los documentos actuales (que incluyen los iniciales) y agregar los nuevos
        const combined = [...currentTech];
        (techData || []).forEach((doc: any) => {
          if (!combined.find((d: any) => d.id === doc.id)) {
            combined.push(doc);
          }
        });
        return combined;
      });
      
      setInspDocsPhotos((currentPhotos) => {
        const hasInitial = (initialInspDocs || []).length > 0;
        if (!hasInitial) return photosData || [];
        
        // Combinar: mantener los documentos actuales (que incluyen los iniciales) y agregar los nuevos
        const combined = [...currentPhotos];
        (photosData || []).forEach((doc: any) => {
          if (!combined.find((d: any) => d.id === doc.id)) {
            combined.push(doc);
          }
        });
        return combined;
      });
      
      // Inferir selección inicial desde existentes (si alguno está marcado como frente)
      // Solo si usageType es "D"
      const isUsageTypeD = (usageType || "").trim().toUpperCase() === "D";
      const hasInitialDocs = (initialInspDocs || []).length > 0;
      const allPhotos = hasInitialDocs ? 
        [...(initialInspDocs || []).filter((d: any) => d.type === "vehicle_photo"), ...(photosData || [])] :
        (photosData || []);
      
      if (isUsageTypeD && allPhotos.length > 0) {
        setFrontPhotoSel((prev) => {
          if (prev) return prev;
          const existingFront = allPhotos.find((d: any) => (d as any).is_front === true);
          return existingFront ? { kind: "existing", id: (existingFront as any).id } : null;
        });
      } else if (!isUsageTypeD) {
        setFrontPhotoSel(null);
      }
    } catch (e: any) {
      setError(e.message || "Error cargando documentos");
    } finally {
      setInspDocsLoading(false);
    }
  };

  // Cargar documentos en segundo plano sin bloquear el render inicial
  useEffect(() => {
    if (!apiBase) return;
    // Ejecutar después de que el componente se haya renderizado
    // Esto permite que la página se muestre inmediatamente
    const timer = setTimeout(() => {
      fetchBothTypes();
    }, 100); // Pequeño delay para no bloquear el render inicial
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, inspectionId, initialInspDocs]);

  // Limpiar selección de foto de frente si usageType no es "D"
  useEffect(() => {
    const isUsageTypeD = (usageType || "").trim().toUpperCase() === "D";
    if (!isUsageTypeD) {
      setFrontPhotoSel(null);
    }
  }, [usageType]);

  const onPendingTechChange = (files: File[]) => setPendingTechFiles(files);
  const onPendingPhotosChange = (files: File[]) => setPendingPhotoFiles(files);

  const deleteInspectionDocument = async (typeKey: "technical_report" | "vehicle_photo", docId: number) => {
    if (!apiBase) {
      setError("Falta configurar NEXT_PUBLIC_API_URL");
      return;
    }
    if (isCompleted) return;
    
    // Verificar si el documento pertenece a la primera inspección
    const isFromFirstInspection = (initialInspDocs || []).some(
      (d: any) => d.id === docId && d.type === typeKey
    );
    
    // Determinar qué inspection_id usar
    const targetInspectionId = isFromFirstInspection && firstInspectionId 
      ? firstInspectionId 
      : inspectionId;
    
    try {
      setInspDocsDeletingId(docId);
      const res = await fetch(
        `${apiBase}/inspections/inspections/${targetInspectionId}/documents/${docId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "No se pudo borrar el documento");
      }
      // Actualizar estados removiendo el documento eliminado
      if (typeKey === "technical_report") {
        setInspDocsTech((currentTech) => currentTech.filter((d: any) => d.id !== docId));
      } else if (typeKey === "vehicle_photo") {
        setInspDocsPhotos((currentPhotos) => currentPhotos.filter((d: any) => d.id !== docId));
        
        // Limpiar selección de frente si se eliminó la foto seleccionada
        setFrontPhotoSel((prev) => {
          if (prev?.kind === "existing" && prev.id === docId) {
            return null;
          }
          return prev;
        });
      }
      
      // Si el documento era de la primera inspección, también removerlo de initialInspDocs
      // (actualizar el estado local, no recargar desde servidor ya que no estará disponible)
      if (isFromFirstInspection) {
        // El documento ya fue removido del estado visual arriba
        // No necesitamos recargar desde el servidor porque el documento ya no existe
      } else {
        // Si es de la inspección actual, recargar desde el servidor para mantener sincronización
        const data = await fetchInspectionDocumentsByType(typeKey);
        if (data) {
          if (typeKey === "technical_report") {
            setInspDocsTech((currentTech) => {
              const hasInitial = (initialInspDocs || []).length > 0;
              if (!hasInitial) return data;
              
              // Combinar: mantener los documentos iniciales y agregar los nuevos
              const initialTech = (initialInspDocs || []).filter((d: any) => d.type === "technical_report");
              const combined = [...initialTech];
              data.forEach((doc: any) => {
                if (!combined.find((d: any) => d.id === doc.id)) {
                  combined.push(doc);
                }
              });
              return combined;
            });
          } else if (typeKey === "vehicle_photo") {
            setInspDocsPhotos((currentPhotos) => {
              const hasInitial = (initialInspDocs || []).length > 0;
              if (!hasInitial) return data;
              
              // Combinar: mantener los documentos iniciales y agregar los nuevos
              const initialPhotos = (initialInspDocs || []).filter((d: any) => d.type === "vehicle_photo");
              const combined = [...initialPhotos];
              data.forEach((doc: any) => {
                if (!combined.find((d: any) => d.id === doc.id)) {
                  combined.push(doc);
                }
              });
              return combined;
            });
          }
        }
      }
    } catch (e: any) {
      setError(e.message || "Error borrando documento");
    } finally {
      setInspDocsDeletingId(null);
    }
  };

  const openObsModalForStep = async (stepId: number) => {
    console.log("[openObsModalForStep] Abriendo modal para stepId:", stepId);
    setObsModalStepId(stepId);
    setObsView("parents");
    setSelectedCategory(null);
    setCategories([]);
    setLeaves([]);
    setStepObservations([]);
    setObsModalError(null);
    setCategoriesWithObservations(new Set());
    await Promise.all([fetchCategories(stepId), fetchStepObservations(stepId)]);
  };

  const closeObsModal = () => {
    setObsModalStepId(null);
    setObsView("parents");
    setSelectedCategory(null);
    setCategories([]);
    setLeaves([]);
    setStepObservations([]);
    setObsModalError(null);
    setCategoriesWithObservations(new Set());
  };

  const fetchCategories = async (stepId: number) => {
    if (!apiBase) {
      setError("Falta configurar NEXT_PUBLIC_API_URL");
      return;
    }
    try {
      setObsLoading(true);
      console.log("[fetchCategories] Iniciando carga de categorías para stepId:", stepId);
      const res = await fetch(
        `${apiBase}/inspections/inspections/${inspectionId}/steps/${stepId}/categories`,
        { credentials: "include" }
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "No se pudieron cargar las categorías");
      }
      const data: Category[] = await res.json();
      console.log("[fetchCategories] Categorías cargadas:", data);
      setCategories(data);
      
      // Verificar qué categorías tienen observaciones hijo
      const categoriesWithObs = new Set<number>();
      console.log("[fetchCategories] Verificando observaciones para", data.length, "categorías");
      await Promise.all(
        data.map(async (cat) => {
          try {
            const obsRes = await fetch(
              `${apiBase}/inspections/inspections/${inspectionId}/steps/${stepId}/categories/${cat.category_id}/observations`,
              { credentials: "include" }
            );
            if (obsRes.ok) {
              const obsData: ObservationLeaf[] = await obsRes.json();
              console.log(`[fetchCategories] Categoría ${cat.name} (${cat.category_id}): ${obsData.length} observaciones`);
              if (obsData.length > 0) {
                categoriesWithObs.add(cat.category_id);
              }
            } else {
              console.log(`[fetchCategories] Error al cargar observaciones para categoría ${cat.name} (${cat.category_id}):`, obsRes.status);
            }
          } catch (e) {
            console.error(`[fetchCategories] Error verificando observaciones para categoría ${cat.name}:`, e);
          }
        })
      );
      console.log("[fetchCategories] Categorías con observaciones:", Array.from(categoriesWithObs));
      setCategoriesWithObservations(categoriesWithObs);
    } catch (e: any) {
      console.error("[fetchCategories] Error general:", e);
      setError(e.message || "Error cargando categorías");
    } finally {
      setObsLoading(false);
    }
  };

  const fetchStepObservations = async (stepId: number) => {
    if (!apiBase) return;
    try {
      const res = await fetch(
        `${apiBase}/inspections/inspections/${inspectionId}/steps/${stepId}/observations`,
        { credentials: "include" }
      );
      if (!res.ok) return;
      const data: ObservationLeaf[] = await res.json();
      setStepObservations(data);
    } catch (e: any) {
      // Silenciar error, no es crítico
    }
  };

  const goToLeaves = async (cat: Category) => {
    if (!apiBase || obsModalStepId === null) return;
    try {
      setObsLoading(true);
      setObsModalError(null);
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
      setObsModalError(e.message || "Error cargando observaciones");
    } finally {
      setObsLoading(false);
    }
  };

  function compactObservation(obs: string, maxLength: number = 60): string {
    if (obs.length <= maxLength) return obs;
    
    // Truncar en el último espacio antes del límite para no cortar palabras
    const truncated = obs.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    
    if (lastSpace > maxLength * 0.7) {
      // Si encontramos un espacio razonablemente cerca del final, cortar ahí
      return truncated.substring(0, lastSpace) + "...";
    }
    // Si no hay espacio cercano, cortar directamente
    return truncated + "...";
  }

  function buildCategoryParts(selMap: LeafSelectionState): Record<string, string> {
    const agg: Record<string, Set<string>> = {};
    const stepObs: string[] = [];
    
    Object.entries(selMap).forEach(([stepId, catsForStep]) => {
      Object.values(catsForStep).forEach(({ categoryName, leaves }) => {
        // Si la categoría está vacía, son observaciones del paso
        if (!categoryName || categoryName.trim() === "") {
          stepObs.push(...leaves);
        } else {
          if (!agg[categoryName]) agg[categoryName] = new Set<string>();
          leaves.forEach((lv) => agg[categoryName].add(lv));
        }
      });
    });
    
    const out: Record<string, string> = {};
    
    // Agregar observaciones del paso primero (sin prefijo de categoría)
    if (stepObs.length > 0) {
      const compactObs = stepObs.map(obs => compactObservation(obs, 60)).join("; ");
      out[""] = compactObs;
    }
    
    // Agregar categorías
    Object.entries(agg).forEach(([cat, leavesSet]) => {
      const arr = Array.from(leavesSet);
      if (arr.length > 0) {
        // Si solo hay una observación y es igual al nombre de la categoría, mostrar solo la categoría
        if (arr.length === 1 && arr[0].trim() === cat.trim()) {
          out[cat] = cat;
        } else {
          const compactObs = arr.map(obs => compactObservation(obs, 60)).join("; ");
          out[cat] = `${cat}: ${compactObs}`;
        }
      }
    });
    
    return out;
  }

  function buildGlobalTextFromSelectionMap(selMap: LeafSelectionState): string {
    const parts = buildCategoryParts(selMap);
    const partsArray = Object.values(parts).filter(p => p.length > 0);
    return partsArray.join("/");
  }

  function buildStepParts(stepId: number, selMap: LeafSelectionState): Record<string, string> {
    const stepData = selMap[stepId];
    if (!stepData) return {};
    
    const agg: Record<string, Set<string>> = {};
    const stepObs: string[] = [];
    
    Object.values(stepData).forEach(({ categoryName, leaves }) => {
      // Si la categoría está vacía, son observaciones del paso
      if (!categoryName || categoryName.trim() === "") {
        stepObs.push(...leaves);
      } else {
        if (!agg[categoryName]) agg[categoryName] = new Set<string>();
        leaves.forEach((lv) => agg[categoryName].add(lv));
      }
    });
    
    const out: Record<string, string> = {};
    
    // Agregar observaciones del paso primero (sin prefijo de categoría)
    if (stepObs.length > 0) {
      const compactObs = stepObs.map(obs => compactObservation(obs, 60)).join("; ");
      out[""] = compactObs;
    }
    
    // Agregar categorías
    Object.entries(agg).forEach(([cat, leavesSet]) => {
      const arr = Array.from(leavesSet);
      if (arr.length > 0) {
        // Si solo hay una observación y es igual al nombre de la categoría, mostrar solo la categoría
        if (arr.length === 1 && arr[0].trim() === cat.trim()) {
          out[cat] = cat;
        } else {
          const compactObs = arr.map(obs => compactObservation(obs, 60)).join("; ");
          out[cat] = `${cat}: ${compactObs}`;
        }
      }
    });
    
    return out;
  }

  function removeStepFromGlobalText(currentText: string, stepId: number, selMap: LeafSelectionState): string {
    const stepParts = buildStepParts(stepId, selMap);
    if (Object.keys(stepParts).length === 0) return currentText;
    
    if (!currentText.trim()) return "";
    
    // Construir las partes de texto que corresponden a este paso
    const stepPartsArray = Object.values(stepParts).filter(p => p.length > 0);
    if (stepPartsArray.length === 0) return currentText;
    
    const tokens = currentText
      .split("/")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    
    const tokensToKeep: string[] = [];
    
    // Para cada token, verificar si coincide con alguna parte del paso
    tokens.forEach((token) => {
      const tokenLower = token.toLowerCase();
      let shouldRemove = false;
      
      // Verificar si el token coincide con alguna parte del paso
      for (const part of stepPartsArray) {
        const partLower = part.toLowerCase();
        
        // Si el token es exactamente igual a la parte (o contiene la parte completa)
        if (tokenLower === partLower || tokenLower.includes(partLower) || partLower.includes(tokenLower)) {
          // Verificar que realmente es una coincidencia válida
          // Para observaciones sin categoría (part que no tiene ":")
          if (!part.includes(":")) {
            // Verificar que todas las observaciones del paso están en el token
            const stepData = selMap[stepId];
            if (stepData) {
              const stepObs: string[] = [];
              Object.values(stepData).forEach(({ categoryName, leaves }) => {
                if (!categoryName || categoryName.trim() === "") {
                  stepObs.push(...leaves);
                }
              });
              
              if (stepObs.length > 0) {
                const allObsMatch = stepObs.every(obs => {
                  const obsLower = obs.toLowerCase();
                  const obsCompact = compactObservation(obs, 60).toLowerCase();
                  return tokenLower.includes(obsLower.substring(0, Math.min(obsLower.length, 60))) ||
                         tokenLower.includes(obsCompact);
                });
                if (allObsMatch) {
                  shouldRemove = true;
                  break;
                }
              }
            }
          } else {
            // Para categorías (part que tiene ":")
            const catName = part.split(":")[0].trim().toLowerCase();
            if (tokenLower.startsWith(catName) || tokenLower.startsWith(`${catName}:`)) {
              // Verificar que contiene las observaciones de esta categoría
              const stepData = selMap[stepId];
              if (stepData) {
                const catData = Object.values(stepData).find(c => c.categoryName && c.categoryName.toLowerCase() === catName);
                if (catData && catData.leaves.length > 0) {
                  const allCatObsMatch = catData.leaves.every(obs => {
                    const obsLower = obs.toLowerCase();
                    const obsCompact = compactObservation(obs, 60).toLowerCase();
                    return tokenLower.includes(obsLower.substring(0, Math.min(obsLower.length, 60))) ||
                           tokenLower.includes(obsCompact);
                  });
                  if (allCatObsMatch) {
                    shouldRemove = true;
                    break;
                  }
                }
              }
            }
          }
        }
      }
      
      if (!shouldRemove) {
        tokensToKeep.push(token);
      }
    });
    
    return tokensToKeep.join("/");
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
      // Buscar tokens que empiecen con el nombre de la categoría (puede ser formato antiguo o nuevo)
      const catLower = cat.toLowerCase();
      const idx = lowerTokens.findIndex((tok) =>
        tok.startsWith(catLower) || tok.startsWith(`${catLower}:`) || tok.startsWith(`${catLower} (`)
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

  const addLeafToSelection = (stepId: number, cat: Category | null, leaf: ObservationLeaf) => {
    setSelectionMap((prev) => {
      const prevStep = prev[stepId] || {};
      
      // Si no hay categoría, usar un ID especial para observaciones sin categoría
      const catId = cat ? cat.category_id : -1;
      const catName = cat ? cat.name : "";
      
      const prevCat = prevStep[catId] || {
        categoryName: catName,
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
          [catId]: {
            categoryName: catName,
            leaves: newLeaves,
          },
        },
      };

      const draftParts = buildCategoryParts(draft);
      const mergedText = mergePartsIntoGlobalText(globalText, draftParts);

      if (mergedText.length > MAX_CHARS) {
        setObsModalError(`No se puede agregar: superarías el límite de ${MAX_CHARS} caracteres. Podés ir al campo de observaciones de texto y editarlo manualmente para hacer espacio.`);
        return prev;
      }

      setGlobalText(mergedText);
      setObsModalError(null);
      setMsg("Observación agregada");
      setTimeout(() => setMsg(null), 1000);

      return draft;
    });
  };

  const removeLeafFromSelection = (stepId: number, cat: Category | null, leaf: ObservationLeaf) => {
    setSelectionMap((prev) => {
      const prevStep = prev[stepId] || {};
      const catId = cat ? cat.category_id : -1;
      const prevCat = prevStep[catId];
      
      if (!prevCat || !prevCat.leaves.includes(leaf.description)) {
        return prev;
      }

      const newLeaves = prevCat.leaves.filter((l) => l !== leaf.description);
      
      let draft: LeafSelectionState;

      // Si no quedan hojas en esta categoría, eliminar la categoría del step
      if (newLeaves.length === 0) {
        const { [catId]: removed, ...restCats } = prevStep;
        if (Object.keys(restCats).length === 0) {
          // Si no quedan categorías en el step, eliminar el step completo
          const { [stepId]: removedStep, ...restSteps } = prev;
          draft = restSteps;
        } else {
          // Mantener el step pero sin esta categoría
          draft = {
            ...prev,
            [stepId]: restCats,
          };
        }
      } else {
        // Mantener la categoría con las hojas actualizadas
        const catName = cat ? cat.name : "";
        draft = {
          ...prev,
          [stepId]: {
            ...prevStep,
            [catId]: {
              categoryName: catName,
              leaves: newLeaves,
            },
          },
        };
      }

      // Reconstruir el texto completo desde cero basándose en el selectionMap actualizado
      const newGlobalText = buildGlobalTextFromSelectionMap(draft);

      setGlobalText(newGlobalText);
      setMsg("Observación quitada");
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

    // // Validar que haya al menos un documento en cada dropzone
    // const hasTechDocs = (inspDocsTech?.length || 0) + (pendingTechFiles?.length || 0) > 0;
    // const hasPhotoDocs = (inspDocsPhotos?.length || 0) + (pendingPhotoFiles?.length || 0) > 0;
    
    // if (!hasTechDocs) {
    //   setError("Debés subir al menos un informe técnico");
    //   return false;
    // }
    
    // if (!hasPhotoDocs) {
    //   setError("Debés subir al menos una foto del vehículo");
    //   return false;
    // }

    setSaving(true);
    setMsg(null);
    setError(null);

    try {
      if (pendingTechFiles.length > 0) {
        const form = new FormData();
        pendingTechFiles.forEach((f) => form.append("files", f));
        form.append("role", "global");
        form.append("type", "technical_report");
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
          throw new Error(upData?.error || "No se pudieron subir los archivos de informes técnicos");
        }
        setPendingTechFiles([]);
        // Recargar documentos y combinar con los iniciales
        const techData = await fetchInspectionDocumentsByType("technical_report");
        if (techData) {
          setInspDocsTech((currentTech) => {
            const hasInitial = (initialInspDocs || []).length > 0;
            if (!hasInitial) return techData;
            
            // Combinar: mantener los documentos iniciales y agregar los nuevos
            const initialTech = (initialInspDocs || []).filter((d: any) => d.type === "technical_report");
            const combined = [...initialTech];
            techData.forEach((doc: any) => {
              if (!combined.find((d: any) => d.id === doc.id)) {
                combined.push(doc);
              }
            });
            return combined;
          });
        }
      }

      if (pendingPhotoFiles.length > 0) {
        const form = new FormData();
        pendingPhotoFiles.forEach((f) => form.append("files", f));
        form.append("role", "global");
        form.append("type", "vehicle_photo");
        // Indicar al backend cuál de los archivos nuevos (si aplica) es el frente
        if (frontPhotoSel?.kind === "queue") {
          form.append("front_idx", String(frontPhotoSel.index));
        } else if (frontPhotoSel?.kind === "existing") {
          // Enviar el front_existing_id - el backend manejará la lógica
          form.append("front_existing_id", String(frontPhotoSel.id));
        }
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
          throw new Error(upData?.error || "No se pudieron subir las fotos del vehículo");
        }
        setPendingPhotoFiles([]);
        // Recargar documentos y combinar con los iniciales
        const photosData = await fetchInspectionDocumentsByType("vehicle_photo");
        if (photosData) {
          setInspDocsPhotos((currentPhotos) => {
            const hasInitial = (initialInspDocs || []).length > 0;
            if (!hasInitial) return photosData;
            
            // Combinar: mantener los documentos iniciales y agregar los nuevos
            const initialPhotos = (initialInspDocs || []).filter((d: any) => d.type === "vehicle_photo");
            const combined = [...initialPhotos];
            photosData.forEach((doc: any) => {
              if (!combined.find((d: any) => d.id === doc.id)) {
                combined.push(doc);
              }
            });
            return combined;
          });
          
          // Actualizar selección de foto de frente si es necesario
          const isUsageTypeD = (usageType || "").trim().toUpperCase() === "D";
          if (isUsageTypeD && photosData.length > 0) {
            setFrontPhotoSel((prev) => {
              if (prev) return prev;
              const existingFront = photosData.find((d: any) => (d as any).is_front === true);
              return existingFront ? { kind: "existing", id: (existingFront as any).id } : null;
            });
          }
        }
      } else if (frontPhotoSel?.kind === "existing") {
        // No se subieron nuevas fotos, pero el usuario eligió como frente una existente
        // Determinar qué inspection_id usar
        const isFromFirstInspection = (initialInspDocs || []).some(
          (d: any) => d.id === frontPhotoSel.id && d.type === "vehicle_photo"
        );
        const targetInspectionId = isFromFirstInspection && firstInspectionId 
          ? firstInspectionId 
          : inspectionId;
        
        const res = await fetch(`${apiBase}/inspections/inspections/${targetInspectionId}/documents/set-front`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ doc_id: frontPhotoSel.id }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(j?.error || "No se pudo marcar la foto de frente");
        }
        // Recargar documentos y combinar con los iniciales
        const photosData = await fetchInspectionDocumentsByType("vehicle_photo");
        if (photosData) {
          setInspDocsPhotos((currentPhotos) => {
            const hasInitial = (initialInspDocs || []).length > 0;
            if (!hasInitial) return photosData;
            
            // Combinar: mantener los documentos iniciales y agregar los nuevos
            const initialPhotos = (initialInspDocs || []).filter((d: any) => d.type === "vehicle_photo");
            const combined = [...initialPhotos];
            photosData.forEach((doc: any) => {
              if (!combined.find((d: any) => d.id === doc.id)) {
                combined.push(doc);
              }
            });
            return combined;
          });
        }
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
      setDzResetTokenTech((t) => t + 1);
      setDzResetTokenPhotos((t) => t + 1);
      setTimeout(() => setMsg(null), 1500);
      return true;
    } catch (e: any) {
      setError(e.message || "Error al guardar");
      return false;
    } finally {
      setSaving(false);
    }
  };


  async function pollJobUntilDone(jobUrl: string, newTab: Window, onTick?: (info: string) => void) {
    const started = Date.now();
    const MAX_MS = 5 * 60 * 1000; 
    let delay = 1200; 

    while (true) {
      if (Date.now() - started > MAX_MS) {
        throw new Error("Timeout esperando el certificado");
      }

      const res = await fetch(jobUrl, { credentials: "include" });
      // si hubo 404 muy rápido, esperar y reintentar
      if (res.status === 404) {
        await new Promise(r => setTimeout(r, delay));
        delay = Math.min(delay + 400, 4000);
        continue;
      }

      const data = await res.json().catch(() => ({} as any));
      const status = data?.status as "pending" | "running" | "done" | "error" | undefined;

      if (!status) {
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (status === "done") {
        return data?.result; // dict con public_url
      }
      if (status === "error") {
        const msg = data?.error || "Error en el job de certificado";
        throw new Error(msg);
      }

      if (onTick) onTick(status === "running" ? "Procesando certificado..." : "En cola, por favor espera...");
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay + 300, 4000);
    }
  }

  function writeWaitingHtml(tab: Window, line2 = "Por favor espera un momento...") {
    try {
      tab.document.open();
      tab.document.write(`
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
              <p id="status-line">${line2}</p>
            </div>
          </body>
        </html>
      `);
      tab.document.close();
    } catch {}
  }

  async function generateCertificate(status: Status) {
    if (!apiBase) {
      setError("Falta configurar NEXT_PUBLIC_API_URL");
      setConfirmOpen(false);
      return;
    }
    if (isCompleted) {
      setError("La revisión ya está completada");
      setConfirmOpen(false);
      return;
    }

    const allMarkedNow = steps.every((s) => Boolean(statusByStep[s.step_id]));
    if (!allMarkedNow) {
      setError("Marcá un estado en todos los pasos antes de generar el certificado");
      setConfirmOpen(false);
      return;
    }

    // Validar que haya al menos un documento en cada dropzone
    const hasTechDocs = (inspDocsTech?.length || 0) + (pendingTechFiles?.length || 0) > 0;
    const hasPhotoDocs = (inspDocsPhotos?.length || 0) + (pendingPhotoFiles?.length || 0) > 0;
    
    if (!hasTechDocs) {
      setError("Debés subir al menos un informe técnico antes de generar el certificado");
      setConfirmOpen(false);
      return;
    }
    
    if (!hasPhotoDocs) {
      setError("Debés subir al menos una foto del vehículo antes de generar el certificado");
      setConfirmOpen(false);
      return;
    }

    // Validación: si hay fotos del vehículo y usageType es "D", obligar a elegir frente
    const totalPhotosNow = (inspDocsPhotos?.length || 0) + (pendingPhotoFiles?.length || 0);
    const needsFrontPhoto = (usageType || "").trim().toUpperCase() === "D";
    if (needsFrontPhoto && totalPhotosNow > 0 && !frontPhotoSel) {
      setError("Seleccioná qué foto es el frente del vehículo");
      setConfirmOpen(false);
      return;
    }

    setCertLoading(true);
    setError(null);
    setMsg(null);

    const newTab = window.open("", "_blank");
    if (!newTab) {
      setCertLoading(false);
      setError("El navegador bloqueó la ventana emergente");
      setConfirmOpen(false);
      return;
    }

    try {
      try { newTab.opener = null; } catch {}
      writeWaitingHtml(newTab);

      const saved = await saveAll();
      if (!saved) {
        try { if (!newTab.closed) newTab.close(); } catch {}
        setConfirmOpen(false);
        setCertLoading(false);
        return;
      }

      // disparar generación
      const res = await fetch(
        `${apiBase}/certificates/certificates/application/${appId}/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ condicion: status }),
        }
      );

      // compat hacia atrás, si vuelve 200 con URL directo
      if (res.ok && res.status === 200) {
        const data = await res.json().catch(() => ({} as any));
        const url = data?.public_url || data?.template_url;
        if (!url) throw new Error("No se recibió el link del certificado");
        newTab.location.href = url;
        setMsg("Certificado generado");
        setConfirmOpen(false);
        router.push(`/dashboard/${id}/inspections-queue`);
        return;
      }

      // flujo 202 con job_id
      if (res.status === 202) {
        const data = await res.json().catch(() => ({} as any));
        const jobId = data?.job_id as string | undefined;
        if (!jobId) throw new Error("No se recibió job_id del generador");

        const jobUrl = `${apiBase}/certificates/certificates/job/${jobId}`;

        const result = await pollJobUntilDone(jobUrl, newTab, (line) => {
          try {
            const el = newTab.document.getElementById("status-line");
            if (el) el.textContent = line;
          } catch {}
        });

        const url = result?.public_url || result?.template_url;
        if (!url) throw new Error("No se recibió el link del certificado");
        newTab.location.href = url;
        setMsg("Certificado generado");
        setConfirmOpen(false);
        router.push(`/dashboard/${id}/inspections-queue`);
        return;
      }

      // si no es ni 200 ni 202, es error
      const errData = await res.json().catch(() => ({} as any));
      throw new Error(errData?.error || "No se pudo generar el certificado");
    } catch (e: any) {
      try { if (!newTab.closed) newTab.close(); } catch {}
      setError(e.message || "Error generando certificado");
      setConfirmOpen(false);
    } finally {
      setCertLoading(false);
    }
  }

  return (
    <div className="w-full px-1 sm:px-2 md:px-4 pb-6 sm:pb-8 md:pb-10">
      {isCompleted && (
        <div className="mb-4 sm:mb-5 md:mb-6 p-3 sm:p-4 bg-yellow-50 border border-yellow-200 rounded-lg sm:rounded-[14px] mx-1 sm:mx-0">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3">
              <h3 className="text-xs sm:text-sm font-medium text-yellow-800">Revisión Completada</h3>
              <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-yellow-700">
                <p>Esta revisión ya fue completada, no se pueden realizar modificaciones.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campo de observaciones arriba de los steps - solo para segunda revisión */}
      {isSecondInspection && (
        <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-3 sm:gap-4 mb-6 sm:mb-8 w-full">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-medium text-zinc-900">Observaciones generales</h4>
              {previousGlobalObs && previousGlobalObs.trim() && (
                <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-blue-800">
                  Observaciones anteriores cargadas
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">
              Escribí las observaciones del vehículo, se guardan cuando confirmás la revisión. Máximo {MAX_CHARS} caracteres.
              {previousGlobalObs && previousGlobalObs.trim() && (
                <span className="block mt-1 text-amber-600">
                  Las observaciones de la primera inspección han sido precargadas y pueden ser editadas.
                </span>
              )}
            </p>
          </div>

          <div className="rounded-lg sm:rounded-[14px] text-xs sm:text-sm border border-zinc-200 bg-white p-3 sm:p-4 w-full self-start md:col-span-2">
            <textarea
              value={globalText}
              onChange={(e) => {
                const txt = e.target.value;
                if (txt.length <= MAX_CHARS) setGlobalText(txt);
              }}
              disabled={isCompleted}
              placeholder="Ingresá tus observaciones."
              className={clsx(
                "w-full h-32 sm:h-40 outline-none resize-none text-xs sm:text-sm",
                isCompleted && "opacity-50 cursor-not-allowed"
              )}
              maxLength={MAX_CHARS}
            />
            <div className="mt-2 flex items-center justify-between">
              <div className={clsx(
                "text-[10px] sm:text-xs",
                obsCharCount > MAX_CHARS * 0.9 
                  ? "text-amber-600 font-medium" 
                  : obsCharCount > MAX_CHARS * 0.75
                  ? "text-amber-500"
                  : "text-zinc-400"
              )}>
                {obsCharCount >= MAX_CHARS * 0.9 && (
                  <span className="mr-2">
                    {MAX_CHARS - obsCharCount > 0 
                      ? `Quedan ${MAX_CHARS - obsCharCount} caracteres disponibles`
                      : "Límite alcanzado"}
                  </span>
                )}
              </div>
              <div className={clsx(
                "text-[10px] sm:text-xs",
                obsCharCount > MAX_CHARS * 0.9 
                  ? "text-amber-600 font-medium" 
                  : obsCharCount > MAX_CHARS * 0.75
                  ? "text-amber-500"
                  : "text-zinc-400"
              )}>
                {obsCharCount}/{MAX_CHARS}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full space-y-3 sm:space-y-4">
        {steps.map((s) => {
          const current = statusByStep[s.step_id];
          const previous = previousStatuses?.[s.step_id];
          const isNonApto = current === "Condicional" || current === "Rechazado";

          // En segunda inspección, cuando se selecciona Condicional o Rechazado,
          // mostrar solo ese estado (como primera revisión)
          // Si es segunda inspección pero aún no se seleccionó nada o es Apto, mostrar todas las opciones
          const options: Status[] =
            isSecondInspection && isNonApto
              ? ([current] as Status[])
              : isSecondInspection
              ? (["Apto", "Condicional", "Rechazado"] as Status[])
              : isNonApto
              ? ([current] as Status[])
              : (["Apto", "Condicional", "Rechazado"] as Status[]);
          return (
            <section
              key={s.step_id}
              className={clsx(
                "w-full rounded-lg sm:rounded-[14px] bg-white transition-colors border",
                current ? STATUS_UI[current as Status].stepBorder : "border-zinc-200"
              )}
            >
              <div className="flex flex-col gap-3 p-3 sm:p-4">
                {/* Estado anterior arriba - solo para segunda revisión */}
                {isSecondInspection && previous && (
                  <div className="flex items-center">
                    <span
                      className={clsx(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] sm:text-xs font-medium",
                        previous === "Apto" &&
                          "border-emerald-300 bg-emerald-50 text-emerald-800",
                        previous === "Condicional" &&
                          "border-amber-300 bg-amber-50 text-amber-800",
                        previous === "Rechazado" &&
                          "border-zinc-400 bg-zinc-100 text-zinc-900"
                      )}
                    >
                      Estado anterior:&nbsp;
                      <span className="font-semibold">{previous}</span>
                    </span>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row md:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-medium text-zinc-900">{s.name}</h3>
                    <p className="hidden min-[1300px]:block text-xs sm:text-sm md:max-w-[400px] text-zinc-500">
                      {s.description}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:gap-5 flex-wrap">
                    {options.map((opt) => {
                      const selected = current === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={isCompleted}
                          onClick={() => {
                            const previousStatus = statusByStep[s.step_id];
                            const newStatus = previousStatus === opt ? undefined : opt;
                            
                            // Si el nuevo estado es "Apto", verificar y eliminar observaciones del paso
                            if (newStatus === "Apto") {
                              setSelectionMap((prev) => {
                                // Verificar si hay observaciones para este paso
                                if (prev[s.step_id]) {
                                  const { [s.step_id]: removedStep, ...restSteps } = prev;
                                  
                                  // Reconstruir el texto global desde el selectionMap actualizado
                                  // Esto elimina automáticamente las observaciones del paso eliminado
                                  const newGlobalText = buildGlobalTextFromSelectionMap(restSteps);
                                  setGlobalText(newGlobalText);
                                  
                                  return restSteps;
                                }
                                // Si no hay observaciones, no hacer nada
                                return prev;
                              });
                            }
                            
                            setStatusByStep((prev) => ({
                              ...prev,
                              [s.step_id]: newStatus,
                            }));
                          }}
                          className={clsx(
                            "w-full sm:w-[140px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-[4px] border text-xs sm:text-sm transition",
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
                          "w-full sm:w-auto sm:ml-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-[4px] border text-xs sm:text-sm flex items-center justify-center gap-2",
                          "border-[#0040B8] text-[#0040B8] hover:bg-zinc-50",
                          isCompleted && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => openObsModalForStep(s.step_id)}
                      >
                        <span>Observaciones</span>
                        <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Campo de observaciones abajo de los steps - solo para primera revisión */}
      {!isSecondInspection && (
        <div className="grid grid-cols-1 md:grid-cols-2 items-start gap-3 sm:gap-4 mt-6 sm:mt-8 w-full">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs sm:text-sm font-medium text-zinc-900">Observaciones generales</h4>
          </div>
          <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">
            Escribí las observaciones del vehículo, se guardan cuando confirmás la revisión. Máximo {MAX_CHARS} caracteres.
          </p>
        </div>

        <div className="rounded-lg sm:rounded-[14px] text-xs sm:text-sm border border-zinc-200 bg-white p-3 sm:p-4 w-full self-start md:col-span-2">
          <textarea
            value={globalText}
            onChange={(e) => {
              const txt = e.target.value;
              if (txt.length <= MAX_CHARS) setGlobalText(txt);
            }}
            disabled={isCompleted}
            placeholder="Ingresá tus observaciones."
            className={clsx(
              "w-full h-32 sm:h-40 outline-none resize-none text-xs sm:text-sm",
              isCompleted && "opacity-50 cursor-not-allowed"
            )}
            maxLength={MAX_CHARS}
          />
          <div className="mt-2 flex items-center justify-between">
            <div className={clsx(
              "text-[10px] sm:text-xs",
              obsCharCount > MAX_CHARS * 0.9 
                ? "text-amber-600 font-medium" 
                : obsCharCount > MAX_CHARS * 0.75
                ? "text-amber-500"
                : "text-zinc-400"
            )}>
              {obsCharCount >= MAX_CHARS * 0.9 && (
                <span className="mr-2">
                  {MAX_CHARS - obsCharCount > 0 
                    ? `Quedan ${MAX_CHARS - obsCharCount} caracteres disponibles`
                    : "Límite alcanzado"}
                </span>
              )}
            </div>
            <div className={clsx(
              "text-[10px] sm:text-xs",
              obsCharCount > MAX_CHARS * 0.9 
                ? "text-amber-600 font-medium" 
                : obsCharCount > MAX_CHARS * 0.75
                ? "text-amber-500"
                : "text-zinc-400"
            )}>
              {obsCharCount}/{MAX_CHARS}
            </div>
          </div>
        </div>
        </div>
      )}
      
      <section className="rounded-lg sm:rounded-[14px] border border-zinc-200 bg-white p-3 sm:p-4 w-full mt-4 sm:mt-6">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs sm:text-sm font-medium text-zinc-900">Subir informes técnicos y fotos del vehículo</h4>
          {inspDocsLoading && <span className="text-[10px] sm:text-xs text-zinc-500">Actualizando...</span>}
        </div>
        <p className="text-[10px] sm:text-xs text-zinc-500 mb-3 sm:mb-4">
          Los archivos que agregues quedan pendientes y se suben cuando guardás la revisión.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <div className={clsx(isCompleted && "opacity-50")}>
            <h5 className="text-xs sm:text-sm font-medium text-zinc-800 mb-2">Informes técnicos</h5>
            <Dropzone
              title=""
              onPendingChange={onPendingTechChange}
              existing={inspDocsTech}
              onDeleteExisting={(docId) => deleteInspectionDocument("technical_report", docId)}
              maxSizeMB={15}
              resetToken={dzResetTokenTech}
            />
          </div>

          <div className={clsx(isCompleted && "opacity-50")}>
            <h5 className="text-xs sm:text-sm font-medium text-zinc-800 mb-2">Fotos del vehículo</h5>
            <Dropzone
              title=""
              onPendingChange={onPendingPhotosChange}
              existing={inspDocsPhotos}
              onDeleteExisting={(docId) => deleteInspectionDocument("vehicle_photo", docId)}
              maxSizeMB={15}
              resetToken={dzResetTokenPhotos}
              frontSelection={
                (usageType || "").trim().toUpperCase() === "D"
                  ? {
                      selected: frontPhotoSel,
                      onChange: (sel) => setFrontPhotoSel(sel),
                      message: "Seleccioná qué foto es el frente del vehículo",
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </section>



      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 md:gap-5 mt-6 sm:mt-8 md:mt-10 w-full">
        <button
          type="button"
          className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-[4px] border border-zinc-300 text-xs sm:text-sm text-zinc-700 hover:bg-zinc-50"
          onClick={() => router.back()}
        >
          Cancelar
        </button>

        {
          (userType === "Administrativo" || userType === "Ingeniero" || userType === "Titular") && (
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
                "w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-[4px] border text-xs sm:text-sm text-[#0040B8]",
                certLoading ? "bg-blue-100 border-blue-200" : "border-[#0040B8] hover:bg-zinc-50",
                isCompleted && "opacity-50 cursor-not-allowed"
              )}
              title={isCompleted ? "No se puede generar certificado, revisión completada" : "Generar y abrir certificado"}
            >
              {certLoading ? "Generando..." : "Certificado"}
            </button>
          )
        }


        <button
          type="button"
          disabled={saving || isCompleted}
          onClick={saveAll}
          className={clsx(
            "w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-[4px] text-xs sm:text-sm text-white",
            saving ? "bg-blue-300" : "bg-[#0040B8] hover:opacity-95",
            isCompleted && "opacity-50 cursor-not-allowed"
          )}
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {confirmOpen && overallStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/30" onClick={() => !certLoading && setConfirmOpen(false)} />
          <div className="relative z-10 w-full max-w-[92vw] sm:max-w-[520px] rounded-lg sm:rounded-[14px] border border-zinc-200 bg-white p-4 sm:p-5 shadow-xl">
            <div className="flex items-start justify-between">
              <h3 className="text-sm sm:text-base font-semibold text-zinc-900">Confirmar certificado</h3>
              <button
                className="p-1 rounded hover:bg-zinc-100"
                onClick={() => !certLoading && setConfirmOpen(false)}
                aria-label="Cerrar"
              >
                <X size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>

            <p className="mt-4 sm:mt-6 mb-2 text-sm sm:text-md text-zinc-600">
              Se generará el certificado con condición{" "}
              <span
                className={clsx(
                  "ml-2 px-2 py-0.5 rounded border text-xs sm:text-sm",
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

            <div className="mt-6 sm:mt-10 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
              <button
                type="button"
                disabled={certLoading}
                className="w-full sm:w-auto px-4 py-2 rounded-[4px] border border-zinc-300 text-xs sm:text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                onClick={() => setConfirmOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={certLoading}
                className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-[4px] bg-[#0040B8] text-white text-xs sm:text-sm hover:opacity-90 disabled:opacity-60"
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
                        setObsModalError(null);
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

            {obsModalError && (
              <div className="mx-4 mt-2 p-3 rounded border border-red-300 bg-red-50 text-sm text-red-700">
                {obsModalError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {obsLoading ? (
                <div className="text-sm text-zinc-500 py-10 text-center">Cargando...</div>
              ) : (
                <>
                  {obsView === "parents" && (
                    <>
                      {/* Observaciones del paso */}
                      {stepObservations.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-xs font-medium text-zinc-700 mb-2 px-1">Observaciones del paso</h4>
                          <ul className="space-y-2">
                            {stepObservations.map((leaf) => {
                              const already =
                                !!selectionMap[obsModalStepId!]?.[-1]?.leaves.includes(leaf.description);
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
                                    <button
                                      className="inline-flex items-center gap-1 text-red-600 text-sm px-2 py-1 rounded border border-red-300 bg-white hover:bg-red-50"
                                      disabled={isCompleted}
                                      onClick={() =>
                                        removeLeafFromSelection(obsModalStepId!, null, leaf)
                                      }
                                      title="Quitar del texto"
                                    >
                                      <Minus size={16} />
                                      Quitar
                                    </button>
                                  ) : (
                                    <button
                                      className="inline-flex items-center gap-1 text-[#0040B8] text-sm px-2 py-1 rounded hover:bg-zinc-50"
                                      disabled={isCompleted}
                                      onClick={() =>
                                        addLeafToSelection(obsModalStepId!, null, leaf)
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
                          </ul>
                        </div>
                      )}

                      {/* Categorías */}
                      <ul className="divide-y divide-zinc-200">
                        {categories.map((c) => {
                          const selectedCount =
                            selectionMap[obsModalStepId!]?.[c.category_id]?.leaves.length || 0;
                          const hasObservations = categoriesWithObservations.has(c.category_id);
                          const isCategorySelected = 
                            !!selectionMap[obsModalStepId!]?.[c.category_id]?.leaves.includes(c.name);
                          
                          
                          return (
                            <li key={c.category_id} className="flex items-center justify-between py-3">
                              <span className="text-sm text-zinc-900 flex-1">{c.name}</span>
                              {selectedCount > 0 && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 mr-2">
                                  {selectedCount} agregado{selectedCount > 1 ? "s" : ""}
                                </span>
                              )}
                              {hasObservations ? (
                                <button
                                  className="flex items-center text-zinc-500 hover:text-zinc-700"
                                  disabled={isCompleted}
                                  onClick={() => {
                                    console.log(`[Click] Navegando a observaciones de categoría ${c.name}`);
                                    goToLeaves(c);
                                  }}
                                  title="Ver observaciones"
                                >
                                  <ChevronRight size={16} />
                                </button>
                              ) : (
                                <button
                                  className={clsx(
                                    "inline-flex items-center gap-1 text-sm px-2 py-1 rounded",
                                    isCategorySelected
                                      ? "text-red-600 border border-red-300 bg-white hover:bg-red-50"
                                      : "text-[#0040B8] hover:bg-zinc-50"
                                  )}
                                  disabled={isCompleted}
                                  onClick={() => {
                                    console.log(`[Click] ${isCategorySelected ? 'Quitando' : 'Agregando'} categoría ${c.name} directamente`);
                                    const categoryAsLeaf: ObservationLeaf = {
                                      observation_id: c.category_id,
                                      description: c.name,
                                    };
                                    if (isCategorySelected) {
                                      removeLeafFromSelection(obsModalStepId!, c, categoryAsLeaf);
                                    } else {
                                      addLeafToSelection(obsModalStepId!, c, categoryAsLeaf);
                                    }
                                  }}
                                  title={isCategorySelected ? "Quitar del texto" : "Agregar al texto"}
                                >
                                  {isCategorySelected ? (
                                    <>
                                      <Minus size={16} />
                                      Quitar
                                    </>
                                  ) : (
                                    <>
                                      <Plus size={16} />
                                      Agregar
                                    </>
                                  )}
                                </button>
                              )}
                            </li>
                          );
                        })}

                        {categories.length === 0 && stepObservations.length === 0 && (
                          <li className="py-6 text-center text-sm text-zinc-500">
                            No hay categorías configuradas
                          </li>
                        )}
                      </ul>
                    </>
                  )}

                  {obsView === "items" && (
                    <ul className="space-y-2">
                      {leaves.length > 0 ? (
                        leaves.map((leaf) => {
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
                                <button
                                  className="inline-flex items-center gap-1 text-red-600 text-sm px-2 py-1 rounded border border-red-300 bg-white hover:bg-red-50"
                                  disabled={isCompleted}
                                  onClick={() =>
                                    removeLeafFromSelection(
                                      obsModalStepId!,
                                      selectedCategory!,
                                      leaf
                                    )
                                  }
                                  title="Quitar del texto"
                                >
                                  <Minus size={16} />
                                  Quitar
                                </button>
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
                        })
                      ) : (
                        // Si no hay observaciones hijo, mostrar la categoría misma como seleccionable
                        (() => {
                          const categoryAsLeaf: ObservationLeaf = {
                            observation_id: selectedCategory!.category_id,
                            description: selectedCategory!.name,
                          };
                          const already =
                            !!selectionMap[obsModalStepId!]?.[selectedCategory!.category_id]?.leaves.includes(
                              selectedCategory!.name
                            );
                          return (
                            <li
                              key={`category-${selectedCategory!.category_id}`}
                              className={clsx(
                                "flex items-center justify-between rounded border p-3",
                                already ? "border-emerald-300 bg-emerald-50/40" : "border-zinc-200"
                              )}
                            >
                              <span className="text-sm text-zinc-800">{selectedCategory!.name}</span>

                              {already ? (
                                <button
                                  className="inline-flex items-center gap-1 text-red-600 text-sm px-2 py-1 rounded border border-red-300 bg-white hover:bg-red-50"
                                  disabled={isCompleted}
                                  onClick={() =>
                                    removeLeafFromSelection(
                                      obsModalStepId!,
                                      selectedCategory!,
                                      categoryAsLeaf
                                    )
                                  }
                                  title="Quitar del texto"
                                >
                                  <Minus size={16} />
                                  Quitar
                                </button>
                              ) : (
                                <button
                                  className="inline-flex items-center gap-1 text-[#0040B8] text-sm px-2 py-1 rounded hover:bg-zinc-50"
                                  disabled={isCompleted}
                                  onClick={() =>
                                    addLeafToSelection(
                                      obsModalStepId!,
                                      selectedCategory!,
                                      categoryAsLeaf
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
                        })()
                      )}
                    </ul>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-zinc-200 p-4 flex justify-end">
              <button
                className="px-4 py-2 rounded-[4px] border border-zinc-300 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
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
        <div className="mt-4 text-sm text-[#41c227] border border-[#41c227] p-3 rounded-[4px] text-center">
          {msg}
        </div>
      )}
      {error && (
        <div className="mt-4 text-sm text-[#d11b2d] border border-[#d11b2d] p-3 rounded-[4px] text-center">
          {error}
        </div>
      )}
    </div>
  );
}
