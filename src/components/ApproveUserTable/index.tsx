"use client";
import { Eye, RefreshCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";

export default function UserTable({ users }: { users: any[] }) {
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // modal
  const [openModal, setOpenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  const handleRefresh = () => router.refresh();

  const openUserModal = (user: any) => {
    setSelectedUser(user);
    setErrorMsg(null);
    setOpenModal(true);
  };
  const closeModal = () => {
    if (submitting) return;
    setOpenModal(false);
    setSelectedUser(null);
    setErrorMsg(null);
  };

  const handleApprove = async () => {
    if (!selectedUser) return;
    setSubmitting("approve");
    setErrorMsg(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/approve/${selectedUser.id}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Fallo al aprobar");
      }
      closeModal();
      router.refresh();
    } catch (e: any) {
      setErrorMsg(e.message || "Error desconocido al aprobar");
    } finally {
      setSubmitting(null);
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;
    setSubmitting("reject");
    setErrorMsg(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/reject/${selectedUser.id}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Fallo al rechazar");
      }
      closeModal();
      router.refresh();
    } catch (e: any) {
      setErrorMsg(e.message || "Error desconocido al rechazar");
    } finally {
      setSubmitting(null);
    }
  };

  const fmtDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
      : "";

  return (
    <div className="flex flex-col items-center gap-2 mt-6 px-6">
      {/* Filtros y acciones */}
      <div className="flex justify-center gap-x-3 mt-6 w-full">
        <div className="w-full flex items-center border border-gray-300 rounded px-2 py-1 h-12">
          <Search size={20} className="text-gray-500 mr-1" />
          <input
            type="text"
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Busca tus usuarios por nombre, email o DNI"
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
              <th className="p-3 text-center">Creado</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-20 text-gray-600">
                  No hay usuarios para aprobar.
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
                  <td className="p-3 text-center">{fmtDate(user.created_at)}</td>
                  <td className="p-0">
                    <div className="flex justify-center items-center gap-3 h-full min-h-[48px] px-3">
                      <button
                        onClick={() => openUserModal(user)}
                        className="text-[#0040B8] hover:opacity-80"
                        aria-label="Ver usuario"
                        title="Ver usuario"
                      >
                        <Eye size={16} />
                      </button>
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

        {/* Indicadores de página */}
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

      {/* Modal */}
      {openModal && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={submitting ? undefined : closeModal}
          />
          {/* card */}
          <div className="relative z-[61] w-full max-w-lg bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-base font-semibold">Revisión de usuario</h3>
              <button
                onClick={closeModal}
                className="p-1 rounded hover:bg-gray-100"
                disabled={!!submitting}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3 text-sm">
              <Row label="Nombre" value={`${selectedUser.first_name ?? ""} ${selectedUser.last_name ?? ""}`} />
              <Row label="Email" value={selectedUser.email} />
              <Row label="DNI" value={selectedUser.dni} />
              <Row label="Teléfono" value={selectedUser.phone_number} />
              <Row label="Creado" value={fmtDate(selectedUser.created_at)} />
              {Array.isArray(selectedUser.memberships) && selectedUser.memberships.length > 0 && (
                <div>
                  <div className="text-gray-500 mb-1">Talleres y roles</div>
                  <ul className="list-disc list-inside">
                    {selectedUser.memberships.map((m: any, idx: number) => (
                      <li key={idx} className="text-gray-800">
                        Taller {m.workshop_id}, rol {m.role}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {errorMsg && (
                <div className="text-red-600 text-sm border border-red-200 bg-red-50 rounded px-3 py-2">
                  {errorMsg}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t">
              <button
                onClick={handleReject}
                disabled={submitting !== null}
                className={`px-4 py-2 rounded border text-sm ${
                  submitting === "reject"
                    ? "opacity-70 cursor-wait border-gray-300 text-gray-500"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {submitting === "reject" ? "Rechazando..." : "Rechazar"}
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting !== null}
                className={`px-4 py-2 rounded text-sm ${
                  submitting === "approve"
                    ? "opacity-70 cursor-wait bg-[#0040B8]/80 text-white"
                    : "bg-[#0040B8] hover:bg-[#0035A0] text-white"
                }`}
              >
                {submitting === "approve" ? "Aprobando..." : "Aprobar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-28 shrink-0 text-gray-500">{label}</div>
      <div className="text-gray-900 break-words">{value || "-"}</div>
    </div>
  );
}
