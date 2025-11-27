'use client'
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { CarType, PersonType } from "@/app/types";
import renderVehicle from "@/components/VehicleTable";
import renderPerson from "@/components/PersonTable";
import renderDocument from "@/components/DocumentCard";
import { Car, ChevronRight, Clock, CheckCircle2, XCircle, Plus, FileText } from "lucide-react";
import clsx from "clsx";
import VehicleDocsDropzone, { type ExistingDoc as CarExistingDoc } from "@/components/VehicleDocsDropzone";
import Dropzone, { type ExistingDoc as InspDoc } from "@/components/Dropzone";

type Doc = {
  id: number;
  file_name: string;
  file_url: string;
  size_bytes?: number;
  mime_type?: string;
  role?: "owner" | "driver" | "car" | "generic";
  created_at?: string;
  type?: string;
};

type View = "main" | "persons" | "vehicle" | "documents";

export default function FileDetailPage() {
  const { id, applicationId } = useParams();
  const router = useRouter();
  const [car, setCar] = useState<CarType | null>(null);
  const [owner, setOwner] = useState<PersonType | null>(null);
  const [driver, setDriver] = useState<PersonType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allDocs, setAllDocs] = useState<Doc[]>([]);
  const [ownerDocs, setOwnerDocs] = useState<Doc[]>([]);
  const [driverDocs, setDriverDocs] = useState<Doc[]>([]);
  const [carDocs, setCarDocs] = useState<Doc[]>([]);
  const [view, setView] = useState<View>("main");
  const [status, setStatus] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);
  const [result2, setResult2] = useState<string | null>(null);
  const [inspection1Date, setInspection1Date] = useState<string | null>(null);
  const [inspection2Date, setInspection2Date] = useState<string | null>(null);
  const [pendingCarDocs, setPendingCarDocs] = useState<File[]>([]);
  const [pendingTechDocs, setPendingTechDocs] = useState<File[]>([]);
  const [techDocs, setTechDocs] = useState<InspDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [dropzoneResetToken, setDropzoneResetToken] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/applications/${applicationId}/data`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text();
          setError("No se pudo cargar la información del legajo");
          console.error("Error al traer la aplicación:", text);
          return;
        }

        const data = await res.json();
        setCar(data.car || null);
        setOwner(data.owner || null);

        if (data.owner?.id && data.driver?.id && data.owner.id === data.driver.id) {
          setDriver(null);
        } else {
          setDriver(data.driver || null);
        }

        const byRole = data.documents_by_role || {};
        const allDocuments: Doc[] = data.documents || [];

        setAllDocs(allDocuments);
        setOwnerDocs(byRole.owner || []);
        setDriverDocs(byRole.driver || []);
        setCarDocs(byRole.car || []);
        
        // Filtrar documentos de revisión técnica (generic o sin role específico)
        const techDocuments = allDocuments.filter(d => d.role === "generic" || !d.role || (d.role !== "owner" && d.role !== "driver" && d.role !== "car"));
        setTechDocs(techDocuments.map(d => ({
          id: d.id,
          file_name: d.file_name,
          file_url: d.file_url,
          size_bytes: d.size_bytes,
          mime_type: d.mime_type,
          created_at: d.created_at,
        })));

        // Fetch application status and date
        const appRes = await fetch(`/api/applications/get-applications/${applicationId}`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });

        if (appRes.ok) {
          const appData = await appRes.json();
          setStatus(appData.status || "Pendiente");
          setResult(appData.result || null);
          setResult2(appData.result_2 || null);
          
          // Formatear fecha de creación de la aplicación
          if (appData.date) {
            const dateObj = new Date(appData.date);
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            setDate(`${day}/${month}/${year} ${hours}:${minutes} hs`);
          }
          
          // Formatear fecha de creación de la primera inspección
          if (appData.inspection_1_date) {
            const dateObj = new Date(appData.inspection_1_date);
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            setInspection1Date(`${day}/${month}/${year} ${hours}:${minutes} hs`);
          }
          
          // Formatear fecha de creación de la segunda inspección
          if (appData.inspection_2_date) {
            const dateObj = new Date(appData.inspection_2_date);
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            setInspection2Date(`${day}/${month}/${year} ${hours}:${minutes} hs`);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Error al cargar los datos del legajo");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [applicationId]);

  const showDriver = Boolean(driver);

  function getStatusConfig(status: string) {
    switch (status) {
      case "Pendiente":
        return {
          bg: "bg-yellow-50",
          text: "text-yellow-700",
          icon: Clock,
          iconColor: "text-yellow-600"
        };
      case "Completado":
        return {
          bg: "bg-green-50",
          text: "text-green-700",
          icon: CheckCircle2,
          iconColor: "text-green-600"
        };
      case "Cancelado":
        return {
          bg: "bg-red-50",
          text: "text-red-700",
          icon: XCircle,
          iconColor: "text-red-600"
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          icon: Clock,
          iconColor: "text-gray-600"
        };
    }
  }

  function getResultConfig(result: string | null) {
    if (!result) {
      return {
        bg: "bg-gray-50",
        text: "text-gray-700",
        icon: Clock,
        iconColor: "text-gray-600",
        label: "Pendiente"
      };
    }
    
    switch (result) {
      case "Apto":
        return {
          bg: "bg-blue-50",
          text: "text-blue-700",
          icon: CheckCircle2,
          iconColor: "text-blue-600",
          label: "Apto"
        };
      case "Condicional":
        return {
          bg: "bg-amber-50",
          text: "text-amber-700",
          icon: Clock,
          iconColor: "text-amber-600",
          label: "Condicional"
        };
      case "Rechazado":
        return {
          bg: "bg-gray-100",
          text: "text-black",
          icon: XCircle,
          iconColor: "text-black",
          label: "Rechazado"
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          icon: Clock,
          iconColor: "text-gray-600",
          label: result
        };
    }
  }

  const deleteCarDoc = useCallback(async (docId: number) => {
    try {
      const res = await fetch(`/api/docs/applications/${applicationId}/documents/${docId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Error al eliminar documento");
      }
      // Refrescar documentos
      const dataRes = await fetch(`/api/applications/${applicationId}/data`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (dataRes.ok) {
        const data = await dataRes.json();
        const byRole = data.documents_by_role || {};
        setCarDocs(byRole.car || []);
        setAllDocs(data.documents || []);
      }
    } catch (err: any) {
      console.error("Error deleting car doc:", err);
      setError(err.message || "Error al eliminar documento");
    }
  }, [applicationId]);

  const deleteTechDoc = useCallback(async (docId: number) => {
    try {
      const res = await fetch(`/api/docs/applications/${applicationId}/documents/${docId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Error al eliminar documento");
      }
      // Refrescar documentos
      const dataRes = await fetch(`/api/applications/${applicationId}/data`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (dataRes.ok) {
        const data = await dataRes.json();
        const allDocuments: Doc[] = data.documents || [];
        setAllDocs(allDocuments);
        const techDocuments = allDocuments.filter(d => d.role === "generic" || !d.role || (d.role !== "owner" && d.role !== "driver" && d.role !== "car"));
        setTechDocs(techDocuments.map(d => ({
          id: d.id,
          file_name: d.file_name,
          file_url: d.file_url,
          size_bytes: d.size_bytes,
          mime_type: d.mime_type,
          created_at: d.created_at,
        })));
      }
    } catch (err: any) {
      console.error("Error deleting tech doc:", err);
      setError(err.message || "Error al eliminar documento");
    }
  }, [applicationId]);

  const handlePendingCarDocsChange = useCallback((files: File[]) => {
    setPendingCarDocs(files);
  }, []);

  const handlePendingTechDocsChange = useCallback((files: File[]) => {
    setPendingTechDocs(files);
  }, []);

  // Mapear documentos de car a formato CarExistingDoc (debe estar fuera de condicionales)
  const carDocsForDropzone: CarExistingDoc[] = useMemo(() => {
    return carDocs.map(doc => ({
      id: doc.id,
      file_name: doc.file_name,
      file_url: doc.file_url,
      size_bytes: doc.size_bytes,
      mime_type: doc.mime_type,
      created_at: doc.created_at,
      type: doc.type as any,
    }));
  }, [carDocs]);

  const uploadDocuments = async () => {
    if (pendingCarDocs.length === 0 && pendingTechDocs.length === 0) {
      setUploadMessage("No hay archivos para subir");
      setTimeout(() => setUploadMessage(null), 2000);
      return;
    }

    setUploading(true);
    setUploadMessage(null);
    setError(null);

    try {
      // Subir documentos de vehículo (sin tipos)
      if (pendingCarDocs.length > 0) {
        const form = new FormData();
        pendingCarDocs.forEach(f => form.append("files", f, f.name));
        form.append("role", "car");

        const carRes = await fetch(`/api/docs/applications/${applicationId}/documents`, {
          method: "POST",
          credentials: "include",
          body: form,
        });

        if (!carRes.ok) {
          const err = await carRes.json().catch(() => ({}));
          throw new Error(err?.error || "Error subiendo documentos del vehículo");
        }
      }

      // Subir documentos de revisión técnica
      if (pendingTechDocs.length > 0) {
        const form = new FormData();
        pendingTechDocs.forEach(f => form.append("files", f, f.name));
        form.append("role", "generic");

        const techRes = await fetch(`/api/docs/applications/${applicationId}/documents`, {
          method: "POST",
          credentials: "include",
          body: form,
        });

        if (!techRes.ok) {
          const err = await techRes.json().catch(() => ({}));
          throw new Error(err?.error || "Error subiendo documentos de revisión técnica");
        }
      }

      // Refrescar documentos
      const dataRes = await fetch(`/api/applications/${applicationId}/data`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (dataRes.ok) {
        const data = await dataRes.json();
        const byRole = data.documents_by_role || {};
        const allDocuments: Doc[] = data.documents || [];
        setAllDocs(allDocuments);
        setCarDocs(byRole.car || []);
        const techDocuments = allDocuments.filter(d => d.role === "generic" || !d.role || (d.role !== "owner" && d.role !== "driver" && d.role !== "car"));
        setTechDocs(techDocuments.map(d => ({
          id: d.id,
          file_name: d.file_name,
          file_url: d.file_url,
          size_bytes: d.size_bytes,
          mime_type: d.mime_type,
          created_at: d.created_at,
        })));
      }

      setPendingCarDocs([]);
      setPendingTechDocs([]);
      setDropzoneResetToken((prev) => prev + 1);
      setUploadMessage("Documentos subidos correctamente");
      setTimeout(() => setUploadMessage(null), 3000);
    } catch (err: any) {
      console.error("Error uploading documents:", err);
      setError(err.message || "Error al subir documentos");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-[#0040B8] mx-auto mb-3 sm:mb-4"></div>
          <p className="text-xs sm:text-sm text-gray-500">Cargando información del legajo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full py-3 sm:py-6">
        <div className="max-w-8xl mx-auto px-1 sm:px-2 md:px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg sm:rounded-[14px] p-4 sm:p-6 text-center">
            <p className="text-xs sm:text-sm text-red-700 mb-3 sm:mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#0040B8] text-white text-xs sm:text-sm rounded-[4px] hover:bg-[#0035A0]"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "persons") {
    return (
      <div className="min-h-full py-3 sm:py-4 md:py-6">
        <div className="max-w-8xl mx-auto px-1 sm:px-2 md:px-4">
          {/* Breadcrumb */}
          <article className="flex items-center text-xs sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-4 md:mb-6">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-gray-600">Inicio</span>
              <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
              <span className="text-[#0040B8] cursor-pointer" onClick={() => router.push(`/dashboard/${id}/files`)}>
                Legajos
              </span>
              <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
              <span className="text-[#0040B8] cursor-pointer" onClick={() => setView("main")}>
                Detalle
              </span>
              <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
              <span className="text-[#0040B8] font-medium">Datos del titular y conductor</span>
            </div>
          </article>

          <div className={`grid gap-3 sm:gap-4 md:gap-6 ${showDriver ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
            {/* Titular */}
            <div className="bg-white rounded-lg sm:rounded-[14px] border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-50 to-green-100 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg sm:rounded-[14px] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base md:text-md text-gray-900">Datos del titular</h2>
                    <p className="text-xs sm:text-sm text-gray-600">Información del titular del vehículo</p>
                  </div>
                </div>
              </div>
              <div className="p-3 sm:p-4 md:p-6">
                {owner ? (
                  renderPerson(owner)
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <p className="text-gray-500">No hay información del titular</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Conductor (si es distinto) */}
            {showDriver && (
              <div className="bg-white rounded-lg sm:rounded-[14px] border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg sm:rounded-[14px] flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base md:text-md text-gray-900">Datos del conductor</h2>
                      <p className="text-xs sm:text-sm text-gray-600">Información del conductor del vehículo</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 sm:p-4 md:p-6">
                  {renderPerson(driver!)} 
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="mt-4 sm:mt-6 flex justify-center">
          <button
              onClick={() => setView("main")}
              className="w-full sm:w-auto px-4 py-2 sm:py-2.5 border border-[#0040B8] rounded-[4px] text-xs sm:text-sm text-[#0040B8] hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <ChevronRight size={14} className="sm:w-4 sm:h-4 rotate-180" />
            Volver
          </button>
        </div>
        </div>
      </div>
    );
  }

  if (view === "vehicle") {
    return (
      <div className="min-h-full py-3 sm:py-4 md:py-6">
        <div className="max-w-8xl mx-auto px-1 sm:px-2 md:px-4">
          {/* Breadcrumb */}
          <article className="flex items-center text-xs sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-4 md:mb-6">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-gray-600">Inicio</span>
              <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
              <span className="text-[#0040B8] cursor-pointer" onClick={() => router.push(`/dashboard/${id}/files`)}>
                Legajos
              </span>
              <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
              <span className="text-[#0040B8] cursor-pointer" onClick={() => setView("main")}>
                Detalle
              </span>
              <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
              <span className="text-[#0040B8] font-medium">Datos del vehículo</span>
            </div>
          </article>

          <div className="bg-white rounded-lg sm:rounded-[14px] border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg sm:rounded-[14px] flex items-center justify-center flex-shrink-0">
                  <Car className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" size={20} strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base md:text-md text-gray-900">Datos del vehículo</h2>
                  <p className="text-xs sm:text-sm text-gray-600">Información técnica del vehículo</p>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 md:p-6">
              {car ? (
                renderVehicle(car, carDocs)
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-gray-500">No hay información del vehículo</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="mt-4 sm:mt-6 flex justify-center">
          <button
              onClick={() => setView("main")}
              className="w-full sm:w-auto px-4 py-2 sm:py-2.5 border border-[#0040B8] rounded-[4px] text-xs sm:text-sm text-[#0040B8] hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <ChevronRight size={14} className="sm:w-4 sm:h-4 rotate-180" />
            Volver
          </button>
        </div>
        </div>
      </div>
    );
  }

  if (view === "documents") {
    return (
      <div className="min-h-full py-3 sm:py-4 md:py-6">
        <div className="max-w-8xl mx-auto px-1 sm:px-2 md:px-4">
          {/* Breadcrumb */}
          <article className="flex items-center text-xs sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-4 md:mb-6">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-gray-600">Inicio</span>
              <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
              <span className="text-[#0040B8] cursor-pointer" onClick={() => router.push(`/dashboard/${id}/files`)}>
                Legajos
              </span>
              <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
              <span className="text-[#0040B8] cursor-pointer" onClick={() => setView("main")}>
                Detalle
              </span>
              <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
              <span className="text-[#0040B8] font-medium">Documentos</span>
            </div>
          </article>

          {/* Documentación del vehículo */}
          <div className="bg-white rounded-lg sm:rounded-[14px] shadow-sm border border-gray-200 overflow-hidden mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg sm:rounded-[14px] flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base md:text-md text-gray-900">Documentación del vehículo</h3>
              </div>
            </div>
            <div className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
              <VehicleDocsDropzone
                existing={carDocsForDropzone}
                mode="view"
              />
            </div>
          </div>

          {/* Archivos de revisión técnica - ahora dentro de cada ficha técnica */}
          <div className="bg-white rounded-lg sm:rounded-[14px] shadow-sm border border-gray-200 overflow-hidden mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg sm:rounded-[14px] flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm sm:text-base md:text-md text-gray-900">Archivos de revisión técnica</h3>
              </div>
            </div>
            <div className="p-3 sm:p-4 md:p-6 space-y-2">
              <p className="text-xs sm:text-sm text-gray-700">
                Los documentos de revisión técnica se encuentran dentro de cada ficha técnica.
              </p>
              <div className="text-xs sm:text-sm">
                <a
                  className="text-[#0040B8] hover:underline"
                  href={`/dashboard/${id}/files/${applicationId}/inspection`}
                >
                  Ir a ficha técnica primera revisión
                </a>
              </div>
              {result2 && (
                <div className="text-xs sm:text-sm">
                  <a
                    className="text-[#0040B8] hover:underline"
                    href={`/dashboard/${id}/files/${applicationId}/inspection?is_second=true`}
                  >
                    Ir a ficha técnica segunda revisión
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Certificado Revisión Técnica */}
          <div className="bg-white rounded-lg sm:rounded-[14px] shadow-sm border border-gray-200 overflow-hidden mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg sm:rounded-[14px] flex items-center justify-center flex-shrink-0">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                </div>
                <h3 className="text-sm sm:text-base md:text-md text-gray-900">Certificado Revisión Técnica</h3>
              </div>
            </div>
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <p className="text-xs sm:text-sm text-gray-700">Descargá el certificado de la primera revisión</p>
                <a
                  href={`https://uedevplogwlaueyuofft.supabase.co/storage/v1/object/public/certificados/certificados/${applicationId}/certificado.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-[#0040B8] text-white text-xs sm:text-sm rounded hover:bg-[#0035A0] text-center"
                >
                  Descargar CRT 1ra revisión
                </a>
              </div>

              {result2 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <p className="text-xs sm:text-sm text-gray-700">Descargá el certificado de la segunda revisión</p>
                  <a
                    href={`https://uedevplogwlaueyuofft.supabase.co/storage/v1/object/public/certificados/certificados/${applicationId}/certificado_2.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-[#0040B8] text-white text-xs sm:text-sm rounded hover:bg-[#0035A0] text-center"
                  >
                    Descargar CRT 2da revisión
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Mensajes de estado */}
          {uploadMessage && (
            <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-[4px] text-green-700 text-xs sm:text-sm text-center">
              {uploadMessage}
            </div>
          )}
          {error && view === "documents" && (
            <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-[4px] text-red-700 text-xs sm:text-sm text-center">
              {error}
            </div>
          )}

          {/* Botón de subir */}
          {(pendingCarDocs.length > 0 || pendingTechDocs.length > 0) && (
            <div className="mb-4 sm:mb-6 flex justify-center">
              <button
                onClick={uploadDocuments}
                disabled={uploading}
                className={clsx(
                  "w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 rounded-[4px] text-xs sm:text-sm font-medium transition-colors",
                  uploading
                    ? "bg-blue-300 text-white cursor-not-allowed"
                    : "bg-[#0040B8] text-white hover:bg-[#0035A0]"
                )}
              >
                {uploading ? "Subiendo..." : "Subir documentos"}
              </button>
            </div>
          )}

          {/* Bottom Navigation */}
          <div className="mt-4 sm:mt-6 flex justify-center">
          <button
              onClick={() => setView("main")}
              className="w-full sm:w-auto px-4 py-2 sm:py-2.5 border border-[#0040B8] rounded-[4px] text-xs sm:text-sm text-[#0040B8] hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <ChevronRight size={14} className="sm:w-4 sm:h-4 rotate-180" />
            Volver
          </button>
        </div>

        </div>
      </div>
    );
  }

  // Main view
  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-full py-3 sm:py-4 md:py-6">
      <div className="max-w-8xl mx-auto px-1 sm:px-2 md:px-4">
        {/* Breadcrumb */}
        <article className="flex items-center justify-between text-xs sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-4 md:mb-6">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-gray-600">Inicio</span>
            <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
            <span className="text-[#0040B8] cursor-pointer" onClick={() => router.push(`/dashboard/${id}/files`)}>
              Legajos
            </span>
            <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
            <span className="text-[#0040B8] font-medium">Detalle</span>
          </div>
        </article>

        {/* Main Cards */}
        <div className="space-y-3 sm:space-y-4">
          {/* Dominio buscado */}
          <div className="bg-white rounded-lg sm:rounded-[14px] border border-gray-200 p-3 sm:p-4 md:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div>
                <h2 className="text-sm sm:text-base md:text-md font-bold text-gray-900 mb-1">Dominio buscado:</h2>
                <p className="text-xs sm:text-sm text-gray-500">Aquí aparece el historial del legajo buscado</p>
              </div>
              <div className="border border-gray-300 rounded px-4 sm:px-6 py-1.5 sm:py-2 bg-gray-50 w-full sm:w-auto text-center sm:text-left">
                <span className="text-sm sm:text-base md:text-md font-bold text-gray-900">{car?.license_plate || "-"}</span>
              </div>
            </div>
          </div>

          {/* Datos del titular y del conductor */}
          <div className="bg-white rounded-lg sm:rounded-[14px] border border-gray-200 p-3 sm:p-4 md:p-5 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setView("persons")}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base md:text-md text-gray-900 mb-1">Datos del titular y del conductor</h2>
                <p className="text-xs sm:text-sm text-gray-500">Datos no modificable, solo visualización</p>
              </div>
              <ChevronRight size={20} className="sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
            </div>
          </div>

          {/* Datos del vehículo */}
          <div className="bg-white rounded-lg sm:rounded-[14px] border border-gray-200 p-3 sm:p-4 md:p-5 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setView("vehicle")}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base md:text-md text-gray-900 mb-1">Datos del vehículo</h2>
                <p className="text-xs sm:text-sm text-gray-500">Datos no modificable, solo visualización</p>
              </div>
              <ChevronRight size={20} className="sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
            </div>
          </div>

          {/* Ficha técnica */}
          {(() => {
            const resultConfig = getResultConfig(result);
            const ResultIcon = resultConfig.icon;
            return (
          <div className="bg-white rounded-lg sm:rounded-[14px] border border-gray-200 p-3 sm:p-4 md:p-5 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => router.push(`/dashboard/${id}/files/${applicationId}/inspection`)}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base md:text-md text-gray-900 mb-1">Ficha técnica primera revisión</h2>
                <p className="text-xs sm:text-sm text-gray-500">Ficha técnica no modificable, solo visualización</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 justify-between sm:justify-end w-full sm:w-auto">
                <div className="text-left sm:text-right">
                      <p className="text-xs sm:text-sm text-gray-600">Fecha de creación:<br/>{inspection1Date || "-"}</p>
                    </div>
                    <span className={clsx("inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium", resultConfig.bg, resultConfig.text)}>
                      <ResultIcon size={14} className={clsx("sm:w-4 sm:h-4", resultConfig.iconColor)} />
                      {resultConfig.label}
                    </span>
                    <ChevronRight size={20} className="sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Ficha técnica segunda revisión - Solo se muestra si result_2 no es null */}
          {result2 && (() => {
            const result2Config = getResultConfig(result2);
            const Result2Icon = result2Config.icon;
            return (
              <div className="bg-white rounded-lg sm:rounded-[14px] border border-gray-200 p-3 sm:p-4 md:p-5 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => router.push(`/dashboard/${id}/files/${applicationId}/inspection?is_second=true`)}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm sm:text-base md:text-md text-gray-900 mb-1">Ficha técnica segunda revisión</h2>
                    <p className="text-xs sm:text-sm text-gray-500">Ficha técnica de segunda revisión, solo visualización</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 justify-between sm:justify-end w-full sm:w-auto">
                    <div className="text-left sm:text-right">
                      <p className="text-xs sm:text-sm text-gray-600">Fecha de creación:<br/>{inspection2Date || "-"}</p>
                </div>
                    <span className={clsx("inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium", result2Config.bg, result2Config.text)}>
                      <Result2Icon size={14} className={clsx("sm:w-4 sm:h-4", result2Config.iconColor)} />
                      {result2Config.label}
                </span>
                <ChevronRight size={20} className="sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          </div>
            );
          })()}

          {/* Agregar documentos */}
          <div className="bg-white rounded-lg sm:rounded-[14px] border border-gray-200 p-3 sm:p-4 md:p-5 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setView("documents")}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base md:text-md text-gray-900 mb-1">Ver documentos</h2>
                <p className="text-xs sm:text-sm text-gray-500">Aquí podrás ver los documentos adjuntos al legajo</p>
              </div>
              <ChevronRight size={20} className="sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
              </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-4 sm:mt-6 flex justify-center">
          <button
            onClick={() => router.push(`/dashboard/${id}/files`)}
            className="w-full sm:w-auto px-4 py-2 sm:py-2.5 border border-[#0040B8] rounded-[4px] text-xs sm:text-sm text-[#0040B8] hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <ChevronRight size={14} className="sm:w-4 sm:h-4 rotate-180" />
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
