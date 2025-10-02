'use client'

import { User as UserIcon, ArrowLeft } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function UserProfile() {
  const { user } = useUser();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const avatarUrl =
    (user as any)?.avatar_url ||
    (user as any)?.photo_url ||
    (user as any)?.image ||
    (user as any)?.avatar ||
    "";

  const initials = `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "U";

  const logOutFunction = async () => {
    try {
      const res = await fetch(`/api/auth/logout`, {
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

  const goSelectWorkshop = () => {
    setOpenMenu(false);
    router.push("/select-workshop"); // cambiá si tu selector está en otra ruta
  };

  // cerrar al click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // cerrar con Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenMenu(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative flex items-center gap-2" ref={menuRef}>
      {/* Trigger tipo avatar como en la imagen */}
      <button
        className="relative block rounded-full "
        aria-label="Abrir menú de usuario"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "Usuario"}
            className="w-10 h-10 rounded-full object-cover ring-1 ring-gray-200 transition"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#0040B8] text-white grid place-items-center font-medium ring-1 ring-[#0040B8]/30  transition">
            {initials || <UserIcon size={18} />}
          </div>
        )}
      </button>

      {/* Popover */}
      {openMenu && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 animate-in slide-in-from-top-2 duration-200">
          {/* Info de usuario como en la foto, avatar + nombre + email */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={`${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "Usuario"}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#0040B8] text-white grid place-items-center font-medium">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-1">
            <button
              onClick={goSelectWorkshop}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#0040B8] hover:bg-blue-50 rounded-md transition-colors duration-150 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:scale-110 transition-transform duration-150" />
              Volver a seleccionar taller
            </button>

            <button
              onClick={logOutFunction}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-150 group"
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
      )}
    </div>
  );
}
