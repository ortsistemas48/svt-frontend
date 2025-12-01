// app/dashboard/[id]/applications/[applicationId]/page.tsx
import ApplicationForm from "@/components/ApplicationForm";
import { ApplicationProvider } from "@/context/ApplicationContext";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ApplicationSkeleton } from "@/components/ApplicationSkeleton";
import { apiFetch } from "@/utils";

type RouteParams = { id: string; applicationId: string };

export default async function CreateApplicationPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { id, applicationId } = await params;
  const workshopId = Number(id);

  try {
    // Usar apiFetch que maneja cookies y base URL automáticamente
    const res = await apiFetch(
      `/api/applications/get-applications/${applicationId}`,
      {
        method: "GET",
      }
    );

    if (!res.ok) {
      redirect(`/dashboard/${workshopId}/applications`);
    }

    const data = await res.json();
    if (workshopId !== Number(data.workshop_id)) {
      redirect(`/dashboard/${workshopId}/applications`);
    }
    if (data.status !== "Pendiente") {
      redirect(`/dashboard/${workshopId}/applications`);
    }

    return (
      <ApplicationProvider>
        <Suspense fallback={<ApplicationSkeleton />}>
          <ApplicationForm applicationId={applicationId} initialData={data} />
        </Suspense>
      </ApplicationProvider>
    );
  } catch {
    redirect(`/dashboard/${workshopId}/applications`);
  }
}
