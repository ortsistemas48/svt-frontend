'use client';
import { EllipsisVertical, RefreshCcw, Search, ChevronDown, Check, Crown, Wrench, Headphones, CheckCircle2, XCircle, X, Mail, Shield, Trash2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import clsx from "clsx";
import { useUser } from "@/context/UserContext";

type AnyUser = {
  id: string | number;
  first_name?: string;
  last_name?: string;
  email?: string;
  dni?: string;
  phone?: string;
  phone_number?: string;
  role?: string;
  address?: string;
  city?: string;
  province?: string;
  created_at?: string;
  updated_at?: string;
  title_name?: string;
  license_number?: string;
  last_login?: string;
  [key: string]: any;
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  Admin: Crown,
  Ingeniero: Wrench,
  Operador: Shield,
  Soporte: Headphones,
  Activo: CheckCircle2,
  Inactivo: XCircle,
};

function RoleDropdown({
  value,
  roles,
  onChange,
}: {
  value: string;
  roles: readonly string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement|null>(null);
  const listRef = useRef<HTMLDivElement|null>(null);
  const [active, setActive] = useState<number>(-1);

  const tone = toneFor(value);
  const Icon = ROLE_ICONS[value] || Shield;

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, roles.findIndex(r => r.toLowerCase() === value?.toLowerCase())));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); btnRef.current?.focus(); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => {
          const next = e.key === "ArrowDown" ? i + 1 : i - 1;
          if (i < 0) return 0;
          return Math.min(Math.max(next, 0), roles.length - 1);
        });
      }
      if (e.key === "Enter" && active >= 0) {
        onChange(roles[active]);
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onDoc = (e: MouseEvent) => {
      if (!listRef.current || !btnRef.current) return;
      if (listRef.current.contains(e.target as Node) || btnRef.current.contains(e.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDoc); };
  }, [open, active, roles, value, onChange]);

  return (
    <div className="relative inline-block w-full">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        className={clsx(
          "w-full inline-flex items-center justify-between rounded-[4px] border px-3 py-2 text-sm bg-white",
          "focus:outline-none focus:ring-2 focus:ring-[#0040B8] focus:border-transparent transition"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value ? (
          <span className={clsx("inline-flex items-center gap-2 px-2 py-1 rounded-full", tone.bg, tone.text)}>
            <span className={clsx("h-2 w-2 rounded-full",
              tone.text.includes("indigo") ? "bg-indigo-500" :
              tone.text.includes("emerald") ? "bg-emerald-500" :
              tone.text.includes("sky") ? "bg-sky-500" :
              tone.text.includes("amber") ? "bg-amber-500" :
              tone.text.includes("green") ? "bg-green-500" :
              tone.text.includes("rose") ? "bg-rose-500" : "bg-gray-400"
            )} />
            <Icon size={14} />
            {value}
          </span>
        ) : (
          <span className="text-gray-500">Seleccionar rol</span>
        )}
        <ChevronDown size={16} className="text-gray-500" />
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 mt-2 w-64 rounded-[10px] border border-gray-200 bg-white shadow-lg p-1"
        >
          {roles.map((r, i) => {
            const t = toneFor(r);
            const RIcon = ROLE_ICONS[r] || Shield;
            const isSel = r.toLowerCase() === value?.toLowerCase();
            const isAct = i === active;
            return (
              <button
                key={r}
                role="option"
                aria-selected={isSel}
                onMouseEnter={() => setActive(i)}
                onClick={() => { onChange(r); setOpen(false); btnRef.current?.focus(); }}
                className={clsx(
                  "w-full flex items-center gap-2 px-2 py-2 rounded-[4px] text-sm text-left",
                  isAct ? "bg-gray-100" : "bg-white"
                )}
              >
                <span className={clsx(
                  "h-2 w-2 rounded-full",
                  t.text.includes("indigo") ? "bg-indigo-500" :
                  t.text.includes("emerald") ? "bg-emerald-500" :
                  t.text.includes("sky") ? "bg-sky-500" :
                  t.text.includes("amber") ? "bg-amber-500" :
                  t.text.includes("green") ? "bg-green-500" :
                  t.text.includes("rose") ? "bg-rose-500" : "bg-gray-400"
                )} />
                <RIcon size={16} className={t.text} />
                <span className="flex-1">{r}</span>
                {isSel && <Check size={16} className="text-gray-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// mapa de “estado/rol” -> tonos
function toneFor(value?: string) {
  const v = (value || "").toLowerCase();
  if (["titular"].some(k => v.includes(k))) return { text: "text-indigo-700", bg: "bg-indigo-50" };
  if (["ingeniero"].some(k => v.includes(k))) return { text: "text-emerald-700", bg: "bg-emerald-50" };
  if (["personal de planta"].some(k => v.includes(k))) return { text: "text-sky-700", bg: "bg-sky-50" };
  if (["administrativo"].some(k => v.includes(k))) return { text: "text-sky-700", bg: "bg-sky-50" };
  if (["soporte"].some(k => v.includes(k))) return { text: "text-amber-700", bg: "bg-amber-50" };
  if (["activo", "active"].some(k => v.includes(k))) return { text: "text-green-700", bg: "bg-green-50" };
  if (["inactivo", "suspendido", "inactive", "suspended"].some(k => v.includes(k))) return { text: "text-rose-700", bg: "bg-rose-50" };
  return { text: "text-gray-700", bg: "bg-gray-100" };
}

const ROLES = ["Titular", "Administrativo", "Ingeniero", "Personal de planta"] as const;
type RoleOption = typeof ROLES[number];


export default function UserTable({ users }: { users: AnyUser[] }) {
  const [searchText, setSearchText] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AnyUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { id } = useParams();
  const [roleValue, setRoleValue] = useState<string>("");
  const [savingRole, setSavingRole] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [roleOk, setRoleOk] = useState<string | null>(null);
  const { user } = useUser();

  const router = useRouter();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const filteredUsers = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const fn = (u.first_name || "").toLowerCase();
      const ln = (u.last_name || "").toLowerCase();
      const dni = (u.dni || "").toLowerCase();
      const ph = (u.phone || u.phone_number || "").toLowerCase();
      const role = (u.role || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return fn.includes(q) || ln.includes(q) || email.includes(q) || dni.includes(q) || ph.includes(q) || role.includes(q);
    });
  }, [users, searchText]);

  const engineersCount = useMemo(() => {
    return users.filter((u) => (u.role || "").toLowerCase().includes("ingeniero")).length;
  }, [users]);

  const disableUnlinkReason = useMemo(() => {
    if (!selected) return null;
    if (String(selected.id) === String(user.id)) {
      return "No podés desvincularte a vos mismo.";
    }
    if ((selected.role || "").toLowerCase().includes("ingeniero") && engineersCount <= 1) {
      return "No se puede desvincular al último Ingeniero del taller.";
    }
    return null;
  }, [selected, user.id, engineersCount]);

  const handleRefresh = () => router.refresh();

  function openDrawer(user: AnyUser) {
    setSelected(user);
    setRoleValue(user.role || "");
    setRoleError(null);
    setRoleOk(null);
    setOpen(true);
  }
  function closeDrawer() {
    setOpen(false);
    setTimeout(() => {
      setSelected(null);
      setRoleError(null);
      setRoleOk(null);
    }, 200);
  }

  function handleAskDelete() {
    if (!selected) return;
    const isSelf = String(selected.id) === String(user.id);
    const isEngineer = (selected.role || "").toLowerCase().includes("ingeniero");
    const isLastEngineer = isEngineer && engineersCount <= 1;
    if (isSelf) {
      setDeleteError("No podés desvincularte a vos mismo.");
      setConfirmOpen(false);
      return;
    }
    if (isLastEngineer) {
      setDeleteError("No se puede desvincular al último Ingeniero del taller.");
      setConfirmOpen(false);
      return;
    }
    setDeleteError(null);
    setConfirmOpen(true);
  }

  async function doDelete(workshopId: number) {
    if (!selected) return;
    try {
      // Server-side guard redundante por seguridad
      const isSelf = String(selected.id) === String(user.id);
      const isEngineer = (selected.role || "").toLowerCase().includes("ingeniero");
      const isLastEngineer = isEngineer && engineersCount <= 1;
      if (isSelf) {
        setDeleteError("No podés desvincularte a vos mismo.");
        return;
      }
      if (isLastEngineer) {
        setDeleteError("No se puede desvincular al último Ingeniero del taller.");
        return;
      }

      setDeleting(true);
      setDeleteError(null);

      const url = `/api/workshops/${encodeURIComponent(workshopId)}/members/${encodeURIComponent(selected.id)}`;

      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const body = await res.json().catch(() => ({} as any));
      if (!res.ok || body?.ok !== true) {
        throw new Error(body?.error || `Error ${res.status}`);
      }

      setConfirmOpen(false);
      closeDrawer();
      router.refresh();
    } catch (err: any) {
      setDeleteError(err?.message || "No se pudo desvincular");
    } finally {
      setDeleting(false);
    }
  }

  async function saveRole(workshopId: number) {
    if (!selected) return;
    try {
      setSavingRole(true);
      setRoleError(null);
      setRoleOk(null);

      const url = `/api/workshops/${encodeURIComponent(workshopId)}/members/${encodeURIComponent(selected.id)}/role`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: roleValue }),
      });

      const body = await res.json().catch(() => ({} as any));
      if (!res.ok || body?.ok !== true) {
        throw new Error(body?.error || `Error ${res.status}`);
      }

      // Optimista: actualizá el seleccionado para reflejar el nuevo tono/rol
      const updated = { ...selected, role: roleValue };
      setSelected(updated);
      setRoleOk("Rol actualizado");
      // si querés refrescar servidor: router.refresh();
    } catch (err: any) {
      setRoleError(err?.message || "No se pudo actualizar el rol");
    } finally {
      setSavingRole(false);
    }
  }


  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeDrawer(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setTimeout(() => closeBtnRef.current?.focus(), 0);
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const fullName = (u?: AnyUser | null) => [u?.first_name, u?.last_name].filter(Boolean).join(" ") || "Sin nombre";
  const initials = (u?: AnyUser | null) => {
    const a = (u?.first_name || "").trim(); const b = (u?.last_name || "").trim();
    return ((a ? a[0] : "") + (b ? b[0] : "") || "U").toUpperCase();
  };

  const Row = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="flex items-start justify-between py-2 px-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 max-w-[60%] text-right break-words">{value || "-"}</span>
    </div>
  );

  return (
    <div className="p-4 sm:p-6">
      {/* 3) Input y botones fuera del borde, por eso están fuera del card de la tabla */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
        <div className="flex-1 flex items-center border border-gray-300 rounded-[4px] px-3 py-2 sm:py-3 h-12 focus-within:ring-2 focus-within:ring-[#0040B8] focus-within:border-transparent bg-white">
          <Search size={18} className="text-gray-500 mr-2 flex-shrink-0" />
          <input
            type="text"
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Busca tus usuarios por nombre, email, DNI, rol o teléfono"
            className="w-full text-sm sm:text-base focus:outline-none bg-transparent"
          />
        </div>

        <div className="flex gap-2 sm:gap-3">
          {/* <button className="bg-[#0040B8] hover:bg-[#0035A0] text-white px-3 sm:px-4 py-2 sm:py-3 rounded-[4px] flex items-center justify-center gap-2 transition-colors duration-200 font-medium text-sm">
            <SlidersHorizontal size={16} />
            <span className="hidden sm:inline">Filtrar</span>
          </button> */}
          <button
            className="bg-white border border-[#0040B8] text-[#0040B8] px-3 sm:px-4 py-2 sm:py-3 rounded-[4px] flex items-center justify-center gap-2 hover:bg-[#0040B8] hover:text-white transition-colors duration-200 font-medium text-sm"
            onClick={handleRefresh}
          >
            <RefreshCcw size={16} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Card de la tabla con borde, input y botones quedaron afuera */}
      <div className="rounded-[10px] border border-gray-200 overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm sm:text-base">
            {/* 2) Header con fondo blanco */}
            <thead className="bg-white text-gray-600">
              <tr className="border-b border-gray-200">
                <th className="p-3 text-center text-xs sm:text-sm font-medium">Nombre</th>
                <th className="p-3 text-center text-xs sm:text-sm font-medium">Email</th>
                <th className="p-3 text-center text-xs sm:text-sm font-medium">DNI</th>
                <th className="p-3 text-center text-xs sm:text-sm font-medium">Teléfono</th>
                <th className="p-3 text-center text-xs sm:text-sm font-medium">Rol</th>
                <th className="p-3 text-center text-xs sm:text-sm font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 sm:py-20 text-gray-600 text-sm sm:text-base">
                    No hay usuarios en este taller.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const phone = user.phone_number || user.phone || "";
                  const tone = toneFor(user.role);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-center">
                        <p className="font-medium text-sm sm:text-base">{fullName(user)}</p>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-xs sm:text-sm text-gray-600 break-all max-w-[200px] mx-auto truncate">{user.email}</p>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-sm sm:text-base font-mono">{user.dni || "-"}</p>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-sm sm:text-base">{phone || "-"}</p>
                      </td>
                      <td className="p-3 text-center">
                        {/* 1) Pill con texto y fondo del mismo tono, más claro */}
                        <span className={`inline-block px-2 py-1 rounded-full text-xs sm:text-sm ${tone.text} ${tone.bg}`}>
                          {user.role || "-"}
                        </span>
                      </td>
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

      {/* Overlay y Drawer */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={closeDrawer}
        aria-hidden={!open}
      />
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

              {/* BLOQUE MEJORADO */}
              <div className="space-y-2">
                {(() => {
                  const tone = toneFor(roleValue || selected.role);
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${tone.text} ${tone.bg}`}>
                      <Shield size={12} /> {(roleValue || selected.role) || "Sin rol"}
                    </span>
                  );
                })()}

                <div className="flex items-center gap-2">
                  <RoleDropdown
                    value={roleValue || selected.role || ""}
                    roles={ROLES}
                    onChange={(v) => setRoleValue(v)}
                  />
                  <button
                    type="button"
                    onClick={() => saveRole(Number(id))}
                    disabled={savingRole || (roleValue || "") === (selected.role || "")}
                    className="inline-flex items-center gap-2 px-3 py-3 rounded-[4px] bg-[#0040B8] hover:bg-[#00379f] disabled:opacity-60 text-white text-sm"
                    title={(roleValue || "") === (selected.role || "") ? "No hay cambios" : undefined}
                  >
                    {savingRole ? "Cambiando..." : "Cambiar"}
                  </button>
                </div>

                {roleError && <p className="text-sm text-rose-700">{roleError}</p>}
                {roleOk && <p className="text-sm text-emerald-700">{roleOk}</p>}
              </div>


              {/* 4) Divisores a todo el ancho con -mx-4 */}
              <div className="-mx-4 divide-y divide-gray-200">
                <Row label="DNI" value={selected.dni as string} />
                <Row label="Teléfono" value={(selected.phone_number || selected.phone) as string} />
                {selected.role === 'Ingeniero' && (
                  <>
                    <Row label="Título" value={selected.title_name as string} />
                    <Row label="Matrícula" value={selected.license_number as string} />
                  </>
                )}
              </div>
              {/* Acciones peligrosas */}
              <div className="mt-4 p-4 ">
                {deleteError && (
                  <p className="text-sm text-rose-700 mb-2">{deleteError}</p>
                )}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleAskDelete}
                    disabled={deleting || Boolean(disableUnlinkReason)}
                    title={disableUnlinkReason || undefined}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm"
                  >
                    <Trash2 size={16} />
                    {deleting ? "Desvinculando..." : "Desvincular usuario del taller"}
                  </button>

                </div>
                {disableUnlinkReason && !deleting && (
                  <p className="mt-2 text-xs text-amber-700 text-center">{disableUnlinkReason}</p>
                )}
              </div>

            </div>
          ) : (
            <p className="text-sm text-gray-600">Selecciona un usuario para ver sus datos.</p>
          )}
        </div>
      </aside>
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          aria-modal="true"
          role="dialog"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-desc"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setConfirmOpen(false)}
          />

          {/* Modal card */}
          <div className="relative bg-white w-[92%] max-w-md rounded-[10px] shadow-xl border border-gray-200 p-5">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <div className="min-w-0">
                <h3 id="confirm-title" className="text-base font-semibold">
                  Confirmar desvinculación
                </h3>
                <p id="confirm-desc" className="mt-1 text-sm text-gray-600">
                  Vas a desvincular a {selected ? fullName(selected) : "este usuario"} del taller, esta acción es reversible desde administración.
                </p>
              </div>
            </div>

            {deleteError && (
              <p className="mt-3 text-sm text-rose-700">{deleteError}</p>
            )}

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
                onClick={() => doDelete(Number(id))}
                disabled={deleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm"
              >
                <Trash2 size={16} />
                {deleting ? "Desvinculando..." : "Sí, desvincular"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
