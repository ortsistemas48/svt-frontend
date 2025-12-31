import Dashboard from "@/components/Dashboard";
import fetchUserTypeInWorkshop from "@/auth";

export default async function Home({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workshopId = Number(id);
  const userType = await fetchUserTypeInWorkshop({ workshopId: String(workshopId) });
  return (
    <>
        <Dashboard workshopId={workshopId} userType={userType} />
    </>
  )
}
