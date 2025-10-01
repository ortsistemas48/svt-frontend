'use client';
import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RefreshCw, CircleFadingPlus } from "lucide-react";

type WorkshopLite = {
  id: number;
  name?: string;
  available_inspections?: number | null;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export default function SelectApplicationType() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [creating, setCreating] = useState(false);
  const [wsLoading, setWsLoading] = useState(true);
  const [wsError, setWsError] = useState<string | null>(null);
  const [workshop, setWorkshop] = useState<WorkshopLite | null>(null);

  // Traer el taller para conocer available_inspections
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setWsLoading(true);
        setWsError(null);

        // ajustá el endpoint si en tu backend es otro (p. ej. /workshops/{id})
        const res = await fetch(`${API_BASE}/workshops/${id}`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          const j = await res.json().catch(() => null);
          throw new Error(j?.error || `No se pudo cargar el taller ${id}`);
        }

        const data = await res.json();
        if (!cancelled) {
          // aceptar tanto { workshop: {...} } como el objeto plano
          const w = (data?.workshop ?? data) as WorkshopLite;
          setWorkshop(w);
        }
      } catch (e: any) {
        if (!cancelled) setWsError(e?.message || "Error cargando taller");
      } finally {
        if (!cancelled) setWsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const available = useMemo(
    () => (typeof workshop?.available_inspections === "number" ? workshop.available_inspections! : null),
    [workshop]
  );


  const newDisabled = useMemo(
    () => creating || wsLoading || available === 0,
    [creating, wsLoading, available]
  );

  const handleCreateApplication = async () => {
    // doble guard por si alguien intenta forzar el click
    if (available === 0) {
      alert("No tenés inspecciones disponibles para iniciar una nueva revisión");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch(`${API_BASE}/applications/applications`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workshop_id: Number(id) }),
      });

      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        throw new Error(data?.error || "No se pudo crear el trámite");
      }
      if (!data.application_id) throw new Error("No se recibió un ID válido");

      router.push(`/dashboard/${id}/applications/create-applications/${data.application_id}`);
    } catch (error: any) {
      console.error("Error al crear la aplicación:", error);
      alert(error?.message || "Hubo un error al crear el trámite, intentá de nuevo");
    } finally {
      setCreating(false);
    }
  };

  const options = [
    {
      key: "new",
      icon: <CircleFadingPlus size={42} strokeWidth={2.5} className="text-[#0040B8]" />,
      title: "Nueva Revisión",
      description:
        available === 0
          ? "Sin inspecciones disponibles, contactá al administrador"
          : "Iniciar una nueva revisión desde cero",
      disabled: newDisabled,
      handleOnClick: handleCreateApplication,
    },
    {
      key: "continue",
      icon: <RefreshCw size={42} strokeWidth={2.5} className="text-[#0040B8]" />,
      title: "Continuar Revisión",
      description: "Continuar con una revisión existente",
      disabled: false,
      handleOnClick: () => {
        alert("Funcionalidad en construcción");
      },
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 my-6 sm:my-8">
      <div className="text-center sm:text-left">
        <h3 className="text-lg sm:text-xl lg:text-2xl font-medium text-gray-900 mb-2">
          Seleccione el tipo de revisión
        </h3>
        <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto sm:mx-0">
          Elija si desea iniciar una nueva revisión o continuar con una existente.
        </p>
        {!wsLoading && wsError && (
          <p className="mt-3 text-sm text-rose-700">
            {wsError}
          </p>
        )}
        {!wsLoading && available !== null && (
          <p className="mt-3 text-sm text-gray-600">
            Inspecciones disponibles: <strong>{available}</strong>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mx-auto sm:mx-0">
        {options.map((option) => (
          <button
            key={option.key}
            onClick={option.handleOnClick}
            disabled={option.disabled}
            className={[
              "flex flex-col cursor-pointer items-center justify-center border rounded-lg p-4 sm:p-6 lg:p-8 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0040B8] focus:ring-opacity-50 min-h-[140px] sm:min-h-[160px]",
              option.disabled
                ? "opacity-50 cursor-not-allowed border-gray-200"
                : "hover:border-[#0040B8] border-[#0040B8]/50 hover:shadow-lg",
            ].join(" ")}
            title={
              option.key === "new" && available === 0
                ? "No tenés inspecciones disponibles para crear una nueva revisión"
                : undefined
            }
          >
            <div className="mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                {option.icon}
              </div>
            </div>
            <h4 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
              {option.title}
            </h4>
            <p className="text-xs sm:text-sm text-gray-500 text-center leading-relaxed px-2">
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
