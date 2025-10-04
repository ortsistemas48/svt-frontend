// app/dashboard/[id]/applications/[applicationId]/page.tsx
import ApplicationForm from "@/components/ApplicationForm";
import { ApplicationProvider } from "@/context/ApplicationContext";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ApplicationSkeleton } from "@/components/ApplicationSkeleton";

type RouteParams = { id: string; applicationId: string };

async function getBaseURL() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || process.env.VERCEL_URL;
  if (!host) throw new Error("No host header");

  const proto =
    h.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "production" ? "https" : "http");

  return `${proto}://${host}`;
}

export default async function CreateApplicationPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { id, applicationId } = await params;
  const workshopId = Number(id);

  try {
    const base = await getBaseURL();

    // igual que en getUserFromCookies, armamos el header Cookie desde cookies()
    const cookieHeader = (await cookies()).toString();

    const res = await fetch(
      `${base}/api/applications/get-applications/${applicationId}`,
      {
        method: "GET",
        headers: cookieHeader ? { cookie: cookieHeader } : {},
        cache: "no-store",
        next: { revalidate: 0 },
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
