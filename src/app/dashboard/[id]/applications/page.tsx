
import SelectApplicationType from "@/components/SelectApplicationType"
import { ChevronLeft, ChevronRight } from "lucide-react"
import InspectionsTable from "@/components/InspectionsTable"

export default function InspectionsPage() {

    return (
        <>
            <article className="flex items-center justify-between text-lg mb-6 px-4">
                <div className="flex items-center gap-1">
                    <span>Inicio</span>
                    <ChevronRight size={20} />
                    <span className="text-[#0040B8]">Trámite</span>
                </div>
            </article>

            <div>
                <SelectApplicationType />
            </div>
            <div className="mt-8">
                <InspectionsTable />
            </div>

        </>
    )
}