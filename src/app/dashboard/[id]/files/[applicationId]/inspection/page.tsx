// app/dashboard/[id]/files/[applicationId]/ficha-tecnica/page.tsx
import { ChevronRight } from "lucide-react";
import { cookies, headers } from "next/headers";
import fetchUserTypeInWorkshop from "@/auth";
import { InspectionStepsViewOnlyClient } from "./InspectionStepsViewOnlyClient";

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
    license_plate: data.license_plate as string | undefined,
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
  return data.inspection_id as number;
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
    return [];
  }

  const docs = await res.json();
  return docs;
}

export default async function FichaTecnicaPage({
  params,
}: {
  params: Promise<{ id: string; applicationId: string }>;
}) {
  const { id, applicationId } = await params;
  const appId = Number(applicationId);
  const workshopId = id;

  const appData = await fetchApplicationStatus(appId);
  const inspectionId = await ensureInspection(appId);

  const [steps, detailsResp, inspectionDocs] = await Promise.all([
    fetchSteps(appId),
    fetchDetails(inspectionId),
    fetchInspectionDocuments(inspectionId),
  ]);

  const {
    detailsRows,
    globalObs,
    licensePlate,
  } = detailsResp;

  const initialStatuses: Record<
    number,
    "Apto" | "Condicional" | "Rechazado" | undefined
  > = {};

  detailsRows.forEach((row) => {
    if (row.detail?.status) {
      initialStatuses[row.step_id] = row.detail.status;
    }
  });

  const plateLabel = (licensePlate || appData.license_plate || "Sin dominio").trim().toUpperCase();
  const { name: userType } = await fetchUserTypeInWorkshop({ workshopId });

  return (
    <div className="min-w-full">
      <article className="flex items-center justify-between text-lg mb-6 px-4">
        <div className="flex items-center gap-1 flex-wrap">
          <span>Inicio</span>
          <ChevronRight size={20} />
          <a href={`/dashboard/${workshopId}/files`} className="text-[#0040B8] hover:underline">
            Legajos
          </a>
          <ChevronRight size={20} />
          <a href={`/dashboard/${workshopId}/files/${applicationId}`} className="text-[#0040B8] hover:underline">
            Detalle
          </a>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">Ficha técnica</span>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">{plateLabel}</span>
        </div>
      </article>

      <InspectionStepsViewOnly
        inspectionId={inspectionId}
        appId={appId}
        steps={[...steps].sort((a, b) => a.order - b.order)}
        initialStatuses={initialStatuses}
        apiBase="/api"
        initialGlobalObs={globalObs}
        userType={userType}
        inspectionDocs={inspectionDocs}
      />
    </div>
  );
}

function InspectionStepsViewOnly({
  inspectionId,
  appId,
  steps,
  initialStatuses,
  apiBase,
  initialGlobalObs,
  userType,
  inspectionDocs,
}: {
  inspectionId: number;
  appId: number;
  steps: Step[];
  initialStatuses: Record<number, "Apto" | "Condicional" | "Rechazado" | undefined>;
  apiBase: string;
  initialGlobalObs: string;
  userType: string;
  inspectionDocs: any[];
}) {
  return (
    <InspectionStepsViewOnlyClient
      inspectionId={inspectionId}
      appId={appId}
      steps={steps}
      initialStatuses={initialStatuses}
      apiBase={apiBase}
      initialGlobalObs={initialGlobalObs}
      userType={userType}
      inspectionDocs={inspectionDocs}
    />
  );
}

