

import { ChevronRight, ChevronLeft  } from "lucide-react"

export default function InspectionsPage() {

    return (
        <section className="w-full">
            <article className="flex items-center justify-between text-lg mb-6">
                <div className="flex items-center gap-1">
                <span>Home</span>
                <ChevronRight size={20} />
                <span className="text-[#0040B8]">Trámite</span>
                </div>
                <span className="text-md mr-4 text-black">Paso 1/3</span>
            </article>  

            <div>
                

            </div>
            <div className="flex gap-x-3 justify-center px-4 pt-8 pb-10">
                <button className="hover:bg-[#0040B8] hover:text-white duration-150 rounded-[4px] text-[#0040B8] border border-[#0040B8] bg-white flex items-center justify-center gap-2 py-2.5 px-7">
                <ChevronLeft size={18} />
                Volver
                </button>
                <button className="hover:bg-[#004DDD] hover:border-[#004DDD] border border-[#0040B8] duration-150 rounded-[4px] text-white bg-[#0040B8] flex items-center justify-center py-2.5 px-7">
                    Continuar
                </button>
            </div>
        </section>
    )
}