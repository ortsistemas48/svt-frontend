"use client";

import Link from "next/link";
import {
  Eye,
  EyeOff,
  Shield,
  ChevronDown as ChevronIcon,
  User,
  X,
  LogOut,
  ChevronRight,
  PanelLeftClose,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";
import SideBarMenu from "@/components/AdminSidebarMenu";
import WorkshopItem from "@/components/WorkshopItem";
import { UserTypeInWorkshop } from "@/app/types";
import UserProfile from "../UserProfile";

type SidebarProps = {
  onToggleSidebar?: () => void; // <- NUEVO: el padre controla abrir, cerrar
};

export default function Sidebar({ onToggleSidebar }: SidebarProps) {
  const { user } = useUser();
  const { id } = useParams();
  const router = useRouter();
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  // Estados para teléfono
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState<string>((user as any)?.phone_number || "");
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneMsg, setPhoneMsg] = useState<string | null>(null);

  const [userType, setUserType] = useState<UserTypeInWorkshop | null>(null);
  const [loading, setLoading] = useState(false);
  const [openWorkshops, setOpenWorkshops] = useState(true);
  const [openProfileModal, setOpenProfileModal] = useState(false);
  const [activeSection, setActiveSection] = useState<'perfil' | 'seguridad'>('perfil');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
    });

  // hint de scroll
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  async function handleSavePhone() {
    setPhoneMsg(null);
    if (!phoneValue?.trim()) {
      setPhoneMsg("Ingresá un teléfono válido");
      return;
    }
    try {
      setSavingPhone(true);
      const res = await fetch(`/api/auth/me/phone`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneValue.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        setPhoneMsg(json?.error || "No se pudo actualizar el teléfono");
        return;
      }
      setPhoneMsg("Teléfono actualizado");
      setEditingPhone(false);

      router.refresh?.();
    } catch (e) {
      setPhoneMsg("Error de red, intentá de nuevo");
    } finally {
      setSavingPhone(false);
    }
  }

  async function handleSavePassword() {
    setPwMsg(null);
    if (!pwCurrent || !pwNew || !pwConfirm) {
      setPwMsg("Completá todos los campos");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwMsg("Las contraseñas nuevas no coinciden");
      return;
    }
    if (pwNew.length < 8) {
      setPwMsg("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    try {
      setSavingPw(true);
      const res = await fetch(`/api/auth/change-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: pwCurrent,
          new_password: pwNew,
          confirm_new_password: pwConfirm,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPwMsg(json?.error || "No se pudo actualizar la contraseña");
        return;
      }
      setPwMsg("Contraseña actualizada correctamente");
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
    } catch (e) {
      setPwMsg("Error de red, intentá de nuevo");
    } finally {
      setSavingPw(false);
    }
  }

  const logOutFunction = async () => {
    try {
      const res = await fetch(`/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return;
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Error de red:", err);
    }
  };


  const nudgeScrollDown = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ top: 240, behavior: "smooth" });
  };

  const fullName = `${user?.first_name} ${user?.last_name}`|| "Usuario";

  return (
    <aside className="overflow-hidden relative h-[calc(100vh-32px)] w-[290px] max-[1500px]:w-[256px] bg-white md:shadow rounded-[14px] p-4">
      {/* HEADER: logo + botón cerrar */}
      <div className="mb-6 flex items-center justify-between px-1">
        <Link
          href={`/dashboard/${id ?? ""}`}
          className="flex items-center gap-2 group"
          aria-label="Ir al inicio"
        >
          {/* logo minimal, podés reemplazar por <img src="/logo.svg" .../> */}
          <img src="/images/logo.svg" alt="" />
        </Link>

        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden inline-flex h-8 w-8 items-center justify-center"
          aria-label="Cerrar sidebar"
          title="Cerrar sidebar"
        >
          <PanelLeftClose className="h-5 w-5 text-[#0040B8]" />
        </button>
      </div>

      {/* Scroll interno */}
      <div
        ref={scrollRef}
        className="relative h-full overflow-y-auto pb-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* Header usuario clickeable, corregido sin button dentro de button */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpenProfileModal(true)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpenProfileModal(true);
            }
          }}
          className="w-full flex items-center justify-between rounded-[8px] p-3 "
          aria-label="Abrir perfil"
          title="Abrir perfil"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <UserProfile />
              <span className="absolute -right-0 -bottom-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
            </div>
            <div className="min-w-0 text-left">
              <p className="text-sm font-medium text-gray-900 truncate">{fullName}</p>
              <p className="text-xs text-gray-500 mt-1 truncate">
                Administrador
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-400 ml-6 shrink-0" />
        </div>

        <div className="my-4 h-px bg-gray-200" />

        {/* Menú principal */}
        <p className="px-3 text-[11px] tracking-wide text-black/50 mb-2">Menú</p>
        <SideBarMenu userId={user?.id} userType={userType} loading={loading} />


        {/* Ajustes */}
        <div className="mt-6 border-t border-gray-200 pt-5 pb-10 px-1">
          <div className="flex flex-col space-y-3">
            <button onClick={logOutFunction}>
              <div className="group flex items-center gap-3 rounded-[4px] px-3 py-3 hover:bg-red-50 duration-150 transition-colors">
                <LogOut size={20} className="text-red-600" />
                <span className="text-sm text-red-600">Cerrar sesión</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Indicador de más contenido abajo */}
      <div
        className={[
          "pointer-events-none absolute inset-x-0 bottom-0 px-4 transition-opacity duration-300",
          showScrollHint ? "opacity-100" : "opacity-0",
        ].join(" ")}
        aria-hidden={!showScrollHint}
      >
        <div className="h-12 w-full bg-gradient-to-t from-white to-white/0 rounded-b-[10px]" />
        <div className="pointer-events-auto absolute inset-x-0 bottom-6 flex justify-center">
          <button
            type="button"
            onClick={nudgeScrollDown}
            className="group inline-flex items-center justify-center h-8 w-8 rounded-full bg-white shadow border border-slate-200"
            aria-label="Ver más contenido"
            title="Ver más contenido"
          >
            <ChevronIcon
              size={18}
              className="text-slate-500 transition-transform group-hover:translate-y-[2px]"
            />
          </button>
        </div>
      </div>

      {/* Modal perfil */}
      {openProfileModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          onKeyDown={e => e.key === "Escape" && setOpenProfileModal(false)}
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenProfileModal(false)} />
          <div className="relative w-[900px] max-w-[95vw] bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <UserProfile />
                  <span className="absolute -right-0 -bottom-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">{fullName}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button
                className="p-2 rounded-[4px] hover:bg-gray-100"
                onClick={() => setOpenProfileModal(false)}
                aria-label="Cerrar"
                title="Cerrar"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-[220px_1fr]">
              <div className="bg-gray-50/60 border-r p-4">
                <ul className="space-y-2">
                  <li>
                    <button className="w-full text-left px-3 py-2 rounded-[4px] bg-white shadow-sm text-sm font-medium">
                      General
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left px-3 py-2 rounded-[4px] hover:bg-white text-sm">
                      Perfil
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left px-3 py-2 rounded-[4px] hover:bg-white text-sm">
                      Notificaciones
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left px-3 py-2 rounded-[4px] hover:bg-white text-sm">
                      Suscripción
                    </button>
                  </li>
                </ul>

                <div className="mt-6">
                  <button
                    onClick={logOutFunction}
                    className="w-full text-left px-3 py-2 rounded-[4px] text-red-600 hover:bg-red-50 text-sm"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">General</h2>
                <div className="space-y-6 max-w-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Username</span>
                    <span className="text-sm text-gray-900">{fullName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email</span>
                    <span className="text-sm text-gray-900">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ejemplo</span>
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-[#0040B8] transition" />
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ejemplo</span>
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-[#0040B8] transition" />
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ejemplo</span>
                    <label className="inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-[#0040B8] transition" />
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ejemplo</span>
                    <select className="text-sm border rounded-[4px] px-2 py-1">
                      <option>Ejemplo</option>
                      <option>Opción 2</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {openProfileModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          onKeyDown={e => e.key === "Escape" && setOpenProfileModal(false)}
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenProfileModal(false)} />
          <div className="relative w-[900px] max-w-[95vw] bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <UserProfile />
                  <span className="absolute -right-0 -bottom-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">{fullName}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
              <button
                className="p-2 rounded-[4px] hover:bg-gray-100"
                onClick={() => setOpenProfileModal(false)}
                aria-label="Cerrar"
                title="Cerrar"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-[220px_1fr] min-h-[500px]">
              <div className="bg-gray-50/60 border-r p-4 flex flex-col">
                <ul className="space-y-2 flex-1">
                  <li>
                    <button 
                      onClick={() => setActiveSection('perfil')}
                      className={`w-full text-left px-3 py-2 rounded-[4px] text-sm flex items-center gap-2 transition-colors ${
                        activeSection === 'perfil' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'hover:bg-white text-gray-700'
                      }`}
                    >
                      <User size={16} className={activeSection === 'perfil' ? 'text-blue-700' : 'text-gray-500'} />
                      Perfil
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setActiveSection('seguridad')}
                      className={`w-full text-left px-3 py-2 rounded-[4px] text-sm flex items-center gap-2 transition-colors ${
                        activeSection === 'seguridad' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'hover:bg-white text-gray-700'
                      }`}
                    >
                      <Shield size={16} className={activeSection === 'seguridad' ? 'text-blue-700' : 'text-gray-500'} />
                      Seguridad 
                    </button>
                  </li>
                </ul>
                <div className="mt-auto">
                  <button
                    onClick={logOutFunction}
                    className="w-full text-left px-3 py-2 rounded-[4px] text-red-600 hover:bg-red-50 text-sm flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeSection === 'perfil' ? (
                  <>
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Perfil</h2>
                    <div className="space-y-6 max-w-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Nombre</span>
                        <span className="text-sm text-gray-900">{user?.first_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Apellido</span>
                        <span className="text-sm text-gray-900">{user?.last_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Mail</span>
                        <span className="text-sm text-gray-900">{user?.email}</span>
                      </div>
                      <div className="flex items-start justify-between">
                        <span className="text-sm text-gray-600">Teléfono</span>

                        {!editingPhone ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900">
                              {phoneValue || "Sin teléfono"}
                            </span>
                            <button
                              type="button"
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={() => setEditingPhone(true)}
                              title="Editar teléfono"
                              aria-label="Editar teléfono"
                            >
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end gap-2 w-64">
                            <input
                              type="tel"
                              value={phoneValue}
                              onChange={e => setPhoneValue(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Ej, 3511234567"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => { setEditingPhone(false); setPhoneMsg(null); setPhoneValue((user as any)?.phone_number || ""); }}
                                className="px-3 py-1.5 rounded-[4px] border"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={handleSavePhone}
                                disabled={savingPhone}
                                className="px-4 py-1.5 rounded-[4px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                              >
                                {savingPhone ? "Guardando..." : "Guardar"}
                              </button>
                            </div>
                            {phoneMsg && (
                              <p className={`text-xs ${phoneMsg.includes("actualizado") ? "text-green-600" : "text-red-600"}`}>
                                {phoneMsg}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">DNI</span>
                        <span className="text-sm text-gray-900">{(user as any)?.dni || '49971253'}</span>
                      </div>
                      
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Seguridad</h2>
                    <div className="space-y-6 max-w-xl">
                    <div>
                    <label className="block text-sm text-gray-600 mb-2">Contraseña actual</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={pwCurrent}
                        onChange={e => setPwCurrent(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ingresa tu contraseña actual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Contraseña nueva</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        value={pwNew}
                        onChange={e => setPwNew(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ingresa tu nueva contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Repetir nueva contraseña</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={pwConfirm}
                        onChange={e => setPwConfirm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Repite tu nueva contraseña"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    {pwMsg && (
                      <p className={`text-sm ${pwMsg.includes("actualizada") ? "text-green-600" : "text-red-600"}`}>
                        {pwMsg}
                      </p>
                    )}
                    <button
                      onClick={handleSavePassword}
                      disabled={savingPw}
                      className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-[4px] hover:bg-blue-700 disabled:opacity-60"
                    >
                      {savingPw ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                  </div>

                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
