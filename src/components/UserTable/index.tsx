'use client'
import { Eye, EllipsisVertical, RefreshCcw, Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function UserTable({ users } : { users: any[] }) {
    
    const [searchText, setSearchText] = useState("");

    const filteredUsers = users.filter((user: any) => {
        if (!searchText?.trim()) return true
        const query = searchText.toLowerCase();
        return (
            user.first_name.toLowerCase().includes(query) ||
            user.last_name.toLowerCase().includes(query) ||
            (user.dni ?? "").toLowerCase().includes(query) ||
            (user.phone ?? "").toLowerCase().includes(query) ||
            user.role.toLowerCase().includes(query)
        );
    });

    const router = useRouter();
    const handleRefresh = () => {
        router.refresh();
    };

    return (
        <div className="p-4 sm:p-6">
             <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
                {/* Input con icono */}
                <div className="flex-1 flex items-center border border-gray-300 rounded-md px-3 py-2 sm:py-3 h-12 focus-within:ring-2 focus-within:ring-[#0040B8] focus-within:border-transparent">
                    <Search size={18} className="text-gray-500 mr-2 flex-shrink-0" />
                    <input
                        type="text"
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Busca tus usuarios por nombre, email, DNI, rol o teléfono"
                        className="w-full text-sm sm:text-base focus:outline-none bg-transparent"
                    />
                </div>

                {/* Botones */}
                <div className="flex gap-2 sm:gap-3">
                    <button className="bg-[#0040B8] hover:bg-[#0035A0] text-white px-3 sm:px-4 py-2 sm:py-3 rounded-md flex items-center justify-center gap-2 transition-colors duration-200 font-medium text-sm">
                        <SlidersHorizontal size={16} />
                        <span className="hidden sm:inline">Filtrar</span>
                    </button>
                    <button
                        className="bg-white border-2 border-[#0040B8] text-[#0040B8] px-3 sm:px-4 py-2 sm:py-3 rounded-md flex items-center justify-center gap-2 hover:bg-[#0040B8] hover:text-white transition-colors duration-200 font-medium text-sm"
                        onClick={handleRefresh}
                    >
                        <RefreshCcw size={16} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm sm:text-base">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="p-3 text-center text-xs sm:text-sm font-medium">Nombre</th>
                            <th className="p-3 text-center text-xs sm:text-sm font-medium">Email</th>
                            <th className="p-3 text-center text-xs sm:text-sm font-medium">DNI</th>
                            <th className="p-3 text-center text-xs sm:text-sm font-medium">Teléfono</th>
                            <th className="p-3 text-center text-xs sm:text-sm font-medium">Rol</th>
                            <th className="p-3 text-center text-xs sm:text-sm font-medium">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12 sm:py-20 text-gray-600 text-sm sm:text-base">
                                    No hay usuarios en este taller.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user: any) => {
                                return (
                                    <tr key={user.id} className="border-t hover:bg-gray-50 transition-colors">
                                        <td className="p-3 text-center">
                                            <p className="font-medium text-sm sm:text-base">{user.first_name} {user.last_name}</p>
                                        </td>
                                        <td className="p-3 text-center">
                                            <p className="text-xs sm:text-sm text-gray-600 break-all max-w-[200px] mx-auto truncate">{user.email}</p>
                                        </td>
                                        <td className="p-3 text-center">
                                            <p className="text-sm sm:text-base font-mono">{user.dni || "-"}</p>
                                        </td>
                                        <td className="p-3 text-center">
                                            <p className="text-sm sm:text-base">{user.phone_number || "-"}</p>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="inline-block px-2 py-1 rounded-full text-xs sm:text-sm bg-gray-100 text-gray-700">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-0">
                                            <div className="flex justify-center items-center gap-2 sm:gap-3 h-full min-h-[48px] px-2 sm:px-3">
                                                <button
                                                    type="button"
                                                    className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1 rounded hover:bg-blue-50 transition-colors"
                                                    title="Ver detalles"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1 rounded hover:bg-blue-50 transition-colors"
                                                    title="Más opciones"
                                                >
                                                    <EllipsisVertical size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}