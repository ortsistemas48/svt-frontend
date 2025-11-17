"use client";

import {
  Eye,
  EllipsisVertical,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Mail,
  Shield,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";

type AnyUser = {
  id: string | number;
  first_name?: string;
  last_name?: string;
  email?: string;
  dni?: string;
  phone?: string;
  phone_number?: string;
  role?: string;
  title_name?: string;
  license_number?: string;
  [key: string]: any;
};

type Props = {
  users: AnyUser[];
  onDelete?: (user: AnyUser) => Promise<void> | void; // opcional
};

function toneFor(value?: string) {
  const v = (value || "").toLowerCase();
  if (["admin", "owner", "dueño", "propietario"].some((k) => v.includes(k)))
    return { text: "text-indigo-700", bg: "bg-indigo-50" };
  if (["ingeniero", "engineer"].some((k) => v.includes(k)))
    return { text: "text-emerald-700", bg: "bg-emerald-50" };
  if (["operador", "operator"].some((k) => v.includes(k)))
    return { text: "text-sky-700", bg: "bg-sky-50" };
  if (["soporte", "support"].some((k) => v.includes(k)))
    return { text: "text-amber-700", bg: "bg-amber-50" };
  if (["activo", "active"].some((k) => v.includes(k)))
    return { text: "text-green-700", bg: "bg-green-50" };
  if (["inactivo", "suspendido", "inactive", "suspended"].some((k) => v.includes(k)))
    return { text: "text-rose-700", bg: "bg-rose-50" };
  return { text: "text-gray-700", bg: "bg-gray-100" };
}

export default function UserTable({ users, onDelete }: Props) {
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AnyUser | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const router = useRouter();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setPage(1);
  }, [searchText, pageSize]);

  const filteredUsers = useMemo(() => {
    if (!searchText?.trim()) return users;
    const query = searchText.toLowerCase();
    return users.filter((user) => {
      return (
        (user.first_name || "").toLowerCase().includes(query) ||
        (user.last_name || "").toLowerCase().includes(query) ||
        (user.email || "").toLowerCase().includes(query) ||
        (user.dni || "").toLowerCase().includes(query) ||
        (user.phone_number || "").toLowerCase().includes(query) 
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

  const handleRefresh = () => {
    router.refresh();
  };

  function openDrawer(user: AnyUser) {
    setSelected(user);
    setOpen(true);
  }
  function closeDrawer() {
    setOpen(false);
    setTimeout(() => setSelected(null), 200);
  }

  async function handleConfirmDelete() {
    if (!onDelete || !selected) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await onDelete(selected);
      setConfirmOpen(false);
      closeDrawer();
      router.refresh();
    } catch (e: any) {
      setDeleteError(e?.message || "No se pudo completar la acción");
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const fullName = (u?: AnyUser | null) =>
    [u?.first_name, u?.last_name].filter(Boolean).join(" ") || "Sin nombre";

  const initials = (u?: AnyUser | null) => {
    const a = (u?.first_name || "").trim();
    const b = (u?.last_name || "").trim();
    return ((a ? a[0] : "") + (b ? b[0] : "") || "U").toUpperCase();
  };

  const Row = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="flex items-start justify-between py-2 px-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 max-w-[60%] text-right break-words">
        {value || "-"}
      </span>
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      {/* Filtros y acciones, fuera del card de tabla */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
        <div className="flex-1 flex items-center border border-gray-300 rounded-[4px] px-3 py-2 sm:py-3 h-12 focus-within:ring-2 focus-within:ring-[#0040B8] focus-within:border-transparent bg-white">
          <Search size={18} className="text-gray-500 mr-2 flex-shrink-0" />
          <input
            type="text"
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Busca usuarios por nombre, email, DNI o teléfono"
            className="w-full text-sm sm:text-base focus:outline-none bg-transparent"
          />
        </div>

        <div className="flex gap-2 sm:gap-3">
          <button className="bg-[#0040B8] hover:bg-[#0035A0] text-white px-3 sm:px-4 py-2 sm:py-3 rounded-[4px] flex items-center justify-center gap-2 transition-colors duration-200 font-medium text-sm">
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filtrar</span>
          </button>
          <button
            className="bg-white border border-[#0040B8] text-[#0040B8] px-3 sm:px-4 py-2 sm:py-3 rounded-[4px] flex items-center justify-center gap-2 hover:bg-[#0040B8] hover:text-white transition-colors duration-200 font-medium text-sm"
            onClick={handleRefresh}
          >
            <RefreshCcw size={16} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Controles de paginación superiores */}
      <div className="mt-1 w-full flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Mostrando{" "}
          <strong>{totalItems === 0 ? 0 : start + 1}-{Math.min(end, totalItems)}</strong>{" "}
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

      {/* Tabla en card */}
      <div className="rounded-[10px] border border-gray-200 overflow-hidden bg-white mt-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm sm:text-base">
            <thead className="bg-white text-gray-600">
              <tr className="border-b border-gray-200">
                <th className="p-3 text-center text-xs sm:text-sm font-medium">Nombre</th>
                <th className="p-3 text-center text-xs sm:text-sm font-medium">Email</th>
                <th className="p-3 text-center text-xs sm:text-sm font-medium">DNI</th>
                <th className="p-3 text-center text-xs sm:text-sm font-medium">Teléfono</th>
                <th className="p-3 text-center text-xs sm:text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pageUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 sm:py-20 text-gray-600">
                    No hay usuarios en el sistema.
                  </td>
                </tr>
              ) : (
                pageUsers.map((user) => {
                  const phone = user.phone_number || user.phone || "";
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-center">
                        <p className="font-medium">{fullName(user)}</p>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-xs sm:text-sm text-gray-600 break-all max-w-[200px] mx-auto truncate">
                          {user.email}
                        </p>
                      </td>
                      <td className="p-3 text-center">
                        <p className="font-mono">{user.dni || "-"}</p>
                      </td>
                      <td className="p-3 text-center">{phone || "-"}</td>
                      <td className="p-0">
                        <div className="flex justify-center items-center gap-2 sm:gap-3 h-full min-h-[48px] px-2 sm:px-3">
                          <button
                            type="button"
                            className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Ver detalles"
                            onClick={() => openDrawer(user)}
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

        <div className="flex items-center gap-1 text-sm">
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
                className={`px-2 py-1 rounded border ${
                  currentPage === 1 ? "bg-[#0040B8] text-white border-[#0040B8]" : "border-gray-300"
                }`}
              >
                1
              </button>
              {currentPage > 3 && <span className="px-2">...</span>}
              {[
                Math.max(2, currentPage - 1),
                currentPage,
                Math.min(totalPages - 1, currentPage + 1),
              ]
                .filter((n, i, arr) => arr.indexOf(n) === i)
                .filter((n) => n > 1 && n < totalPages)
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

      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeDrawer}
        aria-hidden={!open}
      />

      {/* Drawer de detalle */}
      <aside
        role="dialog"
        aria-modal="true"
        className={`fixed right-0 top-0 z-50 h-full w-full sm:w-[420px] bg-white shadow-2xl transform transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-base sm:text-lg font-semibold truncate">
            {selected ? fullName(selected) : "Detalle de usuario"}
          </h2>
          <button
            ref={closeBtnRef}
            onClick={closeDrawer}
            className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
            aria-label="Cerrar panel"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100%-56px)]">
          {selected ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0040B8]/10 flex items-center justify-center text-[#0040B8] font-semibold">
                  {initials(selected)}
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{fullName(selected)}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} />
                    <span className="truncate">{selected.email || "-"}</span>
                  </div>
                </div>
              </div>


              <div className="-mx-4 divide-y divide-gray-200">
                <Row label="DNI" value={selected.dni as string} />
                <Row label="Teléfono" value={(selected.phone_number || selected.phone) as string} />
              </div>

              {/* Acciones peligrosas, solo si hay onDelete */}
              {onDelete && (
                <div className="mt-4 p-4">
                  {deleteError && <p className="text-sm text-rose-700 mb-2">{deleteError}</p>}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setConfirmOpen(true)}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm"
                    >
                      <Trash2 size={16} />
                      {deleting ? "Procesando..." : "Desvincular usuario"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Selecciona un usuario para ver sus datos.</p>
          )}
        </div>
      </aside>

      {/* Modal de confirmación */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          aria-modal="true"
          role="dialog"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-desc"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmOpen(false)} />
          <div className="relative bg-white w-[92%] max-w-md rounded-[10px] shadow-xl border border-gray-200 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div className="min-w-0">
                <h3 id="confirm-title" className="text-base font-semibold">
                  Confirmar acción
                </h3>
                <p id="confirm-desc" className="mt-1 text-sm text-gray-600">
                  Vas a desvincular a {selected ? fullName(selected) : "este usuario"} del sistema, esta acción se puede revertir desde administración.
                </p>
              </div>
            </div>

            {deleteError && <p className="mt-3 text-sm text-rose-700">{deleteError}</p>}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-[4px] border border-gray-300 bg-white text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm"
              >
                <Trash2 size={16} />
                {deleting ? "Procesando..." : "Sí, desvincular"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
