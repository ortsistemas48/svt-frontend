"use client";

import Link from "next/link";
import {
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronDown as ChevronIcon,
  Menu,
  X
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";
import SideBarMenu from "@/components/SideBarMenu";
import WorkshopItem from "@/components/WorkshopItem";
import { UserTypeInWorkshop } from "@/app/types";
import UserProfile from "../UserProfile";

export default function Sidebar() {
  const { workshops, user } = useUser();
  const { id } = useParams();
  const router = useRouter();

  const [userType, setUserType] = useState<UserTypeInWorkshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [openWorkshops, setOpenWorkshops] = useState(true);

  // móvil
  const [openMobile, setOpenMobile] = useState(false);

  // hint de scroll
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);

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

  const approvedWorkshops = useMemo(
    () => (workshops || []).filter(w => w.is_approved),
    [workshops]
  );

  const currentWorkshop = useMemo(
    () => approvedWorkshops.find(w => String(w.workshop_id) === String(id)),
    [approvedWorkshops, id]
  );

  const showWorkshops = approvedWorkshops.length > 1;

  useEffect(() => {
    const run = async () => {
      if (!user?.id || !id) return;
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/user-type-in-workshop?userId=${user.id}&workshopId=${id}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setUserType(data);
        } else {
          console.error("Error fetching user type,", await res.text());
        }
      } catch (e) {
        console.error("Error fetching user type,", e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user?.id, id]);

  // lógica del indicador
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
      setOpenMobile(false); // cerrar drawer en navegación
    }
  };

  const nudgeScrollDown = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ top: 240, behavior: "smooth" });
  };

  // Contenido reutilizable del sidebar
  const SidebarContent = () => (
    <>
      {/* Scroll interno, oculto */}
      <div
        ref={scrollRef}
        className="
          relative h-full overflow-y-auto pb-6
          [scrollbar-width:none] [-ms-overflow-style:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {/* Header usuario */}
        <div className="flex items-center gap-3 p-3">
          <div className="relative">
            <UserProfile />
            <span className="absolute -right-0 -bottom-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || "email@ejemplo.com"}
            </p>
          </div>
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
              className="mb-2 flex w-full items-center justify-between px-3"
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

                {/* Inscribir taller */}
                <Link href="/dashboard/register-workshop" onClick={() => setOpenMobile(false)}>
                  <div className="mt-4 flex items-center gap-2 rounded-[4px] border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    <svg width="18" height="18" viewBox="0 0 24 24" className="text-[#0A58F5]">
                      <path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/>
                    </svg>
                    Inscribir taller
                  </div>
                </Link>
              </div>
            ) : (
              <div id="workshops-list" className="pl-2">
                <WorkshopItem
                  name={currentWorkshop?.workshop_name || "Taller actual"}
                  selected
                  onClick={() => currentWorkshop && handleWorkshopClick(currentWorkshop.workshop_id)}
                />
              </div>
            )}
          </>
        )}

        {/* Ajustes */}
        <div className="mt-6 border-t border-gray-200 pt-5 pb-3 px-1">
          <p className="text-[11px] tracking-wide text-black/50 mb-3">Ajustes</p>
          <div className="flex flex-col space-y-3">
            {userType?.name?.toLowerCase() === "titular" && (
              <Link href={`/dashboard/${id}/settings`} onClick={() => setOpenMobile(false)}>
                <div className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50">
                  <Settings size={20} className="text-[#0A58F5]" />
                  <span className="text-sm text-gray-800">Configuración</span>
                </div>
              </Link>
            )}
            <Link href={`/dashboard/${id}/help`} onClick={() => setOpenMobile(false)}>
              <div className="group flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-gray-50">
                <HelpCircle size={20} className="text-[#0A58F5]" />
                <span className="text-sm text-gray-800">Centro de ayuda</span>
              </div>
            </Link>

            <button
              onClick={() => { logOutFunction(); setOpenMobile(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-150 group"
            >
              <svg
                className="w-4 h-4 group-hover:scale-110 transition-transform duration-150"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Indicador de más contenido abajo */}
      <div
        className={[
          "pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-3 transition-opacity duration-300 z-20",
          showScrollHint ? "opacity-100" : "opacity-0"
        ].join(" ")}
        aria-hidden={!showScrollHint}
      >
        <div className="absolute inset-x-4 bottom-0 h-10 bg-gradient-to-t from-white to-white/0 rounded-b-[10px]" />
        <div className="pointer-events-auto absolute inset-x-0 bottom-4 flex justify-center">
          <button
            type="button"
            onClick={nudgeScrollDown}
            className="group inline-flex items-center justify-center h-9 w-9 rounded-full bg-white shadow border border-slate-200"
            aria-label="Ver más contenido"
            title="Ver más contenido"
          >
            <ChevronIcon
              size={20}
              className="text-slate-500 transition-transform group-hover:translate-y-[2px]"
            />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Botón hamburguesa solo mobile y tablet */}
      <button
        type="button"
        onClick={() => setOpenMobile(true)}
        className="md:hidden fixed z-40 top-4 left-4 inline-flex items-center justify-center h-10 w-10 rounded-lg bg-white/90 backdrop-blur border border-slate-200 shadow-sm active:scale-[0.98]"
        aria-label="Abrir menú"
      >
        <Menu size={20} className="text-slate-700" />
      </button>

      {/* Sidebar desktop */}
      <aside className="relative max-md:hidden h-[calc(100vh-32px)] w-[290px] max-[1500px]:w-[256px] bg-white shadow rounded-[10px] p-4">
        <SidebarContent />
      </aside>

      {/* Drawer mobile/tablet */}
      <div
        className={[
          "md:hidden fixed inset-0 z-50 transition",
          openMobile ? "pointer-events-auto" : "pointer-events-none"
        ].join(" ")}
        aria-hidden={!openMobile}
      >
        {/* Backdrop */}
        <div
          onClick={() => setOpenMobile(false)}
          className={[
            "absolute inset-0 bg-black/30 transition-opacity",
            openMobile ? "opacity-100" : "opacity-0"
          ].join(" ")}
        />

        {/* Panel */}
        <aside
          className={[
            "absolute top-0 left-0 h-full w-[86vw] max-w-[320px] bg-white shadow-xl rounded-r-[10px] p-4 transition-transform duration-300",
            openMobile ? "translate-x-0" : "-translate-x-full"
          ].join(" ")}
          role="dialog"
          aria-modal="true"
          aria-label="Menú lateral"
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => setOpenMobile(false)}
            className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white shadow-sm"
            aria-label="Cerrar menú"
          >
            <X size={18} className="text-slate-700" />
          </button>

          <SidebarContent />
        </aside>
      </div>
    </>
  );
}
