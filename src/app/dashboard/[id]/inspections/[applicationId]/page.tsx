// app/dashboard/[id]/inspections/[applicationId]/page.tsx
import { ChevronRight } from "lucide-react";
import InspectionStepsClient from "@/components/InspectionsSteps";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import fetchUserTypeInWorkshop from "@/auth";

type Step = {
  step_id: number;
  name: string;
  description: string;
  order: number;
};

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
};

async function getBaseURL() {
  const h = await headers();
  const host =
    h.get("x-forwarded-host") ||
    h.get("host") ||
    process.env.VERCEL_URL;
  if (!host) throw new Error("No host header");

  const proto =
    h.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "production" ? "https" : "http");

  return `${proto}://${host}`;
}

async function getCookieHeader() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  return cookieHeader
    ? ({ cookie: cookieHeader } as Record<string, string>)
    : {};
}

async function fetchApplicationStatus(appId: number) {
  const base = await getBaseURL();
  const headersObj = await getCookieHeader();

  const res = await fetch(
    `${base}/api/applications/get-applications/${appId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headersObj,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(
      "No se pudo obtener la información de la aplicación"
    );
  }

  const data = await res.json();
  return { 
    status: data.status as string, 
    result: data.result as string,
    usage_type: data.usage_type as string | undefined
  };
}

async function ensureInspection(appId: number) {
  const base = await getBaseURL();
  const headersObj = await getCookieHeader();

  const res = await fetch(`${base}/api/inspections/inspections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headersObj,
    },
    body: JSON.stringify({ application_id: appId }),
    cache: "no-store",
  });

  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(
      j?.error || "No se pudo crear o recuperar la revisión"
    );
  }

  const data = await res.json();
  return {
    inspection_id: data.inspection_id as number,
    is_second: data.is_second as boolean
  };
}

async function fetchSteps(appId: number) {
  const base = await getBaseURL();
  const headersObj = await getCookieHeader();

  const res = await fetch(
    `${base}/api/inspections/applications/${appId}/steps`,
    {
      headers: {
        ...headersObj,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("No se pudieron obtener los pasos");
  }

  const steps: Step[] = await res.json();
  return steps;
}

async function fetchDetails(inspectionId: number) {
  const base = await getBaseURL();
  const headersObj = await getCookieHeader();

  const res = await fetch(
    `${base}/api/inspections/inspections/${inspectionId}/details`,
    {
      headers: {
        ...headersObj,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error("No se pudieron obtener los detalles");
  }

  const payload = await res.json();

  // backend puede responder de 2 formas:
  // a) { items: [...], global_observations, license_plate }
  // b) legacy: [ ... ]
  if (Array.isArray(payload)) {
    // legacy: no viene patente ni global_observations separados
    const rows = payload as DetailRow[];
    return {
      detailsRows: rows,
      globalObs: "",
      licensePlate: undefined as string | undefined,
    };
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

  return {
    detailsRows: items || [],
    globalObs: global_observations ?? "",
    licensePlate: license_plate ?? undefined,
  };
}

async function fetchInspectionDocuments(inspectionId: number) {
  const base = await getBaseURL();
  const headersObj = await getCookieHeader();

  const res = await fetch(
    `${base}/api/inspections/inspections/${inspectionId}/documents?role=global`,
    {
      headers: {
        ...headersObj,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    // No bloquear la carga si falla esta parte; devolver vacío
    return [] as any[];
  }

  const data = await res.json();
  return (Array.isArray(data) ? data : []) as any[];
}

export default async function InspectionPage({
  params,
}: {
  params: Promise<{ id: string; applicationId: string }>;
}) {
  const { id, applicationId } = await params;
  const appId = Number(applicationId);
  const workshopId = id;

  const applicationData = await fetchApplicationStatus(appId);
  if (applicationData.status === "Completado") {
    redirect(`/dashboard/${workshopId}/applications`);
  }
  
  // Detect if it's a second inspection from status
  const isSecondInspection = applicationData.status === "Segunda Inspección";
  const usageType = applicationData.usage_type;
  
  const inspectionData = await ensureInspection(appId);
  const inspectionId = inspectionData.inspection_id;

  // Cargar datos críticos primero (sin esperar documentos)
  const [steps, detailsResp] = await Promise.all([
    fetchSteps(appId),
    fetchDetails(inspectionId),
  ]);

  const {
    detailsRows,
    globalObs,
    licensePlate,
  } = detailsResp;

  // If second inspection, start with empty statuses (backend returns empty details)
  const initialStatuses: Record<
    number,
    "Apto" | "Condicional" | "Rechazado" | undefined
  > = {};

  // Only load statuses if NOT second inspection
  if (!isSecondInspection) {
    detailsRows.forEach((row) => {
      if (row.detail?.status) {
        initialStatuses[row.step_id] = row.detail.status;
      }
    });
  }

  const plateLabel = (licensePlate?.trim() || "Sin dominio").toUpperCase();
  const { name: userType} = await fetchUserTypeInWorkshop({ workshopId });
  
  return (
    <div className="min-w-full">
      <article className="flex items-center justify-between text-lg mb-6 px-4">
        <div className="flex items-center gap-1 flex-wrap">
          <span>Inicio</span>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">Revisión técnica</span>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">{plateLabel}</span>
        </div>
      </article>

      {isSecondInspection && applicationData.result === "Condicional" && (
        <div className="mx-4 mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-[14px] shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-6 h-6 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 mb-1">
                Segunda Inspección - Resultado Condicional
              </h3>
              <p className="text-sm text-amber-800">
                Esta es una segunda inspección para un vehículo que obtuvo resultado "Condicional" en la primera revisión. 
                Por favor, verifique cuidadosamente todos los puntos que fueron marcados como condicionales anteriormente.
              </p>
            </div>
          </div>
        </div>
      )}

      <InspectionStepsClient
        inspectionId={inspectionId}
        appId={appId}
        steps={[...steps].sort((a, b) => a.order - b.order)}
        initialStatuses={initialStatuses}
        apiBase="/api"
        initialGlobalObs={isSecondInspection ? "" : globalObs}
        userType={userType}
        isSecondInspection={isSecondInspection}
        initialInspDocs={[]}
        initialIsCompleted={applicationData.status === "Completado"}
        usageType={usageType}
      />
    
    </div>
  );
}
