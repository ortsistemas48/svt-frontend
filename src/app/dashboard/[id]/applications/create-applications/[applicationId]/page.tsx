"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ApplicationForm from "@/components/ApplicationForm";
import { ApplicationProvider, useApplication } from "@/context/ApplicationContext";
import Skeleton from "@/components/Skeleton";
import { useDashboard } from "@/context/DashboardContext";


function ApplicationSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Datos del Titular */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-14 w-full" /> 
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" /> 
        <Skeleton className="h-14 w-full" /> 
        <Skeleton className="h-14 w-full" /> 
        <Skeleton className="h-14 w-full" /> 
        <div className="flex gap-2">
          <Skeleton className="h-[200px] w-full" /> 
        </div>
      </div>

      {/* Datos del Conductor */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" /> 
        <Skeleton className="h-14 w-full" /> 
        <Skeleton className="h-14 w-full" /> 
        <div className="flex gap-2">
          <Skeleton className="h-[200px] w-full" /> 
        </div>
      </div>
    </div>
  );
}


export default function CreateApplicationPage() {
  const params = useParams();
  const { id } = params;
  const workshopId = Number(id);
  const applicationId = params?.applicationId as string;
  const [application, setApplication] = useState(null);
  const { setApplicationErrors } = useDashboard();
  const router = useRouter();
  useEffect(() => {
    async function fetchApplication(id: string) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/get-applications/${id}`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });
        
        if (!res.ok) {
          const text = await res.text();
          console.error("Error al traer la aplicación:", text);
          return;
        }

        const data = await res.json();
        if (workshopId !== data.workshop_id) {
          router.push(`/dashboard/${workshopId}/applications`);
          setApplicationErrors(prev => ({
            ...prev,
            general: "No se puede editar una revisión que no pertenece a este taller."
          }));
          return;
        }
        if (data.status !== "Pendiente"){
          router.push(`/dashboard/${workshopId}/applications`);
          setApplicationErrors(prev => ({
            ...prev,
            general: "No se puede editar una revisión ya iniciada o finalizada."
          }));
          return;
        }
        setApplication(data);
      } catch (err) {
        console.error("Error de red:", err);
      }
    }

    if (applicationId) {
      fetchApplication(applicationId);
    }
  }, [applicationId]);

  if (!application) {
    return (
      <div className="p-6">
        <ApplicationSkeleton />
      </div>
    );
  }

  return (
    <ApplicationProvider>
      <ApplicationForm applicationId={applicationId} initialData={application} />
    </ApplicationProvider>
  );
}
