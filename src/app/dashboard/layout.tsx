
// components/Layout.tsx
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { ReactNode } from "react";

export const metadata = {
  title: "Dashboard - Track Detail",
  description: "Accedé a tu cuenta de Track Detail para continuar",
};


export default function DashBoardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex flex-col bg-[#f5f5f5]">
      {/* Topbar ocupa todo el ancho */}
      <Topbar />

      {/* Cuerpo dividido en sidebar + contenido */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar/>
        <main className="flex-1 p-4 overflow-auto">
          <div className="bg-white h-full rounded-[10px] shadow p-4 pt-8 pl-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
