"use client";

import { useEffect, useState } from "react";
import { MoveRight, Info, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

export default function SelectWorkshopPage() {
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [isGarageOwner, setIsGarageOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useUser();

  const logOutFunction = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return;
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("❌ Error de red:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        router.push("/");
        return;
      }

      const data = await res.json();

      if (data.user?.is_admin) {
        router.push("/admin-dashboard");
        return;
      }

      const list = data.workshops || [];
      setWorkshops(list);

      const hasGarageOwner = list.some((w: any) => w.user_type_id === 2);
      setIsGarageOwner(hasGarageOwner);

      setLoading(false);
    };

    if (user) fetchData();
  }, [user, router]);

  const handleSelect = (id: number) => {
    router.push(`/dashboard/${id}`);
  };

  if (loading) return null; // o un spinner

  return (
    <main className="min-h-screen flex items-center justify-center bg-white font-sans relative">
      {/* Header fijo arriba a la derecha */}
      <header className="absolute top-4 right-4">
        <button
          onClick={logOutFunction}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-[6px] border border-[#DEDEDE] text-[#333] hover:bg-gray-50 text-sm"
          aria-label="Cerrar sesión"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </header>

      <section className="w-full max-w-md bg-white rounded-[10px] border border-[#DEDEDE] px-8 py-10 text-center flex flex-col justify-between">
        <article className="text-center text-xl">
          Bienvenido{" "}
          <span className="font-bold">
            {`${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "Usuario"}
          </span>
        </article>

        <h1 className="mx-2 my-4">Seleccioná el taller a ingresar</h1>

        <section className="flex flex-col gap-4 mt-2">
          {workshops.length > 0 ? (
            workshops.map((w) => (
              <article
                key={w.workshop_id}
                className="flex justify-between items-center border border-[#CECECE] rounded-[4px] p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSelect(w.workshop_id)}
                title={`Ingresa al taller: ${w.workshop_name}`}
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
          <article
            className="mt-10 flex justify-between items-center bg-[#0040B8] rounded-[4px] p-4 cursor-pointer hover:opacity-95"
            onClick={() => router.push("/create-workshop")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") router.push("/create-workshop");
            }}
          >
            <h3 className="mx-auto text-white">Inscribir mi taller</h3>
          </article>
        )}
      </section>
    </main>
  );
}
