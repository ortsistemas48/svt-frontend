

import { ChevronRight } from "lucide-react"
import DriverForm from "@/components/DriverForm";
import OwnerForm from "@/components/OwnerForm";
export default function InspectionsPage() {

    return (
        <section className="w-full">
            <article className="flex items-center gap-1 mb-6">
                <span>Home</span>
                <ChevronRight></ChevronRight>
                <span className="text-[#0040B8]">Inspecciones</span>

            </article>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-4">
                {/* Datos del titular */}
                <DriverForm />      
                {/* Datos del conductor */}
                <OwnerForm />   
            </div>
            <div className="flex gap-x-3 items-center px-4 mt-10">
                <div className="w-20 h-10 border-2 border-[#0040B8] bg-white flex items-center justify-center py-4 px-10">
                    Anterior
                </div>
                <div className="w-20 h-10 border-2 text-white bg-[#0040B8] flex items-center justify-center py-4 px-12">
                    Continuar
                </div>
            </div>


        </section>
    )
}