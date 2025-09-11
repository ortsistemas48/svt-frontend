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
import WorkshopItem from "../WorkshopItem";

export default function Sidebar() {
  const { workshops } = useUser();
  const { id } = useParams(); 
  const router = useRouter();

  // Filter only approved workshops
  const approvedWorkshops = workshops?.filter(workshop => workshop.is_approved) || [];
  const showWorkshops = approvedWorkshops.length > 1;
  
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

        {/* Mostrar sección talleres solo si hay más de uno aprobado */}
        {showWorkshops && (
          <div className="mt-5 mb-8 pt-5 border-t border-gray-200">
            <p className="text-xs text-[#00000080] tracking-wide mb-6">Talleres</p>
            <div className="space-y-4">
              {approvedWorkshops.map((workshop) => (
                <WorkshopItem
                  key={workshop.workshop_id}
                  name={workshop.workshop_name}
                  selected={id === workshop.workshop_id.toString()}
                  onClick={() => handleWorkshopClick(workshop.workshop_id)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 py-5 px-1 pb-10 mt-4">
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

