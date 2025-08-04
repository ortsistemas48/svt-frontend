"use client";

import { useEffect, useState } from "react";
import { MoveRight, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

export default function SelectWorkshopPage() {
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [isGarageOwner, setIsGarageOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const {user} = useUser();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (user === undefined) return; 
    if (user === null) {
      router.push("/");
    } else {
      setChecking(false);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: "GET",
        credentials: "include"
      });

      if (!res.ok) {
        console.error("Error al obtener talleres");
        return;
      }

      const data = await res.json();
      setWorkshops(data.workshops || []);

      const hasGarageOwner = (data.workshops || []).some(
        (w: any) => w.user_type_id === 2
      );
      setIsGarageOwner(hasGarageOwner);
      setLoading(false);
    };

    if (user){
    fetchData();
    }
  }, []);

  const handleSelect = (id: number) => {
    router.push(`/dashboard/${id}`);
  };

  if (loading) {
    return null; // o spinner
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-white font-sans">
      <section className="w-full max-w-md bg-white rounded-[10px] border border-[#DEDEDE] px-8 py-10 text-center flex flex-col justify-between">
        <h1 className="mx-2 my-4 font-semibold">Seleccioná el taller a ingresar</h1>

        <section className="flex flex-col gap-4 mt-4">
          {workshops.length > 0 ? (
            workshops.map((w) => (
              <article
                key={w.workshop_id}
                className="flex justify-between items-center border border-[#CECECE] rounded-[4px] p-4 cursor-pointer"
                onClick={() => handleSelect(w.workshop_id)}
              >
                <h3>{w.workshop_name}</h3>
                <MoveRight size={20} />
              </article>
            ))
          ) : (
            <article className="flex justify-between items-center border border-[#CECECE] rounded-[4px] p-4 text-gray-600">
              <div className="flex gap-2 items-center mx-auto">
                <Info size={20} stroke="#888" />
                <span>No tenés talleres asignados</span>
              </div>
            </article>
          )}
        </section>

        {isGarageOwner && (
          <article className="mt-10 flex justify-between items-center bg-[#0040B8] rounded-[4px] p-4 cursor-pointer">
            <h3 className="mx-auto text-white">Inscribir mi taller</h3>
          </article>
        )}
      </section>
    </main>
  );
}
