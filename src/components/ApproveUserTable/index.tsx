// components/ApproveWorkshopTable.tsx
"use client";
import { Eye, RefreshCcw, Search, SlidersHorizontal, X, Trash2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";

type Workshop = {
  id: number | string;
  name: string;
  razon_social?: string;
  razonSocial?: string; // por compatibilidad
  province: string;
  city: string;
  phone?: string;
  cuit?: string;
  plant_number?: number | null;
  created_at?: string;
};

type Member = {
  user_id: number | string;
  first_name?: string;
  last_name?: string;
  email?: string;
  dni?: string;
  phone_number?: string;
  role?: string | number;
  created_at?: string;
};

export default function ApproveWorkshopTable({ workshops }: { workshops: Workshop[] }) {
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [openModal, setOpenModal] = useState(false);
  const [selectedWs, setSelectedWs] = useState<Workshop | null>(null);
  const [wsDetail, setWsDetail] = useState<Workshop | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null); // "approve" | `kick-${user_id}`

  const router = useRouter();

  useEffect(() => { setPage(1); }, [searchText, pageSize]);

  async function approveUser(userId: string | number) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users/approve/${userId}`,
      { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" } }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Fallo al aprobar usuario ${userId}`);
    }
  }

  const filteredWorkshops = useMemo(() => {
    if (!searchText?.trim()) return workshops;
    const q = searchText.toLowerCase();
    return workshops.filter(w =>
      (w.name || "").toLowerCase().includes(q) ||
      (w.razon_social || w.razonSocial || "").toLowerCase().includes(q) ||
      (w.city || "").toLowerCase().includes(q) ||
      (w.province || "").toLowerCase().includes(q) ||
      (w.cuit || "").toLowerCase().includes(q) ||
      (w.phone || "").toLowerCase().includes(q)
    );
  }, [workshops, searchText]);

  const totalItems = filteredWorkshops.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageWorkshops = filteredWorkshops.slice(start, end);

  const goToPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));
  const handleRefresh = () => router.refresh();

  const openWsModal = async (ws: Workshop) => {
    setSelectedWs(ws);
    setOpenModal(true);
    setErrorMsg(null);
    setWsDetail(null);
    setMembers([]);
    setLoadingDetail(true);
    try {
      // detalle del taller
      const dRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workshops/${ws.id}`, {
        credentials: "include",
      });
      if (!dRes.ok) throw new Error(await dRes.text() || "No se pudo cargar el taller");
      const d = await dRes.json();
      setWsDetail({
        ...ws,
        ...d,
      });

      // miembros
      const mRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workshops/admin/${ws.id}/members`, {
        credentials: "include",
      });
      if (!mRes.ok) throw new Error(await mRes.text() || "No se pudo cargar el personal");
      const ms = await mRes.json();
      setMembers(ms || []);
    } catch (e: any) {
      setErrorMsg(e.message || "Error cargando datos");
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeModal = () => {
    if (actionBusy) return;
    setOpenModal(false);
    setSelectedWs(null);
    setWsDetail(null);
    setMembers([]);
    setErrorMsg(null);
  };

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }) : "";

  const unassignMember = async (user_id: string | number) => {
    if (!selectedWs) return;
    setActionBusy(`kick-${user_id}`);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workshops/admin/${selectedWs.id}/members/${user_id}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) throw new Error(await res.text() || "No se pudo desasignar");
      setMembers(prev => prev.filter(m => m.user_id !== user_id));
    } catch (e: any) {
      setErrorMsg(e.message || "Error al desasignar");
    } finally {
      setActionBusy(null);
    }
  };

  // reemplazá la función approveWorkshop existente por esta
  const approveWorkshop = async () => {
    if (!selectedWs) return;

    setActionBusy("approve");
    setErrorMsg(null);

    try {
      // 1) aprobar a todos los miembros restantes, omitiendo los ya desasignados
      //    (members refleja el estado actual del modal)
      const remaining = [...members]; // los que siguen asignados
      if (remaining.length === 0) {
        // opcional, si querés obligar a tener al menos 1 persona:
        // throw new Error("El taller no tiene personal asignado");
      }

      // ejecutamos en paralelo y recogemos resultados
      const results = await Promise.allSettled(
        remaining.map(m => approveUser(m.user_id))
      );

      // chequear fallos
      const failed = results
        .map((r, i) => ({ r, m: remaining[i] }))
        .filter(x => x.r.status === "rejected");

      if (failed.length > 0) {
        const detail = failed
          .map(x => `• ${x.m.first_name ?? ""} ${x.m.last_name ?? ""} (${x.m.email ?? x.m.user_id})`)
          .join("\n");
        throw new Error(`No se pudieron aprobar ${failed.length} usuario(s):\n${detail}`);
      }

      // 2) si todo ok con usuarios, aprobar el taller
      const wRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/workshops/${selectedWs.id}/approve`,
        { method: "POST", credentials: "include" }
      );
      if (!wRes.ok) {
        const text = await wRes.text();
        throw new Error(text || "No se pudo aprobar el taller");
      }

      // 3) cerrar y refrescar
      closeModal();
      // si querés efecto inmediato sin refrescar, podrías filtrar del listado local
      // setWorkshops(prev => prev.filter(w => w.id !== selectedWs.id));
      // pero como tu lista viene de server component:
      router.refresh();

    } catch (e: any) {
      setErrorMsg(e.message || "Error al aprobar taller");
    } finally {
      setActionBusy(null);
    }
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
            placeholder="Busca por nombre, razón social, localidad o CUIT"
            className="w-full text-sm focus:outline-none"
          />
        </div>

        <button className="bg-[#0040B8] hover:bg-[#0035A0] text-white px-3 py-2 rounded flex items-center justify-center gap-x-2">
          <SlidersHorizontal size={20} />
          <span className="text-sm">Filtrar</span>
        </button>

        <button
          className="bg-white border-2 border-[#0040B8] px-3 py-2 rounded flex items-center justify-center gap-x-2"
          onClick={handleRefresh}
        >
          <RefreshCcw size={20} className="text-[#0040B8]" />
          <span className="text-[#0040B8] text-sm">Actualizar</span>
        </button>
      </div>

      {/* Controles de paginación superiores */}
      <div className="mt-4 w-full flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Mostrando <strong>{totalItems === 0 ? 0 : start + 1}-{Math.min(end, totalItems)}</strong> de <strong>{totalItems}</strong> talleres
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Por página</label>
          <select
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
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
              <th className="p-3 text-center">Razón social</th>
              <th className="p-3 text-center">Localidad</th>
              <th className="p-3 text-center">CUIT</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pageWorkshops.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-20 text-gray-600">
                  No hay talleres para aprobar.
                </td>
              </tr>
            ) : (
              pageWorkshops.map((ws) => (
                <tr key={ws.id} className="border-t">
                  <td className="p-3 text-center font-medium">{ws.name}</td>
                  <td className="p-3 text-center">{ws.razon_social || ws.razonSocial || "-"}</td>
                  <td className="p-3 text-center">{ws.city}, {ws.province}</td>
                  <td className="p-3 text-center">{ws.cuit || "-"}</td>
                  <td className="p-0">
                    <div className="flex justify-center items-center gap-3 h-full min-h-[48px] px-3">
                      <button
                        onClick={() => openWsModal(ws)}
                        className="text-[#0040B8] hover:opacity-80"
                        aria-label="Ver detalles"
                        title="Ver detalles"
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
          className={`px-3 py-2 rounded border text-sm ${currentPage <= 1 ? "text-gray-400 border-gray-200" : "text-[#0040B8] border-[#0040B8]"}`}
        >
          Anterior
        </button>

        <div className="flex items-center gap-1 text-sm">
          {Array.from({ length: totalPages }).map((_, i) => {
            const n = i + 1;
            return (
              <button
                key={n}
                onClick={() => goToPage(n)}
                className={`px-2 py-1 rounded border ${n === currentPage ? "bg-[#0040B8] text-white border-[#0040B8]" : "border-gray-300"}`}
              >
                {n}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`px-3 py-2 rounded border text-sm ${currentPage >= totalPages ? "text-gray-400 border-gray-200" : "text-[#0040B8] border-[#0040B8]"}`}
        >
          Siguiente
        </button>
      </div>

      {/* Modal */}
      {openModal && selectedWs && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={actionBusy ? undefined : closeModal} />
          <div className="relative z-[61] w-full max-w-3xl bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-base font-semibold">Detalles del taller</h3>
              <button
                onClick={closeModal}
                className="p-1 rounded hover:bg-gray-100"
                disabled={!!actionBusy}
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              {loadingDetail ? (
                <div className="text-sm text-gray-500">Cargando...</div>
              ) : errorMsg ? (
                <div className="text-red-600 text-sm border border-red-200 bg-red-50 rounded px-3 py-2">
                  {errorMsg}
                </div>
              ) : wsDetail ? (
                <>
                  {/* Info del taller */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoRow label="Nombre" value={wsDetail.name} />
                    <InfoRow label="Razón social" value={wsDetail.razon_social || wsDetail.razonSocial || "-"} />
                    <InfoRow label="Provincia" value={wsDetail.province} />
                    <InfoRow label="Localidad" value={wsDetail.city} />
                    <InfoRow label="Teléfono" value={wsDetail.phone || "-"} />
                    <InfoRow label="CUIT" value={wsDetail.cuit || "-"} />
                    <InfoRow label="Nro de planta" value={String(wsDetail.plant_number ?? "-")} />
                  </div>

                  {/* Personal */}
                  <div className="mt-2">
                    <div className="text-gray-700 font-medium mb-2">Personal</div>
                    <div className="border border-gray-200 rounded">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="p-2 text-left">Nombre</th>
                            <th className="p-2 text-left">Email</th>
                            <th className="p-2 text-left">DNI</th>
                            <th className="p-2 text-left">Rol</th>
                            <th className="p-2 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {members.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-6 text-gray-500">
                                Sin personal asignado.
                              </td>
                            </tr>
                          ) : (
                            members.map((m) => (
                              <tr key={m.user_id} className="border-t">
                                <td className="p-2">
                                  {(m.first_name || "") + " " + (m.last_name || "")}
                                </td>
                                <td className="p-2">{m.email || "-"}</td>
                                <td className="p-2">{m.dni || "-"}</td>
                                <td className="p-2">{String(m.role ?? "-")}</td>
                                <td className="p-2 text-center">
                                  <button
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
                                    onClick={() => unassignMember(m.user_id)}
                                    disabled={actionBusy === `kick-${m.user_id}`}
                                    title="Rechazar persona"
                                  >
                                    <Trash2 size={14} />
                                    {actionBusy === `kick-${m.user_id}` ? "Quitando..." : "Rechazar"}
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Footer acciones */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t">
              <button
                onClick={approveWorkshop}
                disabled={actionBusy !== null}
                className={`px-4 py-2 rounded text-sm inline-flex items-center gap-2 ${
                  actionBusy === "approve"
                    ? "opacity-70 cursor-wait bg-[#0040B8]/80 text-white"
                    : "bg-[#0040B8] hover:bg-[#0035A0] text-white"
                }`}
                title="Aprobar taller"
              >
                <CheckCircle size={16} />
                {actionBusy === "approve" ? "Aprobando..." : "Aprobar taller"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-32 shrink-0 text-gray-500">{label}</div>
      <div className="text-gray-900 break-words">{value || "-"}</div>
    </div>
  );
}
