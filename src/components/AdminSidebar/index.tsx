"use client";

import SideBarItem from "@/components/AdminSidebarMenu";
import { useRouter } from "next/navigation";
export default function Sidebar() {

  const router = useRouter();

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
  return (
    <aside className="w-72 max-[1500px]:w-64 h-[calc(100vh-60px)] bg-white border-r border-gray-200 flex flex-col max-md:hidden">
      <div className="flex-1 overflow-y-auto px-6 pt-6 max-[1500px]:px-3 max-[1500px]:pt-4">
        <p className="text-xs text-[#00000080] tracking-wide mb-6 max-[1500px]:mb-4">Menú</p>

        <SideBarItem />
        <button
              onClick={logOutFunction}
              className="w-full flex items-center gap-3 px-3 py-3 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-[4px] transition-colors duration-150 group"
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
    </aside>
  );
}
