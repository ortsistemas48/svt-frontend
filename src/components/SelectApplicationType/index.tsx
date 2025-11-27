'use client';
import { useRouter, useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RefreshCw, CircleFadingPlus } from "lucide-react";
import Link from "next/link";
import { handleCreateApplication } from "@/utils";
type WorkshopLite = {
  id: number;
  name?: string;
  available_inspections?: number | null;
};

export default function SelectApplicationType() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [creating, setCreating] = useState(false);
  const [wsLoading, setWsLoading] = useState(true);
  const [wsError, setWsError] = useState<string | null>(null);
  const [workshop, setWorkshop] = useState<WorkshopLite | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setWsLoading(true);
        setWsError(null);

        const res = await fetch(`/api/workshops/${id}`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          const j = await res.json().catch(() => null);
          throw new Error(j?.error || `No se pudo cargar el taller ${id}`);
        }

        const data = await res.json();
        if (!cancelled) {
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

  

  const options = [
    {
      key: "new",
      iconComponent: CircleFadingPlus,
      title: "Nueva Revisión",
      description:
        available === 0
          ? "Sin inspecciones disponibles, contactá al administrador"
          : "Iniciar una nueva revisión desde cero",
      disabled: newDisabled,
      handleOnClick: () => handleCreateApplication(available, id, setCreating, router),
    },
    {
      key: "continue",
      iconComponent: RefreshCw,
      title: "Continuar Revisión",
      description: "Continuar con una revisión existente",
      disabled: false,
      handleOnClick: () => {
        router.push(`/dashboard/${id}/applications/continue-application`);
      },
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 my-4 sm:my-6 md:my-8">
      <div className="text-center sm:text-left">
        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium text-gray-900 mb-1 sm:mb-2">
          Seleccione el tipo de revisión
        </h3>
        <p className="text-xs sm:text-sm md:text-base text-gray-500 max-w-2xl mx-auto sm:mx-0">
          Elija si desea iniciar una nueva revisión o continuar con una existente.
        </p>
        {!wsLoading && wsError && (
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-rose-700">
            {wsError}
          </p>
        )}

      {!wsLoading && available !== null && (
        <div className="mt-2 sm:mt-3 text-xs sm:text-sm">
          <p className="text-gray-600">
            Inspecciones disponibles: <strong>{available}</strong>
          </p>

          {available <= 0 ? (
            <p className="mt-1 text-red-700">
              No hay inspecciones disponibles,{" "}
              <Link href={`/dashboard/${id}/payment`} className="font-medium underline">
                comprá más aquí
              </Link>.
            </p>
          ) : available < 75 ? (
            <p className="mt-1 text-amber-700">
              Quedan pocas inspecciones,{" "}
              <Link href={`/dashboard/${id}/payment`} className="font-medium underline">
                comprá más aquí
              </Link>.
            </p>
          ) : null}
        </div>
      )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mx-auto sm:mx-0">
        {options.map((option) => {
          const IconComponent = option.iconComponent;
          return (
            <button
              key={option.key}
              onClick={option.handleOnClick}
              disabled={option.disabled}
              className={[
                "flex flex-col cursor-pointer items-center justify-center border rounded-[4px] p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0040B8] focus:ring-opacity-50 min-h-[120px] sm:min-h-[140px] md:min-h-[160px]",
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
              <div className="mb-2 sm:mb-3 md:mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-[#0040B8]">
                  <IconComponent className="w-full h-full" strokeWidth={2.5} />
                </div>
              </div>
              <h4 className="text-xs sm:text-sm md:text-base lg:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
                {option.title}
              </h4>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 text-center leading-relaxed px-1 sm:px-2">
                {option.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
