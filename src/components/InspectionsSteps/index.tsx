// components/inspections/InspectionStepsClient.tsx
"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

type Step = { step_id: number; name: string; description: string; order: number };
type Status = "Apto" | "Condicional" | "Rechazado";

export default function InspectionStepsClient({
  inspectionId,
  appId,
  steps,
  initialStatuses,
  apiBase,
}: {
  inspectionId: number;
  appId: number;
  steps: Step[];
  initialStatuses: Record<number, Status | undefined>;
  apiBase: string | undefined;
}) {
  const [statusByStep, setStatusByStep] = useState<Record<number, Status | undefined>>(initialStatuses || {});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [globalObs, setGlobalObs] = useState("");
  const router = useRouter(); 

  const hasNonApto = useMemo(
    () => Object.values(statusByStep).some((s) => s && s !== "Apto"),
    [statusByStep]
  );

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

  const saveAll = async () => {
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

      const res = await fetch(`${apiBase}/inspections/inspections/${inspectionId}/details/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ items }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "No se pudo guardar");
      }

      setMsg("Detalles guardados");
    } catch (e: any) {
      setError(e.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full px-4 pb-10">
      <div className="w-full space-y-4">
        {steps.map((s) => {
          const current = statusByStep[s.step_id];
          const isNonApto = current === "Condicional" || current === "Rechazado";
          const options: Status[] =
            isNonApto ? ([current] as Status[]) : (["Apto", "Condicional", "Rechazado"] as Status[]);
          return (
            <section
              key={s.step_id}
              className={"w-full rounded-[10px] border bg-white border-zinc-200"}>
              <div className="flex flex-col lg:flex-row md:items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <h3 className="font-medium text-zinc-900">{s.name}</h3>
                  <p className="text-sm md:max-w-[400px] text-zinc-500">{s.description}</p>
                </div>

                <div className="flex items-center gap-5 flex-wrap">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handlePick(s.step_id, opt)}
                      className={clsx(
                        "w-[140px] px-4 py-2.5 rounded-[4px] border text-sm transition",
                        current === opt
                          ? opt === "Apto"
                            ? "border-emerald-600 text-emerald-700 bg-emerald-50"
                            : opt === "Condicional"
                            ? "border-amber-500 text-amber-700 bg-amber-50"
                            : "border-rose-600 text-rose-700 bg-rose-50"
                          : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                      )}
                    >
                      {opt}
                    </button>
                  ))}

                  {isNonApto && (
                    <button
                    type="button"
                    className="ml-2 px-4 py-2.5 rounded-[4px] border border-[#0040B8] text-[#0040B8] hover:bg-zinc-50 text-sm flex items-center gap-2"
                    onClick={() => {
                        setMsg("Abrir modal de observaciones, placeholder");
                        setTimeout(() => setMsg(null), 1500);
                    }}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 w-full">
        <div className="rounded-[10px] text-sm border border-zinc-200 bg-white p-4 w-full">
          <textarea
            value={globalObs}
            onChange={(e) => setGlobalObs(e.target.value)}
            placeholder="Observaciones generales..."
            className="w-full h-40 outline-none resize-none"
            maxLength={400}
          />
          <div className="mt-2 text-right text-xs text-zinc-400">{globalObs.length}/400</div>
        </div>

        <div className="rounded-[10px] border border-zinc-200 bg-white p-4 w-full">
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
          disabled={saving}
          onClick={saveAll}
          className={clsx(
            "px-5 py-2.5 rounded-[4px] text-white",
            saving ? "bg-blue-300" : "bg-[#0040B8] hover:opacity-95"
          )}
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </div>

      {msg && <div className="mt-4 text-sm text-emerald-700">{msg}</div>}
      {error && <div className="mt-4 text-sm text-rose-700">{error}</div>}
    </div>
  );
}
