"use client";

import {
  EllipsisVertical,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  X,
  MoreVertical,
  User,
  CreditCard,
  Briefcase,
  Award,
  FileText,
  Mail,
  Phone,
  Users,
  Edit,
  Save,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";

type Workshop = {
  id: number;
  name: string;
  razon_social: string;
  city: string;
  address: string | null;
  province: string | null;
  cuit: string | null;
  phone: string;
  plant_number: number;
  disposition_number: string;
  available_inspections: number;
  created_at: string;
  updated_at: string;
  is_approved?: boolean;
};

type Props = {
  workshops: Workshop[];
};

// Role constants
type Role = { id: number; name: string };
const FIXED_ROLES: Role[] = [
  { id: 2, name: "Titular" },
  { id: 3, name: "Ingeniero" },
  { id: 4, name: "Administrativo" },
  { id: 6, name: "Personal de planta" },
];
const ENGINEER_ROLE_ID = 3;

export default function WorkshopTable({ workshops }: Props) {
  type Member = {
    user_id: number | string;
    first_name?: string;
    last_name?: string;
    email?: string;
    dni?: string;
    phone_number?: string;
    role?: string | number;
    engineer_kind?: string;
    license_number?: string;
    title_name?: string;
    created_at?: string;
  };
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Workshop | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Role editing states
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<number | "">("");
  const [editingTitleName, setEditingTitleName] = useState("");
  const [editingLicenseNumber, setEditingLicenseNumber] = useState("");
  const [editingEngineerKind, setEditingEngineerKind] = useState<"" | "Titular" | "Suplente">("");
  const [savingRole, setSavingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleSuccess, setRoleSuccess] = useState<string | null>(null);
  
  // Workshop suspend/activate states
  const [suspendingWorkshop, setSuspendingWorkshop] = useState(false);
  const [workshopActionError, setWorkshopActionError] = useState<string | null>(null);
  const [workshopActionSuccess, setWorkshopActionSuccess] = useState<string | null>(null);
  const [confirmSuspendOpen, setConfirmSuspendOpen] = useState(false);
  
  const router = useRouter();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setPage(1);
  }, [searchText, pageSize]);

  const filteredWorkshops = useMemo(() => {
    if (!searchText?.trim()) return workshops;
    const query = searchText.toLowerCase();
    return workshops.filter((workshop) => {
      return (
        (workshop.name || "").toLowerCase().includes(query) ||
        (workshop.razon_social || "").toLowerCase().includes(query) ||
        (workshop.city || "").toLowerCase().includes(query) ||
        (workshop.province || "").toLowerCase().includes(query) ||
        (workshop.cuit || "").toLowerCase().includes(query) ||
        (workshop.phone || "").toLowerCase().includes(query)
      );
    });
  }, [workshops, searchText]);

  const totalItems = filteredWorkshops.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageWorkshops = filteredWorkshops.slice(start, end);

  const goToPage = (p: number) => setPage(Math.min(Math.max(1, p), totalPages));

  const handleRefresh = () => {
    router.refresh();
  };

  async function openDrawer(workshop: Workshop) {
    setSelected(workshop);
    setOpen(true);
    setErrorMsg(null);
    setMembers([]);
    setSelectedMember(null);
    setLoadingDetail(true);
    try {
      // Fetch full workshop details
      const dRes = await fetch(`/api/workshops/${workshop.id}`, {
        credentials: "include",
      });
      if (!dRes.ok) throw new Error(await dRes.text() || "No se pudo cargar el taller");
      const d = await dRes.json();
      setSelected({
        ...workshop,
        ...d,
      });

      // Fetch members
      const mRes = await fetch(`/api/workshops/admin/${workshop.id}/members`, {
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
  }
  function closeDrawer() {
    setOpen(false);
    setTimeout(() => {
      setSelected(null);
      setSelectedMember(null);
      setErrorMsg(null);
      setLoadingDetail(false);
      setConfirmSuspendOpen(false);
      setWorkshopActionError(null);
      setWorkshopActionSuccess(null);
    }, 200);
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

  const Row = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="flex items-start justify-between py-2 px-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 max-w-[60%] text-right break-words">
        {value || "-"}
      </span>
    </div>
  );

  // Helper function to normalize role to user_type_id
  const getRoleIdFromMember = (member: Member): number | null => {
    const role = member.role;
    if (typeof role === "number") {
      return role;
    }
    if (typeof role === "string") {
      const roleLower = role.toLowerCase();
      if (roleLower.includes("titular")) return 2;
      if (roleLower.includes("ingeniero") || roleLower.includes("ingeniería")) return 3;
      if (roleLower.includes("administrativo")) return 4;
      if (roleLower.includes("personal de planta") || roleLower.includes("planta")) return 6;
    }
    return null;
  };

  const formatRole = (member: Member) => {
    const role = String(member.role ?? "-");
    const roleId = getRoleIdFromMember(member);
    const isEngineer = roleId === ENGINEER_ROLE_ID || 
                       role.toLowerCase() === "ingeniero" || 
                       role.toLowerCase() === "ingeniería";
    
    if (isEngineer && member.engineer_kind) {
      return `${role} - ${member.engineer_kind}`;
    }
    return role;
  };

  // mapa de "estado/rol" -> tonos
  const toneFor = (value?: string) => {
    const v = (value || "").toLowerCase();
    if (["titular"].some(k => v.includes(k))) return { text: "text-indigo-700", bg: "bg-indigo-50" };
    if (["ingeniero"].some(k => v.includes(k))) return { text: "text-emerald-700", bg: "bg-emerald-50" };
    if (["personal de planta"].some(k => v.includes(k))) return { text: "text-sky-700", bg: "bg-sky-50" };
    if (["administrativo"].some(k => v.includes(k))) return { text: "text-sky-700", bg: "bg-sky-50" };
    if (["soporte"].some(k => v.includes(k))) return { text: "text-amber-700", bg: "bg-amber-50" };
    if (["activo", "active"].some(k => v.includes(k))) return { text: "text-green-700", bg: "bg-green-50" };
    if (["inactivo", "suspendido", "inactive", "suspended"].some(k => v.includes(k))) return { text: "text-rose-700", bg: "bg-rose-50" };
    return { text: "text-gray-700", bg: "bg-gray-100" };
  };

  const openMemberDetails = (member: Member) => {
    setSelectedMember(member);
    setIsEditingRole(false);
    setRoleError(null);
    setRoleSuccess(null);
    
    // Initialize editing states with current member values
    const currentRoleId = getRoleIdFromMember(member);
    setEditingRoleId(currentRoleId || "");
    
    // If member is engineer, pre-fill engineer fields
    const isEngineer = currentRoleId === ENGINEER_ROLE_ID;
    if (isEngineer) {
      setEditingTitleName(member.title_name || "");
      setEditingLicenseNumber(member.license_number || "");
      setEditingEngineerKind((member.engineer_kind as "Titular" | "Suplente") || "");
    } else {
      setEditingTitleName("");
      setEditingLicenseNumber("");
      setEditingEngineerKind("");
    }
  };

  const closeMemberModal = () => {
    setSelectedMember(null);
    setIsEditingRole(false);
    setEditingRoleId("");
    setEditingTitleName("");
    setEditingLicenseNumber("");
    setEditingEngineerKind("");
    setRoleError(null);
    setRoleSuccess(null);
  };

  // Function to refresh members list
  const refreshMembers = async () => {
    if (!selected) return;
    try {
      const mRes = await fetch(`/api/workshops/admin/${selected.id}/members`, {
        credentials: "include",
      });
      if (!mRes.ok) throw new Error(await mRes.text() || "No se pudo cargar el personal");
      const ms = await mRes.json();
      setMembers(ms || []);
      
      // Update selectedMember if it exists
      if (selectedMember) {
        const updatedMember = ms.find((m: Member) => m.user_id === selectedMember.user_id);
        if (updatedMember) {
          setSelectedMember(updatedMember);
        }
      }
    } catch (e: any) {
      console.error("Error refreshing members:", e);
    }
  };

  // Function to refresh workshop details
  const refreshWorkshopDetails = async () => {
    if (!selected) return;
    try {
      const dRes = await fetch(`/api/workshops/${selected.id}`, {
        credentials: "include",
      });
      if (!dRes.ok) throw new Error(await dRes.text() || "No se pudo cargar el taller");
      const d = await dRes.json();
      setSelected({
        ...selected,
        ...d,
      });
    } catch (e: any) {
      console.error("Error refreshing workshop:", e);
    }
  };

  // Function to suspend workshop
  const handleSuspendWorkshop = async () => {
    if (!selected) return;
    
    setSuspendingWorkshop(true);
    setWorkshopActionError(null);
    setWorkshopActionSuccess(null);

    try {
      const res = await fetch(`/api/workshops/${selected.id}/suspend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || "No se pudo suspender el taller");
      }

      const data = await res.json();
      
      if (data.already) {
        setWorkshopActionSuccess("El taller ya estaba suspendido");
      } else {
        setWorkshopActionSuccess("Taller suspendido exitosamente. Se notificó a los propietarios por email.");
      }

      setConfirmSuspendOpen(false);
      
      // Refresh workshop details
      await refreshWorkshopDetails();
      await refreshMembers();

      // Close drawer after successful suspension
      closeDrawer();

      // Clear success message after 5 seconds (if drawer is still open)
      setTimeout(() => {
        setWorkshopActionSuccess(null);
      }, 5000);
    } catch (e: any) {
      setWorkshopActionError(e?.message || "No se pudo suspender el taller");
    } finally {
      setSuspendingWorkshop(false);
    }
  };

  // Function to activate/approve workshop
  const handleActivateWorkshop = async () => {
    if (!selected) return;
    
    setSuspendingWorkshop(true);
    setWorkshopActionError(null);
    setWorkshopActionSuccess(null);

    try {
      const res = await fetch(`/api/workshops/${selected.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || "No se pudo activar el taller");
      }

      setWorkshopActionSuccess("Taller activado exitosamente");
      
      // Refresh workshop details
      await refreshWorkshopDetails();
      await refreshMembers();

      // Clear success message after 5 seconds
      setTimeout(() => {
        setWorkshopActionSuccess(null);
      }, 5000);
    } catch (e: any) {
      setWorkshopActionError(e?.message || "No se pudo activar el taller");
    } finally {
      setSuspendingWorkshop(false);
    }
  };

  // Function to save role changes
  const handleSaveRole = async () => {
    if (!selected || !selectedMember) return;
    
    setSavingRole(true);
    setRoleError(null);
    setRoleSuccess(null);

    try {
      // Validate role is selected
      if (!editingRoleId) {
        setRoleError("Debes seleccionar un rol");
        setSavingRole(false);
        return;
      }

      // Validate engineer fields if role is Engineer
      if (editingRoleId === ENGINEER_ROLE_ID) {
        if (!editingTitleName.trim()) {
          setRoleError("El título universitario es requerido para Ingenieros");
          setSavingRole(false);
          return;
        }
        if (!editingLicenseNumber.trim()) {
          setRoleError("El número de matrícula es requerido para Ingenieros");
          setSavingRole(false);
          return;
        }
        if (!editingEngineerKind) {
          setRoleError("Debes seleccionar el tipo de ingeniero (Titular o Suplente)");
          setSavingRole(false);
          return;
        }
      }

      // Prepare request body
      const body: any = {
        user_type_id: Number(editingRoleId),
      };

      // Add engineer-specific fields
      if (editingRoleId === ENGINEER_ROLE_ID) {
        body.title_name = editingTitleName.trim();
        body.license_number = editingLicenseNumber.trim();
        body.engineer_kind = editingEngineerKind;
      }

      // Make API call
      const res = await fetch(
        `/api/workshops/${selected.id}/members/${selectedMember.user_id}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || "No se pudo actualizar el rol");
      }

      setRoleSuccess("Rol actualizado correctamente");
      setIsEditingRole(false);

      // Refresh members list
      await refreshMembers();

      // Clear success message after 3 seconds
      setTimeout(() => {
        setRoleSuccess(null);
      }, 3000);
    } catch (e: any) {
      setRoleError(e?.message || "No se pudo actualizar el rol");
    } finally {
      setSavingRole(false);
    }
  };

  const DetailRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) => {
    return (
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-500 mb-0.5">{label}</div>
          <div className="text-sm text-gray-900 break-words">{value || "-"}</div>
        </div>
      </div>
    );
  };

  const workshopOwnerEmail = useMemo(() => {
    if (!members || members.length === 0) return "-";
    const norm = (v: unknown) => String(v ?? "").toLowerCase();
    const owners = members.filter((m) => {
      const r = norm(m.role);
      return r.includes("titular") || r.includes("owner") || r.includes("dueño");
    });
    const firstOwnerWithEmail = owners.find((m) => (m.email ?? "").trim().length > 0);
    if (firstOwnerWithEmail?.email) return firstOwnerWithEmail.email;
    const firstWithEmail = members.find((m) => (m.email ?? "").trim().length > 0);
    return firstWithEmail?.email || "-";
  }, [members]);

  return (
    <div className="p-1 sm:p-2 md:p-4 lg:p-6">
      {/* Filtros y acciones, fuera del card de tabla */}
      <div className="flex flex-row gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
        <div className="flex-1 flex items-center border border-gray-300 rounded-[4px] px-2 sm:px-3 py-1.5 sm:py-2 md:py-3 h-9 sm:h-10 md:h-12 focus-within:ring-2 focus-within:ring-[#0040B8] focus-within:border-transparent bg-white">
          <Search size={14} className="sm:w-[16px] sm:h-[16px] md:w-[18px] md:h-[18px] text-gray-500 mr-1 sm:mr-2 flex-shrink-0" />
          <input
            type="text"
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Buscar talleres..."
            className="w-full text-xs sm:text-sm md:text-base focus:outline-none bg-transparent"
          />
        </div>

        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          <button
            className="hidden sm:flex bg-white border border-[#0040B8] text-[#0040B8] px-3 md:px-4 py-2 sm:py-3 rounded-[4px] items-center justify-center gap-2 hover:bg-[#0040B8] hover:text-white transition-colors duration-200 font-medium text-sm h-10 md:h-12"
            onClick={handleRefresh}
          >
            <RefreshCcw size={16} className="w-4 h-4" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Controles de paginación superiores */}
      <div className="mt-1 w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div className="text-xs sm:text-sm text-gray-600">
          Mostrando{" "}
          <strong>{totalItems === 0 ? 0 : start + 1}-{Math.min(end, totalItems)}</strong>{" "}
          de <strong>{totalItems}</strong> talleres
        </div>
        
      </div>

      {/* Tabla en card - vista desktop */}
      <div className="hidden xl:block rounded-lg sm:rounded-[14px] border border-gray-200 overflow-hidden bg-white mt-2 sm:mt-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm sm:text-base">
            <thead className="bg-white text-gray-600">
              <tr className="border-b border-gray-200">
                <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">Nombre</th>
                <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">Razón Social</th>
                <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">Ciudad</th>
                <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">Provincia</th>
                <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">CUIT</th>
                <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pageWorkshops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 sm:py-12 md:py-20 text-xs sm:text-sm text-gray-600">
                    No hay talleres en el sistema.
                  </td>
                </tr>
              ) : (
                pageWorkshops.map((workshop) => {
                  return (
                    <tr key={workshop.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-2 sm:p-3 text-center">
                        <p className="text-xs sm:text-sm font-medium">{workshop.name}</p>
                      </td>
                      <td className="p-2 sm:p-3 text-center">
                        <p className="text-xs sm:text-sm text-gray-600 break-all max-w-[200px] mx-auto truncate">
                          {workshop.razon_social}
                        </p>
                      </td>
                      <td className="p-2 sm:p-3 text-center">
                        <p className="text-xs sm:text-sm">{workshop.city || "-"}</p>
                      </td>
                      <td className="p-2 sm:p-3 text-center">
                        <p className="text-xs sm:text-sm">{workshop.province || "-"}</p>
                      </td>
                      <td className="p-2 sm:p-3 text-center">
                        <p className=" text-xs sm:text-sm">{workshop.cuit || "-"}</p>
                      </td>
                      <td className="p-0">
                        <div className="flex justify-center items-center gap-2 sm:gap-3 h-full min-h-[48px] px-2 sm:px-3">
                          <button
                            type="button"
                            className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Ver detalles"
                            onClick={() => openDrawer(workshop)}
                          >
                            <EllipsisVertical size={14} className="sm:w-4 sm:h-4" />
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

      {/* Vista de cards para mobile/tablet */}
      <div className="xl:hidden mt-2 sm:mt-3 space-y-2 sm:space-y-3">
        {pageWorkshops.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-xs sm:text-sm text-gray-600 bg-white rounded-lg border border-gray-200 p-4">
            No hay talleres en el sistema.
          </div>
        ) : (
          pageWorkshops.map((workshop) => {
            return (
              <div
                key={workshop.id}
                className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
                      {workshop.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="cursor-pointer text-[#0040B8] hover:opacity-80 p-1.5 rounded hover:bg-blue-50 transition-colors flex-shrink-0 ml-2"
                    title="Ver detalles"
                    onClick={() => openDrawer(workshop)}
                  >
                    <EllipsisVertical size={18} className="sm:w-5 sm:h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div>
                    <div className="text-gray-500 mb-0.5">Razón Social</div>
                    <div className="text-gray-900 break-all">{workshop.razon_social || "-"}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <div className="text-gray-500 mb-0.5">Ciudad</div>
                      <div className="text-gray-900">{workshop.city || "-"}</div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-0.5">Provincia</div>
                      <div className="text-gray-900">{workshop.province || "-"}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-0.5">CUIT</div>
                    <div className="text-gray-900">{workshop.cuit || "-"}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Controles de paginación inferiores */}
      <div className="w-full flex items-center justify-between gap-2 sm:gap-3 mt-3 sm:mt-4">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`px-2 py-1 rounded border text-xs ${
            currentPage <= 1 ? "text-gray-400 border-gray-200" : "text-[#0040B8] border-[#0040B8]"
          }`}
        >
          Anterior
        </button>

        <div className="flex items-center gap-1 text-xs sm:text-sm flex-wrap justify-center">
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
              {currentPage > 3 && <span className="px-1 sm:px-2">...</span>}
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
              {currentPage < totalPages - 2 && <span className="px-1 sm:px-2">...</span>}
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
          className={`px-2 py-1 rounded border text-xs ${
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
        className={`fixed right-0 top-0 z-50 h-full w-full sm:w-[800px] bg-white shadow-2xl transform transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b">
          <h2 className="text-sm sm:text-base md:text-lg font-semibold truncate">
            {selected ? selected.name : "Detalle de taller"}
          </h2>
          <button
            ref={closeBtnRef}
            onClick={closeDrawer}
            className="p-1.5 sm:p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0040B8]"
            aria-label="Cerrar panel"
            title="Cerrar"
          >
            <X size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>

        <div className="p-3 sm:p-4 overflow-y-auto h-[calc(100%-56px)]">
          {selected ? (
            <div className="space-y-4 sm:space-y-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <div className="text-xs sm:text-sm text-gray-500">Cargando información del taller...</div>
                </div>
              ) : errorMsg ? (
                <div className="text-red-600 text-xs sm:text-sm border border-red-200 bg-red-50 rounded-lg sm:rounded-[14px] px-3 sm:px-4 py-2 sm:py-3">
                  {errorMsg}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0040B8]/10 flex items-center justify-center text-[#0040B8] font-semibold text-sm sm:text-base">
                      {selected.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-medium">{selected.name}</p>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{selected.razon_social}</p>
                    </div>
                  </div>

                  <div className="-mx-4 divide-y divide-gray-200">
                    <Row label="Ciudad" value={selected.city} />
                    <Row label="Provincia" value={selected.province} />
                    <Row label="Dirección" value={selected.address} />
                    <Row label="CUIT" value={selected.cuit} />
                    <Row label="Email del taller" value={loadingDetail ? "Cargando..." : workshopOwnerEmail} />
                    <Row label="Teléfono" value={selected.phone} />
                    <Row label="Número de Planta" value={selected.plant_number} />
                    <Row label="Número de Disposición" value={selected.disposition_number} />
                    <Row label="Inspecciones Disponibles" value={selected.available_inspections} />
                  </div>

                  {/* Personal Asignado */}
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center gap-2">
                      <Users size={14} className="sm:w-4 sm:h-4 text-[#0040B8]" />
                      Personal Asignado ({members.length})
                    </h4>
                    <div className="border border-gray-200 rounded-[14px] overflow-hidden">
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
                                  {(() => {
                                    const tone = toneFor(String(m.role));
                                    return (
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${tone.bg} ${tone.text}`}>
                                        {formatRole(m)}
                                      </span>
                                    );
                                  })()}
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    className="inline-flex items-center justify-center p-2 rounded-[4px] border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors"
                                    onClick={() => openMemberDetails(m)}
                                    title="Ver detalles"
                                  >
                                    <MoreVertical size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Botón para suspender/activar taller */}
                    <div className="mt-4 flex justify-center">
                      {selected.is_approved === false ? (
                        <button
                          onClick={handleActivateWorkshop}
                          disabled={suspendingWorkshop}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle size={16} />
                          {suspendingWorkshop ? "Activando..." : "Activar taller"}
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmSuspendOpen(true)}
                          disabled={suspendingWorkshop}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] text-sm font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <AlertTriangle size={16} />
                          Suspender taller
                        </button>
                      )}
                    </div>

                    {/* Mensajes de error y éxito para acciones del taller */}
                    {workshopActionError && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-[4px] px-3 py-2 text-sm text-red-700">
                        {workshopActionError}
                      </div>
                    )}
                    {workshopActionSuccess && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-[4px] px-3 py-2 text-sm text-green-700">
                        {workshopActionSuccess}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Selecciona un taller para ver sus datos.</p>
          )}
        </div>

        {/* Member side panel */}
        {selectedMember && (
          <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white border-l shadow-xl z-[51] flex flex-col">
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
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                    <User size={14} className="text-[#0040B8]" />
                    Información Personal
                  </h5>
                  {!isEditingRole && (
                    <button
                      onClick={() => setIsEditingRole(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#0040B8] border border-[#0040B8] rounded-[4px] hover:bg-[#0040B8] hover:text-white transition-colors"
                    >
                      <Edit size={12} />
                      Editar rol
                    </button>
                  )}
                </div>
                <div className="bg-gray-50 rounded-[14px] p-4 space-y-3 border border-gray-100">
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
                  {isEditingRole ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                          Rol
                        </label>
                        <select
                          className="w-full rounded-[4px] border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
                          value={editingRoleId}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : "";
                            setEditingRoleId(val);
                            // Clear engineer fields if not engineer
                            if (val !== ENGINEER_ROLE_ID) {
                              setEditingTitleName("");
                              setEditingLicenseNumber("");
                              setEditingEngineerKind("");
                            }
                          }}
                          disabled={savingRole}
                        >
                          <option value="">Seleccionar rol</option>
                          {FIXED_ROLES.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Engineer-specific fields */}
                      {editingRoleId === ENGINEER_ROLE_ID && (
                        <div className="space-y-3 pt-2 border-t border-gray-200">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Título universitario <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              className="w-full rounded-[4px] border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
                              value={editingTitleName}
                              onChange={(e) => setEditingTitleName(e.target.value)}
                              placeholder="Ej: Ingeniero Mecánico"
                              disabled={savingRole}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Número de matrícula <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              className="w-full rounded-[4px] border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
                              value={editingLicenseNumber}
                              onChange={(e) => setEditingLicenseNumber(e.target.value)}
                              placeholder="Ej: 12345"
                              disabled={savingRole}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1.5">
                              Tipo de ingeniero <span className="text-red-500">*</span>
                            </label>
                            <select
                              className="w-full rounded-[4px] border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent"
                              value={editingEngineerKind}
                              onChange={(e) => setEditingEngineerKind(e.target.value as "Titular" | "Suplente" | "")}
                              disabled={savingRole}
                            >
                              <option value="">Seleccionar tipo</option>
                              <option value="Titular">Titular</option>
                              <option value="Suplente">Suplente</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <DetailRow 
                      icon={<Briefcase size={16} className="text-gray-500" />}
                      label="Rol" 
                      value={formatRole(selectedMember)} 
                    />
                  )}
                </div>
              </div>

              {/* Información de Contacto */}
              <div>
                <h5 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Mail size={14} className="text-[#0040B8]" />
                  Información de Contacto
                </h5>
                <div className="bg-gray-50 rounded-[14px] p-4 space-y-3 border border-gray-100">
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

              {/* Información Profesional (solo para Ingenieros) - Solo mostrar si no está editando */}
              {!isEditingRole && (String(selectedMember.role).toLowerCase() === "ingeniero" || 
                String(selectedMember.role).toLowerCase() === "ingeniería" ||
                getRoleIdFromMember(selectedMember) === ENGINEER_ROLE_ID) && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Award size={14} className="text-[#0040B8]" />
                    Información Profesional
                  </h5>
                  <div className="bg-blue-50 rounded-[14px] p-4 space-y-3 border border-blue-100">
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
                    {selectedMember.engineer_kind && (
                      <DetailRow 
                        icon={<Briefcase size={16} className="text-blue-600" />}
                        label="Tipo de ingeniero" 
                        value={selectedMember.engineer_kind} 
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Error and success messages */}
              {roleError && (
                <div className="bg-red-50 border border-red-200 rounded-[4px] px-3 py-2 text-sm text-red-700">
                  {roleError}
                </div>
              )}
              {roleSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-[4px] px-3 py-2 text-sm text-green-700">
                  {roleSuccess}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-3 border-t bg-gray-50">
              {isEditingRole ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditingRole(false);
                      setRoleError(null);
                      setRoleSuccess(null);
                      // Reset to original values
                      if (selectedMember) {
                        const currentRoleId = getRoleIdFromMember(selectedMember);
                        setEditingRoleId(currentRoleId || "");
                        if (currentRoleId === ENGINEER_ROLE_ID) {
                          setEditingTitleName(selectedMember.title_name || "");
                          setEditingLicenseNumber(selectedMember.license_number || "");
                          setEditingEngineerKind((selectedMember.engineer_kind as "Titular" | "Suplente") || "");
                        } else {
                          setEditingTitleName("");
                          setEditingLicenseNumber("");
                          setEditingEngineerKind("");
                        }
                      }
                    }}
                    disabled={savingRole}
                    className="px-4 py-2 rounded-[4px] text-sm font-medium bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveRole}
                    disabled={savingRole}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] text-sm font-medium bg-[#0040B8] text-white hover:bg-[#0030A0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save size={14} />
                    {savingRole ? "Guardando..." : "Guardar"}
                  </button>
                </>
              ) : (
                <button
                  onClick={closeMemberModal}
                  className="px-4 py-2 rounded-[4px] text-sm font-medium bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal de confirmación para suspender taller */}
        {confirmSuspendOpen && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center"
            aria-modal="true"
            role="dialog"
            aria-labelledby="suspend-title"
            aria-describedby="suspend-desc"
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmSuspendOpen(false)} />
            <div className="relative bg-white w-[92%] max-w-md rounded-[10px] shadow-xl border border-gray-200 p-5">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <AlertTriangle size={20} className="text-amber-600" />
                </div>
                <div className="min-w-0">
                  <h3 id="suspend-title" className="text-base font-semibold">
                    Confirmar suspensión
                  </h3>
                  <p id="suspend-desc" className="mt-1 text-sm text-gray-600">
                    ¿Estás seguro de que querés suspender el taller "{selected?.name}"?. Esta acción suspenderá el taller y todos sus usuarios. Se enviará una notificación por email a los propietarios del taller.
                  </p>
                </div>
              </div>

              {workshopActionError && (
                <p className="mt-3 text-sm text-rose-700">{workshopActionError}</p>
              )}

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmSuspendOpen(false)}
                  disabled={suspendingWorkshop}
                  className="px-4 py-2 rounded-[4px] border border-gray-300 bg-white text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSuspendWorkshop}
                  disabled={suspendingWorkshop}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm"
                >
                  <AlertTriangle size={16} />
                  {suspendingWorkshop ? "Suspendiendo..." : "Sí, suspender"}
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}