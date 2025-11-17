// components/ApproveWorkshopTable.tsx
"use client";
import { Eye, RefreshCcw, Search, SlidersHorizontal, X, Trash2, CheckCircle, MoreVertical, UserX, User, Mail, Phone, CreditCard, Briefcase, Award, FileText, Building2, MapPin, Home, Hash, Factory, Users } from "lucide-react";
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
  address?: string;
  disposition_number?: string;
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
  license_number?: string;
  title_name?: string;
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
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const router = useRouter();

  useEffect(() => { setPage(1); }, [searchText, pageSize]);

  const workshopOwnerEmail = useMemo(() => {
    if (!members || members.length === 0) return "-";
    const normalize = (v: unknown) => String(v ?? "").toLowerCase();
    const owners = members.filter((m) => {
      const r = normalize(m.role);
      return r.includes("titular") || r.includes("owner") || r.includes("dueño");
    });
    const firstOwnerWithEmail = owners.find((m) => !!m.email?.trim());
    if (firstOwnerWithEmail?.email) return firstOwnerWithEmail.email;
    const firstWithEmail = members.find((m) => !!m.email?.trim());
    return firstWithEmail?.email || "-";
  }, [members]);

  async function approveUser(userId: string | number) {
    const res = await fetch(
      `/api/users/approve/${userId}`,
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
      const dRes = await fetch(`/api/workshops/${ws.id}`, {
        credentials: "include",
      });
      if (!dRes.ok) throw new Error(await dRes.text() || "No se pudo cargar el taller");
      const d = await dRes.json();
      
      setWsDetail({
        ...ws,
        ...d,
      });

      // miembros
      const mRes = await fetch(`/api/workshops/admin/${ws.id}/members`, {
        credentials: "include",
      });
      if (!mRes.ok) throw new Error(await mRes.text() || "No se pudo cargar el personal");
      const ms = await mRes.json();
      console.log(ms)
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

  const openMemberDetails = (member: Member) => {
    setSelectedMember(member);
  };

  const closeMemberModal = () => {
    setSelectedMember(null);
  };

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" }) : "";

  const unassignMember = async (user_id: string | number) => {
    if (!selectedWs) return;
    setActionBusy(`kick-${user_id}`);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/workshops/admin/${selectedWs.id}/members/${user_id}`,
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
        `/api/workshops/${selectedWs.id}/approve`,
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

      {/* Modal del Taller */}
      {openModal && selectedWs && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={actionBusy ? undefined : closeModal} />
          <div className="relative z-[61] w-full max-w-4xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[#F3F6FF]">
                  <Building2 size={20} className="text-[#0040B8]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Detalles del Taller</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{selectedWs.name}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-full border hover:bg-gray-50 transition-colors"
                disabled={!!actionBusy}
                aria-label="Cerrar"
              >
                <X size={18} className="text-gray-700" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6 space-y-6 overflow-y-auto flex-1">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-sm text-gray-500">Cargando información del taller...</div>
                </div>
              ) : errorMsg ? (
                <div className="text-red-600 text-sm border border-red-200 bg-red-50 rounded-[10px] px-4 py-3">
                  {errorMsg}
                </div>
              ) : wsDetail ? (
                <>
                  {/* Información General */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Building2 size={16} className="text-[#0040B8]" />
                      Información General
                    </h4>
                    <div className="bg-gray-50 rounded-[10px] p-4 space-y-3">
                      <DetailRow 
                        icon={<Factory size={18} className="text-gray-500" />}
                        label="Nombre del taller" 
                        value={wsDetail.name} 
                      />
                      <DetailRow 
                        icon={<Building2 size={18} className="text-gray-500" />}
                        label="Razón social" 
                        value={wsDetail.razon_social || wsDetail.razonSocial || "-"} 
                      />
                    </div>
                  </div>

                  {/* Ubicación */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <MapPin size={16} className="text-[#0040B8]" />
                      Ubicación
                    </h4>
                    <div className="bg-gray-50 rounded-[10px] p-4 space-y-3">
                      <DetailRow 
                        icon={<MapPin size={18} className="text-gray-500" />}
                        label="Provincia" 
                        value={wsDetail.province} 
                      />
                      <DetailRow 
                        icon={<MapPin size={18} className="text-gray-500" />}
                        label="Localidad" 
                        value={wsDetail.city} 
                      />
                      <DetailRow 
                        icon={<Home size={18} className="text-gray-500" />}
                        label="Dirección" 
                        value={wsDetail.address || "-"} 
                      />
                    </div>
                  </div>

                  {/* Información Legal y Contacto */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <FileText size={16} className="text-[#0040B8]" />
                      Información Legal y Contacto
                    </h4>
                    <div className="bg-gray-50 rounded-[10px] p-4 space-y-3">
                      <DetailRow 
                        icon={<FileText size={18} className="text-gray-500" />}
                        label="CUIT" 
                        value={wsDetail.cuit || "-"} 
                      />
                      <DetailRow 
                        icon={<Mail size={18} className="text-gray-500" />}
                        label="Email del taller" 
                        value={workshopOwnerEmail} 
                      />
                      <DetailRow 
                        icon={<Phone size={18} className="text-gray-500" />}
                        label="Teléfono" 
                        value={wsDetail.phone || "-"} 
                      />
                      <DetailRow 
                        icon={<Hash size={18} className="text-gray-500" />}
                        label="Número de planta" 
                        value={String(wsDetail.plant_number ?? "-")} 
                      />
                      <DetailRow 
                        icon={<Hash size={18} className="text-gray-500" />}
                        label="Número de disposición" 
                        value={wsDetail.disposition_number || "-"} 
                      />
                    </div>
                  </div>

                  {/* Personal */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Users size={16} className="text-[#0040B8]" />
                      Personal Asignado ({members.length})
                    </h4>
                    <div className="border border-gray-200 rounded-[10px] overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                          <tr>
                            <th className="p-3 text-left font-medium">Nombre</th>
                            <th className="p-3 text-left font-medium">Email</th>
                            <th className="p-3 text-left font-medium">DNI</th>
                            <th className="p-3 text-left font-medium">Rol</th>
                            <th className="p-3 text-center font-medium">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {members.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-8 text-gray-500">
                                <Users size={32} className="mx-auto mb-2 text-gray-400" />
                                <p>Sin personal asignado</p>
                              </td>
                            </tr>
                          ) : (
                            members.map((m) => (
                              <tr key={m.user_id} className="border-t hover:bg-gray-50 transition-colors">
                                <td className="p-3 font-medium text-gray-900">
                                  {(m.first_name || "") + " " + (m.last_name || "")}
                                </td>
                                <td className="p-3 text-gray-600">{m.email || "-"}</td>
                                <td className="p-3 text-gray-600">{m.dni || "-"}</td>
                                <td className="p-3">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {String(m.role ?? "-")}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[4px] border border-red-300 text-red-600 hover:bg-red-50 transition-colors text-xs font-medium"
                                      onClick={() => unassignMember(m.user_id)}
                                      disabled={actionBusy === `kick-${m.user_id}`}
                                      title="Desvincular persona"
                                    >
                                      <UserX size={14} />
                                      {actionBusy === `kick-${m.user_id}` ? "Quitando..." : "Desvincular"}
                                    </button>
                                    <button
                                      className="inline-flex items-center justify-center p-2 rounded-[4px] border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                                      onClick={() => openMemberDetails(m)}
                                      title="Ver detalles"
                                    >
                                      <MoreVertical size={14} />
                                    </button>
                                  </div>
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

            {/* Member side panel (inline, no nested modal) */}
            {selectedMember && (
              <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white border-l shadow-xl z-[62] flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b bg-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-[#F3F6FF]">
                      <User size={18} className="text-[#0040B8]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Información del Usuario</h4>
                      <p className="text-xs text-gray-600">
                        {selectedMember.first_name} {selectedMember.last_name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeMemberModal}
                    className="p-1.5 rounded-full border hover:bg-gray-50 transition-colors"
                    aria-label="Cerrar panel"
                  >
                    <X size={16} className="text-gray-700" />
                  </button>
                </div>

                <div className="px-5 py-5 space-y-5 overflow-y-auto flex-1">
                  {/* Información Personal */}
                  <div>
                    <h5 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <User size={14} className="text-[#0040B8]" />
                      Información Personal
                    </h5>
                    <div className="bg-gray-50 rounded-[10px] p-4 space-y-3 border border-gray-100">
                      <DetailRow 
                        icon={<User size={16} className="text-gray-500" />}
                        label="Nombre completo" 
                        value={`${selectedMember.first_name || "-"} ${selectedMember.last_name || ""}`} 
                      />
                      <DetailRow 
                        icon={<CreditCard size={16} className="text-gray-500" />}
                        label="DNI" 
                        value={selectedMember.dni || "-"} 
                      />
                      <DetailRow 
                        icon={<Briefcase size={16} className="text-gray-500" />}
                        label="Rol" 
                        value={String(selectedMember.role ?? "-")} 
                      />
                    </div>
                  </div>

                  {/* Información de Contacto */}
                  <div>
                    <h5 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Mail size={14} className="text-[#0040B8]" />
                      Información de Contacto
                    </h5>
                    <div className="bg-gray-50 rounded-[10px] p-4 space-y-3 border border-gray-100">
                      <DetailRow 
                        icon={<Mail size={16} className="text-gray-500" />}
                        label="Email" 
                        value={selectedMember.email || "-"} 
                      />
                      <DetailRow 
                        icon={<Phone size={16} className="text-gray-500" />}
                        label="Teléfono" 
                        value={selectedMember.phone_number || "-"} 
                      />
                    </div>
                  </div>

                  {/* Información Profesional (solo para Ingenieros) */}
                  {(String(selectedMember.role).toLowerCase() === "ingeniero" || 
                    String(selectedMember.role).toLowerCase() === "ingeniería" ||
                    selectedMember.role === 2) && (
                    <div>
                      <h5 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Award size={14} className="text-[#0040B8]" />
                        Información Profesional
                      </h5>
                      <div className="bg-blue-50 rounded-[10px] p-4 space-y-3 border border-blue-100">
                        <DetailRow 
                          icon={<Award size={16} className="text-blue-600" />}
                          label="Número de matrícula" 
                          value={selectedMember.license_number || "-"} 
                        />
                        <DetailRow 
                          icon={<FileText size={16} className="text-blue-600" />}
                          label="Título" 
                          value={selectedMember.title_name || "-"} 
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 px-5 py-3 border-t bg-gray-50">
                  <button
                    onClick={closeMemberModal}
                    className="px-4 py-2 rounded-[4px] text-sm font-medium bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                onClick={approveWorkshop}
                disabled={actionBusy !== null || loadingDetail}
                className={`px-5 py-2.5 rounded-[4px] text-sm font-medium inline-flex items-center gap-2 transition-colors ${
                  actionBusy === "approve" || loadingDetail
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

      {/* No nested modal: member details render inline within workshop modal */}
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

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-500 mb-0.5">{label}</div>
        <div className="text-sm text-gray-900 break-words">{value || "-"}</div>
      </div>
    </div>
  );
}
