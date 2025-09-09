import ApplicationForm from "@/components/ApplicationForm";
import { ApplicationProvider } from "@/context/ApplicationContext";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function CreateApplicationPage({ params }: { params: { id: string; applicationId: string } }) {
  const workshopId = Number(params.id);
  const applicationId = params.applicationId;

  try {
    const cookieHeader = (await headers()).get("cookie") || "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/get-applications/${applicationId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieHeader,
      },
      cache: "no-store",
      next: { revalidate: 0 },
    });

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
        <ApplicationForm applicationId={applicationId} initialData={data} />
      </ApplicationProvider>
    );
  } catch (e) {
    redirect(`/dashboard/${workshopId}/applications`);
  }
}
