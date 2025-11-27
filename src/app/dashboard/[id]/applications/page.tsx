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
    <div className="">
      <div className="max-w-8xl mx-auto px-0 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6">
        {/* Breadcrumb */}
        <article className="flex items-center justify-between text-xs sm:text-sm md:text-base lg:text-lg mb-2 sm:mb-4 md:mb-6 px-1 sm:px-0">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
            <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
            <span className="text-[#0040B8] font-medium">Revisiones</span>
          </div>
        </article>

        {/* Error Message */}
        {showError && applicationErrors.general && (
          <div className="border border-red-300 bg-red-50 text-red-700 text-xs sm:text-sm rounded-[4px] px-3 sm:px-4 py-2 sm:py-3 mb-3 sm:mb-4 md:mb-6 mx-1 sm:mx-0">
            {applicationErrors.general}
          </div>
        )}

        {/* Select Application Type */}
        <div className="mb-4 sm:mb-6 md:mb-8 px-1 sm:px-0">
          <SelectApplicationType />
        </div>

        {/* Inspections Table */}
        <div className="overflow-hidden">
          <InspectionsTable />
        </div>
      </div>
    </div>
  )
}
