"use client";

import Link from "next/link";
import {
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronDown as ChevronIcon,
  ChevronRight,
  X,
  LogOut,
  PanelLeftClose,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";
import SideBarMenu from "@/components/SideBarMenu";
import WorkshopItem from "@/components/WorkshopItem";
import { UserTypeInWorkshop } from "@/app/types";
import UserProfile from "../UserProfile";

type SidebarProps = {
  onToggleSidebar?: () => void; // <- NUEVO: el padre controla abrir, cerrar
};

export default function Sidebar({ onToggleSidebar }: SidebarProps) {
  const { workshops, user } = useUser();
  const { id } = useParams();
  const router = useRouter();

  const [userType, setUserType] = useState<UserTypeInWorkshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [openWorkshops, setOpenWorkshops] = useState(true);
  const [openProfileModal, setOpenProfileModal] = useState(false);

  // hint de scroll
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

  const approvedWorkshops = useMemo(
    () => (workshops || []).filter(w => w.is_approved),
    [workshops]
  );

  const currentWorkshop = useMemo(
    () => approvedWorkshops.find(w => String(w.workshop_id) === String(id)),
    [approvedWorkshops, id]
  );

  const showWorkshops = approvedWorkshops.length > 1;

  const logOutFunction = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) return;
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Error de red:", err);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!user?.id || !id) return;
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/user-type-in-workshop?userId=${user.id}&workshopId=${id}`,
          { credentials: "include" }
        );
        if (res.ok) setUserType(await res.json());
        else console.error("Error fetching user type,", await res.text());
      } catch (e) {
        console.error("Error fetching user type,", e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user?.id, id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const canScroll = el.scrollHeight > el.clientHeight + 4;
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 16;
      setShowScrollHint(canScroll && !nearBottom);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [approvedWorkshops.length, openWorkshops, loading]);

  const handleWorkshopClick = (workshopId: number) => {
    if (workshopId.toString() !== String(id)) {
      router.push(`/dashboard/${workshopId}`);
    }
  };

  const nudgeScrollDown = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ top: 240, behavior: "smooth" });
  };

  const fullName = `${user?.first_name} ${user?.last_name}`|| "Usuario";

  return (
    <aside className="overflow-hidden relative h-[calc(100vh-32px)] w-[290px] max-[1500px]:w-[256px] bg-white md:shadow rounded-[10px] p-4">
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
          className="w-full flex items-center justify-between rounded-[8px] p-3 hover:bg-gray-50 transition cursor-pointer"
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
                Rol: {userType?.name}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-400 ml-6 shrink-0" />
        </div>

        <div className="my-4 h-px bg-gray-200" />

        {/* Menú principal */}
        <p className="px-3 text-[11px] tracking-wide text-black/50 mb-2">Menú</p>
        <SideBarMenu userId={user?.id} userType={userType} loading={loading} />

        {/* Talleres */}
        {showWorkshops && (
          <>
            <div className="my-4 h-px bg-gray-200" />
            <button
              type="button"
              onClick={() => setOpenWorkshops(v => !v)}
              className="mb-4 flex w-full items-center justify-between px-3"
              aria-expanded={openWorkshops}
              aria-controls="workshops-list"
            >
              <p className="text-[11px] tracking-wide text-black/50">Tus talleres</p>
              <ChevronDown
                size={16}
                className={`transition-transform ${openWorkshops ? "rotate-180" : ""} text-gray-400`}
              />
            </button>

            {openWorkshops ? (
              <div id="workshops-list" className="space-y-2 pl-2">
                {approvedWorkshops.map(w => (
                  <WorkshopItem
                    key={w.workshop_id}
                    name={w.workshop_name}
                    selected={String(id) === String(w.workshop_id)}
                    onClick={() => handleWorkshopClick(w.workshop_id)}
                  />
                ))}
                <Link href="/dashboard/register-workshop">
                  <div className="mt-4 flex items-center gap-2 rounded-[4px] border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    <svg width="18" height="18" viewBox="0 0 24 24" className="text-[#0040B8]">
                      <path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" />
                    </svg>
                    Inscribir taller
                  </div>
                </Link>
              </div>
            ) : (
              <div id="workshops-list">
                <WorkshopItem
                  name={currentWorkshop?.workshop_name || "Taller actual"}
                  selected
                  onClick={() =>
                    currentWorkshop && handleWorkshopClick(currentWorkshop.workshop_id)
                  }
                />
              </div>
            )}
          </>
        )}

        {/* Ajustes */}
        <div className="mt-6 border-t border-gray-200 pt-5 pb-10 px-1">
          <p className="text-[11px] tracking-wide text-black/50 mb-3 px-3">Ajustes</p>
          <div className="flex flex-col space-y-3">
            {userType?.name?.toLowerCase() === "titular" && (
              <Link href={`/dashboard/${id}/settings`}>
                <div className="group flex items-center gap-3 rounded-[4px] px-3 py-3 hover:bg-gray-50  duration-150 transition-colors">
                  <Settings size={20} className="text-[#0040B8]" />
                  <span className="text-sm text-gray-800">Configuración</span>
                </div>
              </Link>
            )}
            <Link href={`/dashboard/${id}/help`}>
              <div className="group flex items-center gap-3 rounded-[4px] px-3 py-3 hover:bg-gray-50  duration-150 transition-colors">
                <HelpCircle size={20} className="text-[#0040B8]" />
                <span className="text-sm text-gray-800">Centro de ayuda</span>
              </div>
            </Link>
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
                className="p-2 rounded-md hover:bg-gray-100"
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
                    <button className="w-full text-left px-3 py-2 rounded-md bg-white shadow-sm text-sm font-medium">
                      General
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left px-3 py-2 rounded-md hover:bg-white text-sm">
                      Perfil
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left px-3 py-2 rounded-md hover:bg-white text-sm">
                      Notificaciones
                    </button>
                  </li>
                  <li>
                    <button className="w-full text-left px-3 py-2 rounded-md hover:bg-white text-sm">
                      Suscripción
                    </button>
                  </li>
                </ul>

                <div className="mt-6">
                  <button
                    onClick={logOutFunction}
                    className="w-full text-left px-3 py-2 rounded-md text-red-600 hover:bg-red-50 text-sm"
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
                    <select className="text-sm border rounded-md px-2 py-1">
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
    </aside>
  );
}
