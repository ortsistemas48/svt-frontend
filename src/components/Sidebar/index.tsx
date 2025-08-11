"use client";

import {
  Settings,
  HelpCircle
} from "lucide-react";
import Link from "next/link";
import NavItem from "@/components/NavItem";
import SideBarItem from "@/components/SideBarMenu";
import { useUser } from "@/context/UserContext"; // Asegurate de tener esto
import { useParams, useRouter } from "next/navigation";

export default function Sidebar() {
  const { user, workshops } = useUser();
  const { id } = useParams(); 
  const router = useRouter();

  const showWorkshops = workshops && workshops.length > 1;
  const handleWorkshopClick = (workshopId: number) => {
    if (workshopId.toString() !== id) {
      router.push(`/dashboard/${workshopId}`);
    }
  };

  return (
    <aside className="w-72 max-[1500px]:w-64 h-[calc(100vh-60px)] bg-white border-r border-gray-200 flex flex-col max-md:hidden">
      <div className="flex-1 overflow-y-auto px-6 pt-6 max-[1500px]:px-3 max-[1500px]:pt-4">
        <p className="text-xs text-[#00000080] tracking-wide mb-6 max-[1500px]:mb-4">Menú</p>

        <SideBarItem />

        {/* Mostrar sección talleres solo si hay más de uno */}
        {showWorkshops && (
          <div className="mt-5 mb-8 pt-5 border-t border-gray-200">
            <p className="text-xs text-[#00000080] tracking-wide mb-6">Talleres</p>
            <div className="space-y-4">
              {workshops.map((workshop) => (
                <TallerItem
                  key={workshop.workshop_id}
                  name={workshop.workshop_name}
                  selected={id === workshop.workshop_id.toString()}
                  onClick={() => handleWorkshopClick(workshop.workshop_id)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 py-5 px-1 mt-4">
          <p className="text-xs text-[#00000080] tracking-wide mb-6">Ajustes</p>
          <div className="flex flex-col space-y-6 px-1">
            <Link href={`/dashboard/${id}/settings`}>
              <NavItem icon={<Settings size={20} />} label="Configuración" />
              {/* solo puede verlo el garage owner */}
            </Link>
            <Link href={`/dashboard/${id}/help`}>
              <NavItem icon={<HelpCircle size={20} />} label="Ayuda" />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TallerItem({
  name,
  selected,
  onClick
}: {
  name: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 text-sm max-[1500px]:text-xs text-[#000000] cursor-pointer 
        ${selected ? "font-semibold text-[#0040B8]" : "hover:text-[#0040B8]"}`}
    >
      <div className={`w-2 h-2  ${selected ? "bg-[#0040B8]" : "bg-gray-400"} rounded-full`} />
      <span className="truncate max-w-[100px] sm:max-w-[140px] md:max-w-[180px] block">{name}</span>
    </div>
  );
}
