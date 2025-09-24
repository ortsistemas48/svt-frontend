// app/inspections/[appId]/page.tsx
import { ChevronRight } from "lucide-react";
import InspectionStepsClient from "@/components/InspectionsSteps";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Step = { step_id: number; name: string; description: string; order: number };
type ObservationRow = { id: number; description: string; checked: boolean };

type DetailRow = {
  order: number;
  step_id: number;
  name: string;
  description: string;
  detail: null | {
    detail_id: number;
    status: "Apto" | "Condicional" | "Rechazado";
    observations: string | null;
  };
  observations: ObservationRow[]; // viene del backend en obs_list
};

const API = process.env.NEXT_PUBLIC_API_URL as string;

async function fetchApplicationStatus(appId: number) {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${API}/applications/get-applications/${appId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieHeader,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudo obtener la información de la aplicación");
  }
  
  const data = await res.json();
  return data.status as string;
}

async function ensureInspection(appId: number) {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${API}/inspections/inspections`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: cookieHeader },
    body: JSON.stringify({ application_id: appId }),
    cache: "no-store",
  });

  if (!res.ok && res.status !== 200) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || "No se pudo crear o recuperar la revisión");
  }
  const data = await res.json();
  return data.inspection_id as number;
}

async function fetchSteps(appId: number) {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${API}/inspections/applications/${appId}/steps`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudieron obtener los pasos");
  const steps: Step[] = await res.json();
  return steps;
}

function parseObsField(obs: unknown): ObservationRow[] {
  if (Array.isArray(obs)) return obs as ObservationRow[];
  if (typeof obs === "string") {
    try {
      const parsed = JSON.parse(obs);
      return Array.isArray(parsed) ? parsed as ObservationRow[] : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeRows(rows: DetailRow[]): DetailRow[] {
  return rows.map((it) => ({
    ...it,
    observations: parseObsField(it.observations),
  }));
}

async function fetchDetails(inspectionId: number) {
  const cookieHeader = (await cookies()).toString();
  const res = await fetch(`${API}/inspections/inspections/${inspectionId}/details`, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudieron obtener los detalles");

  const payload = await res.json();
  if (Array.isArray(payload)) {
    const rows = normalizeRows(payload as DetailRow[]);
    return { rows, globalObs: "", licensePlate: undefined as string | undefined };
  }

  const {
    items,
    global_observations,
    license_plate,
  } = payload as {
    items: DetailRow[];
    global_observations: string | null;
    license_plate?: string | null;
  };

  const rows = normalizeRows(items || []);
  return {
    rows,
    globalObs: global_observations ?? "",
    licensePlate: license_plate ?? undefined,
  };
}

export default async function InspectionPage({ params }: { params: Promise<{ id: string; applicationId: string }> }) {
  const { id, applicationId } = await params;
  const appId = Number(applicationId);
  const workshopId = id;

  // Check application status before proceeding
  const applicationStatus = await fetchApplicationStatus(appId);
  if (applicationStatus === "Completado") {
    // Redirect back to applications list if inspection is already completed
    redirect(`/dashboard/${workshopId}/applications`);
  }

  const inspectionId = await ensureInspection(appId);
  const [steps, detailsResp] = await Promise.all([fetchSteps(appId), fetchDetails(inspectionId)]);
  const { rows: details, globalObs, licensePlate } = detailsResp;

  const initialStatuses: Record<number, "Apto" | "Condicional" | "Rechazado" | undefined> = {};
  const initialObsByStep: Record<number, ObservationRow[]> = {};
  const plateLabel = (licensePlate?.trim() || "Sin dominio").toUpperCase();

  details.forEach((r) => {
    if (r.detail?.status) initialStatuses[r.step_id] = r.detail.status;
    if (Array.isArray(r.observations)) initialObsByStep[r.step_id] = r.observations;
  });

  return (
    <div className="min-w-full">
      <article className="flex items-center justify-between text-lg mb-6 px-4">
        <div className="flex items-center gap-1">
          <span>Inicio</span>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">Revisión técnica</span>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">{plateLabel}</span>
        </div>
      </article>

      <InspectionStepsClient
        inspectionId={inspectionId}
        appId={appId}
        steps={steps.sort((a, b) => a.order - b.order)}
        initialStatuses={initialStatuses}
        apiBase={API}
        initialObsByStep={initialObsByStep}   
        initialGlobalObs={globalObs}         
      />
    </div>
  );
}
