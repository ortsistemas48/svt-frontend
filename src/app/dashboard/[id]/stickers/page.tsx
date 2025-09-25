import { ChevronRight, ShoppingCart, TicketPercent } from "lucide-react";
import Link from "next/link";
import StickerOrdersTable from '@/components/StickerOrdersTable'

export default async function BuyObleaPage() {

    return (
        <div className="">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                <article className="flex items-center justify-between text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
                    <div className="flex items-center gap-1">
                        <span className="text-gray-600">Inicio</span>
                        <ChevronRight size={16} className="sm:w-5 sm:h-5" />
                        <span className="text-[#0040B8] font-medium">Obleas</span>
                    </div>
                </article>
                <section className="bg-white rounded-[10px] border-gray-300 border p-6 px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
                    <div>
                        <h2 className="text-[#0040B8] text-base mb-0">Obleas</h2>
                        <p className="text-gray-400 text-sm mt-1">Aquí podrás asignar y ver todas tus obleas</p>
                    </div>
                    <div className="flex gap-4 mt-4 sm:mt-0">
                        <Link
                            href={``}
                            className="border border-[#0040B8] text-[#0040B8] bg-white hover:bg-[#f0f6ff] font-medium rounded px-4 py-3 text-sm flex items-center transition"
                            type="button"
                        >
                            <TicketPercent size={16} className="mr-2" />
                            Mis obleas
                        </Link>
                        <Link
                            href=""
                            className="bg-[#0040B8] hover:bg-[#003080] text-white font-medium rounded px-4 py-2 text-sm flex items-center transition"
                            type="button"
                        >
                            Asignar
                            <ChevronRight size={16} className="ml-2" />
                        </Link>
                    </div>

                </section>

                <div className="">
                    <StickerOrdersTable/>
                </div>


            </div>
        </div>
    )
}