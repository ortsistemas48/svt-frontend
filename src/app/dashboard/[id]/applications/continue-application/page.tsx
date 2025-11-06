'use client';
import { ChevronRight, Search } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

type Application = {
  application_id: number;
  car: {
    license_plate: string;
    model: string;
    brand: string;
  } | null;
  owner: {
    first_name: string;
    last_name: string;
    dni: string;
  } | null;
  date: string;
  status: "Completado" | "En curso" | "Pendiente" | "A Inspeccionar" | "Emitir CRT" | "Segunda Inspección";
  result?: "Apto" | "Condicional" | "Rechazado";
  result_2?: "Apto" | "Condicional" | "Rechazado";
};

export default function ContinueApplicationPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [licensePlate, setLicensePlate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [foundApplication, setFoundApplication] = useState<Application | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleSearch = async () => {
        const plate = licensePlate.trim().toUpperCase().replace(/[-\s]/g, "");
        
        if (!plate) {
            setError("Por favor ingrese un dominio");
            return;
        }

        setError(null);
        setFoundApplication(null);
        setLoading(true);

        try {
            // Search for applications with this license plate
            const params = new URLSearchParams({
                q: plate,
                per_page: "100", // Get enough to find all applications for this vehicle
            });

            const res = await fetch(
                `/api/applications/workshop/${id}/full?${params.toString()}`,
                { credentials: "include" }
            );

            if (!res.ok) {
                throw new Error("Error al buscar revisiones");
            }

            const data = await res.json();
            const applications: Application[] = data.items ?? [];


            // Filter applications with 'Condicional' result, matching license plate, and NO result_2 yet
            const condicionalApps = applications.filter(
                (app) => 
                    app.result === "Condicional" && 
                    app.car?.license_plate?.toUpperCase().replace(/[-\s]/g, "") === plate &&
                    !app.result_2  // Exclude if second inspection already completed
            );
            if (condicionalApps.length === 0) {
                // Check if there ARE condicional apps but they all have result_2
                const alreadyInspected = applications.filter(
                    (app) => 
                        app.result === "Condicional" && 
                        app.car?.license_plate?.toUpperCase().replace(/[-\s]/g, "") === plate &&
                        app.result_2  // Has second inspection completed
                );
                
                if (alreadyInspected.length > 0) {
                    setError(`La revisión con dominio ${plate} ya completó su segunda inspección con resultado "${alreadyInspected[0].result_2}". No se permiten más inspecciones.`);
                } else {
                    setError(`No se encontraron revisiones con resultado "Condicional" pendientes de segunda inspección para el dominio ${plate}`);
                }
                return;
            }

            // Get the last (most recent) application
            const lastApplication = condicionalApps[0];
            setFoundApplication(lastApplication);

        } catch (err: any) {
            console.error(err);
            setError(err?.message || "Error al buscar la revisión");
        } finally {
            setLoading(false);
        }
    };

    const handleBeginInspection = async () => {
        if (!foundApplication) return;
        
        // Verify that the application has "Condicional" result before proceeding
        if (foundApplication.result !== "Condicional") {
            setError("Solo se pueden realizar segundas inspecciones para revisiones con resultado 'Condicional'");
            return;
        }

        // Check if second inspection already completed
        if (foundApplication.result_2) {
            setError(`Esta revisión ya completó su segunda inspección con resultado "${foundApplication.result_2}". No se permiten más inspecciones.`);
            return;
        }

        setActionLoading("inspection");
        setError(null);

        try {
            // Verify the application still has Condicional result and no result_2 before continuing
            const checkRes = await fetch(
                `/api/applications/get-applications/${foundApplication.application_id}`,
                { credentials: "include" }
            );

            if (!checkRes.ok) {
                throw new Error("Error al verificar la revisión");
            }

            const appData = await checkRes.json();
            
            if (appData.result !== "Condicional") {
                setError("Esta revisión ya no tiene resultado 'Condicional'. Por favor, busque nuevamente.");
                setActionLoading(null);
                return;
            }

            // Double-check that result_2 hasn't been filled since the search
            if (appData.result_2) {
                setError(`Esta revisión ya completó su segunda inspección con resultado "${appData.result_2}". Por favor, busque nuevamente.`);
                setActionLoading(null);
                return;
            }

            // Update the application status to "Segunda Inspección"
            const updateRes = await fetch(
                `/api/applications/${foundApplication.application_id}/secondInspection`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (!updateRes.ok) {
                throw new Error("Error al actualizar la revisión");
            }

            router.push(`/dashboard/${id}/inspections/${foundApplication.application_id}`);
        } catch (err: any) {
            console.error(err);
            setError(err?.message || "Error al iniciar la segunda inspección");
            setActionLoading(null);
        }
    };

    const handleSendToQueue = async () => {
        if (!foundApplication) return;
        
        setActionLoading("queue");
        setError(null);

        try {
            // Update the application status to "A Inspeccionar" to add it to the queue
            const res = await fetch(
                `/api/applications/${foundApplication.application_id}/secondInspection`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || "Error al enviar a la cola");
            }

            // Show success and redirect to dashboard
            router.push(`/dashboard/${id}/inspections-queue`);

        } catch (err: any) {
            console.error(err);
            setError(err?.message || "Error al enviar a la cola");
            setActionLoading(null);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const handleNewSearch = () => {
        setFoundApplication(null);
        setLicensePlate("");
        setError(null);
    };

    return (
        <div>
            <article className="flex items-center justify-between text-lg mb-6 px-4">
                <div className="flex items-center gap-1 flex-wrap">
                    <span>Inicio</span>
                    <ChevronRight size={20} />
                    <span className="text-[#0040B8]">Continuar Revisión</span>
                </div>
            </article>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {!foundApplication ? (
                    <>
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                                Continuar Revisión
                            </h2>
                            <p className="text-sm text-gray-600 mb-6">
                                Ingrese el dominio del vehículo para buscar revisiones con resultado "Condicional"
                            </p>

                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={licensePlate}
                                            onChange={(e) => {
                                                setLicensePlate(e.target.value.toUpperCase());
                                                setError(null);
                                            }}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Ej: ABC123 o AB123CD"
                                            disabled={loading}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0040B8] focus:border-transparent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed text-lg font-mono"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSearch}
                                        disabled={loading || !licensePlate.trim()}
                                        className="px-6 py-3 bg-[#0040B8] text-white rounded-lg hover:bg-[#0030A0] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium min-w-[120px]"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                <span>Buscando...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Search size={20} />
                                                <span>Buscar</span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-700">{error}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h3 className="text-sm font-semibold text-blue-900 mb-2">
                                ℹ️ Información
                            </h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Se buscará la última revisión con resultado "Condicional"</li>
                                <li>• El dominio puede ingresarse con o sin guiones</li>
                                <li>• Formatos válidos: ABC123, AB123CD</li>
                            </ul>
                        </div>
                    </>
                ) : (
                    <div className="space-y-6">
                        {/* New Search Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleNewSearch}
                                className="px-4 py-2 text-sm font-medium text-[#0040B8] bg-white border border-[#0040B8] rounded-lg hover:bg-[#0040B8] hover:text-white transition-all duration-200 shadow-sm"
                            >
                                ← Nueva búsqueda
                            </button>
                        </div>

                        {/* Application Details Card */}
                        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                            <div className="mb-4">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                                    ✓ Revisión Encontrada
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Revisión con resultado Condicional
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                        CRT #
                                    </p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {foundApplication.application_id}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                        Dominio
                                    </p>
                                    <p className="text-lg font-semibold text-gray-900 font-mono">
                                        {foundApplication.car?.license_plate || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                        Vehículo
                                    </p>
                                    <p className="text-lg font-medium text-gray-900">
                                        {foundApplication.car?.brand} {foundApplication.car?.model}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                        Titular
                                    </p>
                                    <p className="text-lg font-medium text-gray-900">
                                        {foundApplication.owner?.first_name} {foundApplication.owner?.last_name}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                        Fecha de Creación
                                    </p>
                                    <p className="text-lg font-medium text-gray-900">
                                        {foundApplication.date 
                                            ? new Date(foundApplication.date).toLocaleDateString("es-AR")
                                            : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                        Estado Actual
                                    </p>
                                    <p className="text-lg font-medium text-gray-900">
                                        {foundApplication.status}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                        Resultado
                                    </p>
                                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-sm font-semibold rounded-full">
                                        {foundApplication.result}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action Options */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                ¿Qué desea hacer?
                            </h3>
                            <p className="text-sm text-gray-600 mb-6">
                                Seleccione una de las siguientes opciones para continuar:
                            </p>

                            {error && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Begin Inspection Option */}
                                <button
                                    onClick={handleBeginInspection}
                                    disabled={actionLoading !== null || foundApplication.result !== "Condicional"}
                                    className="group relative flex flex-col items-center justify-center p-6 border-2 border-[#0040B8] rounded-lg hover:bg-[#0040B8] hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[180px]"
                                >
                                    {actionLoading === "inspection" ? (
                                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
                                    ) : (
                                        <>
                                            <div className="mb-4 p-3 rounded-full bg-[#0040B8] group-hover:bg-white transition-colors duration-200">
                                                <svg
                                                    className="w-8 h-8 text-white group-hover:text-[#0040B8] transition-colors duration-200"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                                    />
                                                </svg>
                                            </div>
                                            <h4 className="text-lg font-semibold mb-2 text-center">
                                                Comenzar Segunda Inspección
                                            </h4>
                                            <p className="text-sm text-center opacity-80">
                                                Continuar con el proceso de inspección inmediatamente
                                            </p>
                                        </>
                                    )}
                                </button>

                                {/* Send to Queue Option */}
                                <button
                                    onClick={handleSendToQueue}
                                    disabled={actionLoading !== null}
                                    className="group relative flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-lg hover:border-[#0040B8] hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[180px]"
                                >
                                    {actionLoading === "queue" ? (
                                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#0040B8] border-t-transparent"></div>
                                    ) : (
                                        <>
                                            <div className="mb-4 p-3 rounded-full bg-gray-200 group-hover:bg-[#0040B8] transition-colors duration-200">
                                                <svg
                                                    className="w-8 h-8 text-gray-600 group-hover:text-white transition-colors duration-200"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                                    />
                                                </svg>
                                            </div>
                                            <h4 className="text-lg font-semibold mb-2 text-center text-gray-900">
                                                Enviar a Cola
                                            </h4>
                                            <p className="text-sm text-center text-gray-600">
                                                Agregar a la cola de inspecciones pendientes
                                            </p>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}