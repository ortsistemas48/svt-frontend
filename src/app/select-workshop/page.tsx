"use client";

import { useEffect, useState } from "react";
import { MoveRight, Info, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

export default function SelectWorkshopPage() {
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useUser();

  const logOutFunction = async () => {
    try {
      const res = await fetch(`/api/auth/logout`, {
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
      const res = await fetch(`/api/auth/me`, {
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
      setLoading(false);
    };

    if (user) fetchData();
  }, [user, router]);

  const handleSelect = (id: number) => {
    router.push(`/dashboard/${id}`);
  };

  if (loading) return null; // o un spinner

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 font-sans relative p-4">
      {/* Header fijo arriba a la derecha */}
      <header className="absolute top-4 right-4 z-10">
        <button
          onClick={logOutFunction}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-[4px] border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors duration-200"
          aria-label="Cerrar sesión"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Cerrar sesión</span>
        </button>
      </header>

      <section className="w-full max-w-md sm:max-w-lg bg-white rounded-[14px] border border-gray-200 shadow-sm flex flex-col max-h-[90vh] sm:max-h-[80vh]">
        {/* Header Section - Fixed */}
        <div className="px-6 py-6 border-b border-gray-100">
          <article className="text-center text-lg sm:text-xl mb-2">
            Bienvenido{" "}
            <span className="font-bold text-[#0040B8]">
              {`${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "Usuario"}
            </span>
          </article>
          <h1 className="text-center text-base sm:text-lg text-gray-700">
            Seleccioná el taller a ingresar
          </h1>
        </div>

        {/* Scrollable Workshops List */}
        <div className="flex-1 overflow-y-auto px-6 py-10">
          <section className="flex flex-col gap-3">
            {workshops.length > 0 ? (
              workshops.map((w) => (
                <article
                  key={w.workshop_id}
                  className={`relative group flex justify-between items-center border rounded-[4px] p-4 transition-all duration-200 ${
                    w.is_approved
                      ? "cursor-pointer hover:bg-gray-50 hover:border-[#0040B8] hover:shadow-sm border-gray-200"
                      : "bg-gray-50 border-gray-200 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (w.is_approved) handleSelect(w.workshop_id);
                  }}
                  aria-disabled={!w.is_approved}
                  title={
                    w.is_approved
                      ? `Ingresa al taller: ${w.workshop_name}`
                      : "Pendiente de aprobación"
                  }
                >
                  {/* Tooltip solo si está pendiente */}
                  {!w.is_approved && (
                    <div className="absolute left-4 -top-10 hidden group-hover:block z-20">
                      <div className="bg-gray-900 text-white text-xs rounded-[4px] px-3 py-2 shadow-lg">
                        Pendiente de aprobación
                      </div>
                      <div className="w-2 h-2 bg-gray-900 rotate-45 mx-3 -mt-1" />
                    </div>
                  )}

                  <div className="flex items-center min-w-0 flex-1">
                    <h3 className="font-medium text-sm sm:text-base text-gray-900 truncate">
                      {w.workshop_name}
                    </h3>
                    {!w.is_approved && (
                      <span className="ml-2 text-xs text-gray-500 whitespace-nowrap">
                        (Pendiente)
                      </span>
                    )}
                  </div>

                  <div className="ml-3 flex-shrink-0">
                    {w.is_approved ? (
                      <MoveRight size={18} className="text-[#0040B8]" />
                    ) : (
                      <Info size={18} className="text-gray-400" />
                    )}
                  </div>
                </article>
              ))
            ) : (
              <article className="flex justify-center items-center border border-gray-200 rounded-[4px] p-6 text-gray-600">
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <Info size={20} className="text-gray-400" />
                  <span className="text-sm sm:text-base text-center">
                    No tenés talleres asignados
                  </span>
                </div>
              </article>
            )}
          </section>
        </div>

        {/* Footer Section - Fixed, siempre visible */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <button
            className="w-full flex justify-center items-center bg-[#0040B8] hover:bg-[#0035A0] text-white rounded-[4px] p-4 cursor-pointer transition-colors duration-200 font-medium text-sm sm:text-base"
            onClick={() => router.push("/create-workshop")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") router.push("/create-workshop");
            }}
          >
            <span>Inscribir mi taller</span>
          </button>
        </div>
      </section>
    </main>
  );
}
