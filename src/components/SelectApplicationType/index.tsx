'use client';
import { useRouter, useParams  } from "next/navigation";
import { useState } from "react";
import { RefreshCw, CircleFadingPlus } from "lucide-react";

export default function SelectApplicationType() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { id } = useParams();

  const handleCreateApplication = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/applications`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workshop_id: id })  // ← acá mandás el ID
      });

      const data = await res.json();

      if (!data.application_id) throw new Error("No se recibió un ID válido");

      router.push(`/dashboard/${id}/applications/create-applications/${data.application_id}`);
    } catch (error) {
      console.error("Error al crear la aplicación:", error);
      alert("Hubo un error al crear el trámite. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const options = [
    {
      key: "new",
      icon: <CircleFadingPlus size={42} strokeWidth={2.5} className="text-[#0040B8]" />,
      title: "Nueva Revisión",
      description: "Iniciar una nueva revisión desde cero",
      handleOnClick: handleCreateApplication,
    },
    {
      key: "continue",
      icon: <RefreshCw size={42} strokeWidth={2.5} className="text-[#0040B8]" />,
      title: "Continuar Revisión",
      description: "Continuar con una revisión existente",
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mx-auto sm:mx-0">
        {options.map((option) => (
          <button
            key={option.key}
            onClick={option.handleOnClick}
            disabled={loading}
            className="flex flex-col cursor-pointer items-center justify-center border rounded-lg p-4 sm:p-6 lg:p-8 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#0040B8] focus:ring-opacity-50 border-gray-300 hover:border-[#0040B8] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-h-[140px] sm:min-h-[160px]"
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
