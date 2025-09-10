'use client'

import { User } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function UserProfile() {
  const { user } = useUser();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Pre-fetch the dashboard page for faster navigation
  const logOutFunction = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) return;

      // window.location.href = "/";
      router.push("/");
      router.refresh(); // Refrescar la página para actualizar el estado del usuario
    } catch (err) {
      console.error("❌ Error de red:", err);
    }
  };
  
  // Cerrar el menú si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex items-center gap-2" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setOpenMenu(prev => !prev)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-[#0040B8] hover:text-white transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-[#0040B8] focus:ring-offset-2"
        aria-label="Abrir menú de usuario"
      >
        <User
          className="text-gray-600 group-hover:text-white transition-colors duration-200"
          size={20}
        />
      </button>

      {/* Dropdown Menu */}
      {openMenu && (
        <div className="absolute right-0 top-12 w-56 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 animate-in slide-in-from-top-2 duration-200">
          {/* User Info Section */}
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#0040B8] text-white font-medium text-sm">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-1">
            <button
              onClick={logOutFunction}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-150 group"
            >
              <svg 
                className="w-4 h-4 group-hover:scale-110 transition-transform duration-150" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
