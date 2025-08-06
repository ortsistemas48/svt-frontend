'use client';

import { Search, SlidersHorizontal, RefreshCcw } from "lucide-react";

export default function UserInput () {
    const urlParams = new URLSearchParams(window.location.search);
    
    return (
        <div className="grid grid-cols-[500px_150px_170px] gap-x-3 mt-6">
                {/* Input con icono */}
                <div className="flex items-center border border-gray-300 rounded px-2 py-1 h-12">
                    <Search size={20} className="text-gray-500 mr-1" />
                    <input
                        type="text"
                        onChange={(e) => {
                            urlParams.set("search", e.target.value);
                            window.history.replaceState({}, '', `?${urlParams.toString()}`);
                        }}
                        placeholder="Busca tus usuarios por nombre, email, DNI o telefono"
                        className="flex-1 text-sm focus:outline-none"
                    />
                </div>

                {/* Botón */}
                <button className="bg-[#0040B8] hover:bg-[#0035A0] text-white px-3 py-2 rounded flex items-center justify-center gap-x-2  ">

                    <SlidersHorizontal size={20} />
                    <span className="text-sm ">
                        Filtrar
                    </span>

                </button>
                <button className="bg-white border-2 border-[#0040B8] text-white px-3 py-2 rounded flex items-center justify-center gap-x-2 ">

                    <RefreshCcw size={20} className="text-[#0040B8]" />
                    <span className="text-[#0040B8] text-sm">

                        Actualizar
                    </span>
                </button>
            </div>
    )
}



