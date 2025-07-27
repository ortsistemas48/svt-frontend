// components/Sidebar.tsx
import {
  ClipboardList,
  Clock,
  History,
  FileText,
  FileClock,
  Printer,
  ChartColumn,
  Users,
  Settings,
  HelpCircle
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-64 h-[calc(100vh-60px)] bg-white border-r border-gray-200 flex flex-col">
      {/* Contenedor scrollable */}
      <div className="flex-1 overflow-y-auto px-6 pt-10">
        {/* Título del menú */}
        <p className="text-xs text-[#00000080] tracking-wide mb-6">Menú</p>

        {/* Menú */}
        <nav className="space-y-7">
          <NavItem icon={<ClipboardList size={20} />} label="Inspección" />
          <NavItem icon={<Clock size={20} />} label="Cola de inspecciones" />
          <NavItem icon={<History size={20} />} label="Historial de inspecciones" />
          <NavItem icon={<FileClock size={20} />} label="Historial de dominios" />
          <NavItem icon={<Printer size={20} />} label="Reimpresión de CRT" />
          <NavItem icon={<FileText size={20} />} label="Obleas" />
          <NavItem icon={<ChartColumn size={20} />} label="Estadísticas" />
          <NavItem icon={<Users size={20} />} label="Usuarios" />
        </nav>

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
        <div className="space-y-7">
          <NavItem icon={<Settings size={20} />} label="Configuración" />
          <NavItem icon={<HelpCircle size={20} />} label="Centro de ayuda" />
        </div>
      </div>
    </aside>
  );
}

function NavItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-[#000000] hover:text-blue-600 cursor-pointer">
      <div className="text-[#0040B8]">{icon}</div>
      <span>{label}</span>
    </div>
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
