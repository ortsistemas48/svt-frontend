'use client'
// components/Layout.tsx
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { ReactNode } from "react";
import { useUser } from "@/context/UserContext";

export default function DashBoardLayout({ children }: { children: ReactNode }) {
  const user = useUser();
  if (!user) {
    window.location.href = "/"; // Redirigir si no hay usuario
  }
  return (
    <div className="h-screen flex flex-col bg-[#f5f5f5]">
      {/* Topbar ocupa todo el ancho */}
      <Topbar />

      {/* Cuerpo dividido en sidebar + contenido */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar/>
        <main className="flex-1 p-4 overflow-auto">
          <div className="bg-white min-h-full rounded-[10px] shadow p-4 pt-8 pl-8 pb-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
