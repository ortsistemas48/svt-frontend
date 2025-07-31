'use client'

import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import HamburgerMenu from "../HamburgerMenu";
import { useUser } from "@/context/UserContext";
import { useEffect, useRef, useState } from "react";

export default function Topbar() {
  const user = useUser();
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

      window.location.href = "/";
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
    <header className="h-16 px-6 max-md:px-4 flex items-center justify-between bg-white border-b border-gray-200">
      {/* Logo a la izquierda */}
      <div className="flex items-center">
        <HamburgerMenu />
        <Link href="/dashboard">
          <Image src="/images/logo.png" alt="Logo" width={150} height={50} className="p-2" />
        </Link>
      </div>

      {/* Usuario a la derecha */}
      <div className="relative flex items-center gap-2" ref={menuRef}>
        <User
          className="text-[#000000] hover:text-[#0040B8] cursor-pointer duration-100"
          size={30}
          onClick={() => setOpenMenu(prev => !prev)}
        />

        {openMenu && (
          <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded-md shadow-lg p-3 z-50">
            <p className="text-sm text-gray-700 mb-2">{user?.first_name} {user?.last_name}</p>
            <button
              onClick={logOutFunction}
              className="w-full text-left text-red-600 hover:text-red-800 text-sm"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
