import Dashboard from "@/components/Dashboard";



export default async function Home({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workshopId = Number(id);
  return (
    <>
        <Dashboard workshopId={workshopId} />
    </>
  )
}
