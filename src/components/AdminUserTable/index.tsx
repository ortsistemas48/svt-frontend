"use client";
import { Eye, EllipsisVertical, RefreshCcw, Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";

export default function UserTable({ users }: { users: any[] }) {
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [searchText, pageSize]);

  const filteredUsers = useMemo(() => {
    if (!searchText?.trim()) return users;
    const query = searchText.toLowerCase();
    return users.filter((user: any) => {
      return (
        (user.first_name || "").toLowerCase().includes(query) ||
        (user.last_name || "").toLowerCase().includes(query) ||
        (user.email || "").toLowerCase().includes(query) ||
        (user.dni || "").toLowerCase().includes(query) ||
        (user.phone_number || "").toLowerCase().includes(query) ||
        (user.role || "").toLowerCase().includes(query)
      );
    });
  }, [users, searchText]);

  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageUsers = filteredUsers.slice(start, end);

  const goToPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  const router = useRouter();
  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center gap-2 mt-6 px-6">
      {/* Filtros y acciones */}
      <div className="flex justify-center gap-x-3 mt-6 w-full">
        <div className="w-full flex items-center border border-gray-300 rounded px-2 py-1 h-12">
          <Search size={20} className="text-gray-500 mr-1" />
          <input
            type="text"
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Busca tus usuarios por nombre, email, DNI, rol o teléfono"
            className="w-full text-sm focus:outline-none"
          />
        </div>

        <button className="bg-[#0040B8] hover:bg-[#0035A0] text-white px-3 py-2 rounded flex items-center justify-center gap-x-2">
          <SlidersHorizontal size={20} />
          <span className="text-sm">Filtrar</span>
        </button>

        <button
          className="bg-white border-2 border-[#0040B8] text-white px-3 py-2 rounded flex items-center justify-center gap-x-2"
          onClick={handleRefresh}
        >
          <RefreshCcw size={20} className="text-[#0040B8]" />
          <span className="text-[#0040B8] text-sm">Actualizar</span>
        </button>
      </div>

      {/* Controles de paginación superiores */}
      <div className="mt-4 w-full flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Mostrando{" "}
          <strong>
            {totalItems === 0 ? 0 : start + 1}-{Math.min(end, totalItems)}
          </strong>{" "}
          de <strong>{totalItems}</strong> usuarios
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Por página</label>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="border border-gray-300 mt-3 rounded-[4px] overflow-hidden w-full">
        <table className="w-full text-sm">
          <thead className="bg-[#ffffff] text-[#00000080]">
            <tr>
              <th className="p-3 text-center">Nombre</th>
              <th className="p-3 text-center">Email</th>
              <th className="p-3 text-center">DNI</th>
              <th className="p-3 text-center">Teléfono</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-20 text-gray-600">
                  No hay usuarios en el sistema.
                </td>
              </tr>
            ) : (
              pageUsers.map((user: any) => (
                <tr key={user.id} className="border-t">
                  <td className="p-3 text-center">
                    <p className="font-medium">
                      {user.first_name} {user.last_name}
                    </p>
                  </td>
                  <td className="p-3 text-center">
                    <p>{user.email}</p>
                  </td>
                  <td className="p-3 text-center">
                    <p>{user.dni}</p>
                  </td>
                  <td className="p-3 text-center">{user.phone_number}</td>
                  <td className="p-0">
                    <div className="flex justify-center items-center gap-3 h-full min-h-[48px] px-3">
                      <Eye size={16} className="cursor-pointer text-[#0040B8]" />
                      <EllipsisVertical size={16} className="cursor-pointer text-[#0040B8]" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de paginación inferiores */}
      <div className="w-full flex items-center justify-between mt-4">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`px-3 py-2 rounded border text-sm ${
            currentPage <= 1 ? "text-gray-400 border-gray-200" : "text-[#0040B8] border-[#0040B8]"
          }`}
        >
          Anterior
        </button>

        {/* Indicadores de página simples */}
        <div className="flex items-center gap-1 text-sm">
          {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
            const n = i + 1;
            // Para muchas páginas, mostramos 1, 2, 3, ..., última
            if (totalPages > 7 && n === 6) {
              return (
                <span key="dots" className="px-2">
                  ...
                </span>
              );
            }
          })}
          {/* Rango compacto: 1, página actual, última */}
          <div className="flex items-center gap-1">
            {totalPages <= 7 ? (
              Array.from({ length: totalPages }).map((_, i) => {
                const n = i + 1;
                return (
                  <button
                    key={n}
                    onClick={() => goToPage(n)}
                    className={`px-2 py-1 rounded border ${
                      n === currentPage ? "bg-[#0040B8] text-white border-[#0040B8]" : "border-gray-300"
                    }`}
                  >
                    {n}
                  </button>
                );
              })
            ) : (
              <>
                <button
                  onClick={() => goToPage(1)}
                  className={`px-2 py-1 rounded border ${currentPage === 1 ? "bg-[#0040B8] text-white border-[#0040B8]" : "border-gray-300"}`}
                >
                  1
                </button>
                {currentPage > 3 && <span className="px-2">...</span>}
                {[
                  Math.max(2, currentPage - 1),
                  currentPage,
                  Math.min(totalPages - 1, currentPage + 1),
                ]
                  .filter((n, i, arr) => arr.indexOf(n) === i) // únicos
                  .filter((n) => n > 1 && n < totalPages) // no mostrar 1 ni última
                  .map((n) => (
                    <button
                      key={n}
                      onClick={() => goToPage(n)}
                      className={`px-2 py-1 rounded border ${
                        n === currentPage ? "bg-[#0040B8] text-white border-[#0040B8]" : "border-gray-300"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                {currentPage < totalPages - 2 && <span className="px-2">...</span>}
                <button
                  onClick={() => goToPage(totalPages)}
                  className={`px-2 py-1 rounded border ${
                    currentPage === totalPages ? "bg-[#0040B8] text-white border-[#0040B8]" : "border-gray-300"
                  }`}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`px-3 py-2 rounded border text-sm ${
            currentPage >= totalPages ? "text-gray-400 border-gray-200" : "text-[#0040B8] border-[#0040B8]"
          }`}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
