import { ChevronLeft, MoveRight } from "lucide-react"
import Link from "next/link";
export default function SelectWorkshopPage() {

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-white font-sans rounded-lg">
            <section className="border-2 border-gray-200 p-3 rounded-xl min-w-[300px]">
                <h1 className="mx-2 my-4 font-bold">Selecciona el taller al que quieres ingresar</h1>
                <section className="flex flex-col gap-4 p-4 mt-4">
                    <article className="flex justify-between items-center border-2 border-[#0040B8] rounded-lg p-4 cursor-pointer">
                        <h3>Taller Duarte Quirós</h3>
                        <MoveRight size={20} />
                    </article>
                    <article className="flex justify-between items-center border-2 border-[#0040B8] rounded-lg p-4 cursor-pointer">
                        <h3>Taller Santa Ana</h3>
                        <MoveRight size={20} />
                    </article>
                </section>


                <article className="mt-4 flex justify-between items-center bg-[#0040B8] rounded-lg p-4 cursor-pointer">
                    <h3 className="mx-auto text-white">Añadir nuevo taller</h3>
                </article>

                <article className="flex mt-4 mb-2 justify-center items-center hover:underline">
                    <ChevronLeft size={18} />    
                    <Link href="/" className="font-thin text-sm ">Volver hacia atras </Link>
                    
                </article>
            </section>
        </main>
    )
}