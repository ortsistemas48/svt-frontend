'use client'
import SelectApplicationType from "@/components/SelectApplicationType"
import { ChevronRight } from "lucide-react"
import InspectionsTable from "@/components/InspectionsTable"
import { useDashboard } from "@/context/DashboardContext"
import { useEffect, useState } from "react"

export default function InspectionsPage() {
  const { applicationErrors, setApplicationErrors } = useDashboard();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (applicationErrors.general) {
      setShowError(true);

      const timer = setTimeout(() => {
        setShowError(false);
        // limpiamos errores del estado global
        setApplicationErrors((prev: any) => ({ ...prev, general: null }));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [applicationErrors.general, setApplicationErrors]);

  return (
    <>
      <article className="flex items-center justify-between text-lg mb-4 px-4">
        <div className="flex items-center gap-1">
          <span>Inicio</span>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">Revisiones</span>
        </div>
      </article>

      {showError && applicationErrors.general && (
        <div className="border border-red-300 bg-red-50 text-red-700 text-sm rounded-md px-4 py-3">
          {applicationErrors.general}
        </div>
      )}

      <div>
        <SelectApplicationType />
      </div>
      <div className="mt-8">
        <InspectionsTable />
      </div>
    </>
  )
}
