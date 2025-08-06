'use client'
import { Eye, EllipsisVertical, RefreshCcw, Search, SlidersHorizontal } from "lucide-react";
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

    return (
        <div className="flex flex-col items-center gap-2 mt-6">
             <div className="grid grid-cols-[500px_150px_170px] gap-x-3 mt-6">
                {/* Input con icono */}
                <div className="flex items-center border border-gray-300 rounded px-2 py-1 h-12">
                    <Search size={20} className="text-gray-500 mr-1" />
                    <input
                        type="text"
                        onChange={(e) => setSearchText(e.target.value)}
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
            
            <div className="border border-gray-300 mt-6 rounded-[4px] overflow-hidden w-[842px]">
                <table className="w-full">
                    <thead className="bg-[#ffffff] text-[#00000080] s">
                        <tr className="">
                            <th className="p-3 text-center">Nombre</th>
                            <th className="p-3 text-center">Email</th>
                            <th className="p-3 text-center">Dni</th>
                            <th className="p-3 text-center">Telefono</th>
                            <th className="p-3 text-center">Rol</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-20 text-gray-600">
                                    No se encontraron inspecciones registradas.
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user: any) => {
                                return (
                                    <tr key={user.id} className="border-t">
                                        <td className="p-3 text-center">
                                            <p className="font-medium">{user.first_name} {user.last_name}</p>
                                        </td>
                                        <td className="p-3 text-center">
                                            <p>{user.email}</p>
                                        </td>
                                        <td className="p-3 text-center">
                                            <p>{user.dni}</p>
                                        </td>
                                        <td className="p-3 text-center">
                                            {user.phone_number}
                                        </td>
                                        <td className="p-3 text-center">
                                            <p>{user.role}</p>
                                        </td>
                                        <td className="p-0">
                                            <div className="flex justify-center items-center gap-3 h-full min-h-[48px] px-3">
                                                <Eye size={16} className="cursor-pointer text-[#0040B8]" />
                                                <EllipsisVertical size={16} className="cursor-pointer text-[#0040B8]" />
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