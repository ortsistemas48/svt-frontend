// components/Sidebar.tsx
import {
  Settings,
  HelpCircle
} from "lucide-react";
import Link from "next/link";
import NavItem from "@/components/NavItem";
import SideBarItem from "@/components/SideBarMenu";
export default function Sidebar() {
  return (
    <aside className="w-72 max-[1400px]:w-64 h-[calc(100vh-60px)] bg-white border-r border-gray-200 flex flex-col max-[850px]:hidden">
      {/* Contenedor scrollable */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 max-[1400px]:px-3 max-[1400px]:pt-4">
        {/* Título del menú */}
        <p className="text-xs text-[#00000080] tracking-wide mb-6 max-[1400px]:mb-4">Menú</p>

        {/* Menú */}
        <SideBarItem />
        
        {/* Talleres */}
        <div className="mt-5 mb-8 pt-5 border-t border-gray-200">
          <p className="text-xs text-[#00000080] tracking-wide mb-6">Talleres</p>
          <div className="space-y-4">
            <TallerItem name="Taller Duarte Quiros" />
            <TallerItem name="Taller Santa Ana" />
          </div>
        </div>
        <div className="border-t border-gray-200 py-5 px-1">
          <p className="text-xs text-[#00000080] tracking-wide mb-6">Ajustes</p>
          <div className="flex flex-col space-y-6 px-1">
            <Link href={"/dashboard/settings"}>
              <NavItem icon={<Settings size={20} />} label="Configuración" />
            </Link>
            <Link href={"/dashboard/help"}>
              <NavItem icon={<HelpCircle size={20} />} label="Ayuda" />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TallerItem({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3 text-sm max-[1400px]:text-xs text-[#000000]">
      <div className="w-8 h-8 bg-gray-300 rounded-full" />
      {name}
    </div>
  );
}
