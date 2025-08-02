'use client';
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw, CircleFadingPlus } from "lucide-react";

export default function SelectApplicationType() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCreateApplication = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/applications/applications`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();

      if (!data.application_id) throw new Error("No se recibió un ID válido");

      router.push(`/dashboard/applications/create-applications/${data.application_id}`);
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
      description: "Iniciar una nueva revisión técnica desde cero",
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
    <div className="space-y-4 my-10">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Seleccione el tipo de revisión</h3>
        <p className="text-sm text-gray-500">
          Elija si desea iniciar una nueva revisión o continuar con una existente.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option) => (
          <button
            key={option.key}
            onClick={option.handleOnClick}
            disabled={loading}
            className="flex flex-col items-center justify-center border rounded-lg p-6 transition-all duration-200 focus:outline-none border-gray-300 hover:border-[#0040B8] hover:shadow-lg"
          >
            <div className="mb-3">{option.icon}</div>
            <h4 className="text-md font-medium text-gray-900">{option.title}</h4>
            <p className="text-sm text-gray-500 text-center">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
