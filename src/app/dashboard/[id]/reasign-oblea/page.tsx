import SearchPlateBar from "@/components/SeachPlateBar";
import { ChevronRight } from "lucide-react";

export default function ReasignObleaPage() {
    return (
        <div className="min-w-full">
            <article className="flex items-center justify-between text-lg mb-6 px-4">
                <div className="flex items-center gap-1">
                    <span>Inicio</span>
                    <ChevronRight size={20} />
                    <span className="text-[#0040B8]">Reasignación de Oblea</span>
                </div>
            </article>
            <div className="flex flex-col items-center gap-2">
                {/* Título */}
                <h2 className="text-3xl text-[#0040B8]">
                    Reasigna tus Obleas
                </h2>
                <p className=" text-gray-500 text-center">
                    Busca el dominio del auto para reasignar la oblea
                </p>
                <SearchPlateBar />
            </div>
        </div>
    );
}   