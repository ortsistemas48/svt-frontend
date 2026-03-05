import { Suspense } from "react";
import Dashboard from "@/components/Dashboard";
import DashboardSkeleton from "@/components/Dashboard/Skeleton";
import fetchUserTypeInWorkshop from "@/auth";

export default async function Home({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workshopId = Number(id);

  // Start the auth promise immediately — Dashboard will resolve it concurrently
  // with its own data fetches so auth and data run in parallel.
  // The Suspense boundary streams the skeleton to the browser immediately while
  // Dashboard resolves all its data server-side.
  const userTypePromise = fetchUserTypeInWorkshop({ workshopId: String(workshopId) });

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard workshopId={workshopId} userTypePromise={userTypePromise} />
    </Suspense>
  );
}
