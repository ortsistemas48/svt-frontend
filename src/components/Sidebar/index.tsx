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
    <aside className="w-72 h-[calc(100vh-60px)] bg-white border-r border-gray-200 flex flex-col">
      {/* Contenedor scrollable */}
      <div className="flex-1 overflow-y-auto px-6 pt-10">
        {/* Título del menú */}
        <p className="text-xs text-[#00000080] tracking-wide mb-6">Menú</p>

        {/* Menú */}
        <SideBarItem />

        {/* Talleres */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-xs text-[#00000080] tracking-wide mb-6">Talleres</p>
          <div className="space-y-7">
            <TallerItem name="Taller Duarte Quiros" />
            <TallerItem name="Taller Santa Ana" />
          </div>
        </div>
      </div>

      {/* Fijo al fondo */}
      <div className="p-6 border-t border-gray-200">
        <div className="flex flex-col space-y-7">
          <Link href={"/dashboard/settings"}>
            <NavItem icon={<Settings size={20} />} label="Configuración" />
          </Link>
          <Link href={"/dashboard/help"}>
            <NavItem icon={<HelpCircle size={20} />} label="Ayuda" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

function TallerItem({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[#000000]">
      <div className="w-8 h-8 bg-gray-300 rounded-full" />
      {name}
    </div>
  );
}
