"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ApplicationForm from "@/components/ApplicationForm";

export default function CreateApplicationPage() {
  const params = useParams();
  const applicationId = params?.applicationId as string;
  const [application, setApplication] = useState(null);

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
        console.log(data)
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
    return <div>Cargando aplicación...</div>;
  }

  return (
    <ApplicationForm applicationId={applicationId} initialData={application}/>
  );
}
