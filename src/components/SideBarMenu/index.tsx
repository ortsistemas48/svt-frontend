'use client'
import Link from "next/link"
import NavItem from "@/components/NavItem"
import {
  ClipboardList,
  Clock,
  
  FilePlus,
  Printer,
  ChartColumn,
  Users,
  Home

} from "lucide-react";
import { usePathname, useParams } from "next/navigation";
import { UserTypeInWorkshop } from "@/app/types";


export default function SideBarMenu({ 
    userId, 
    userType, 
    loading 
}: { 
    userId: string;
    userType: UserTypeInWorkshop | null;
    loading: boolean;
}){
    const pathname = usePathname();
    const { id } = useParams();

    const getLinkClass = (href: string) => {
      return pathname === href
        ? "bg-[#0040B826] rounded-lg text-white"
        : "";
    }
    
    const allLinks = [
        { href: `/dashboard/${id}/`, icon: <Home size={20} />, label: "Inicio", roles: ["all"] }, //todos 
        { href: `/dashboard/${id}/applications`, icon: <ClipboardList size={20} />, label: "Revisiones", roles: ["all"] }, //todos 
        { href: `/dashboard/${id}/inspections-queue`, icon: <Clock size={20} />, label: "Cola de revisiones", roles: ["all"] }, //todos 
        { href: `/dashboard/${id}/reprint-crt`, icon: <Printer size={20} />, label: "Reimpresión de CRT", roles: ["all"] }, //todos 
        { href: `/dashboard/${id}/buy-oblea`, icon: <FilePlus size={20} />, label: "Comprar obleas", roles: ["titular"] }, //todos 
        { href: `/dashboard/${id}/statistics`, icon: <ChartColumn size={20} />, label: "Estadísticas", roles: ["titular", "ingeniero"] }, //solo el ingeniero y el titular
        { href: `/dashboard/${id}/users`, icon: <Users size={20} />, label: "Usuarios", roles: ["titular"] }, //solo puede verlo el titular 
    ];

    // Filter links based on user type
    const getFilteredLinks = () => {
        if (!userType) return allLinks.filter(link => link.roles.includes("all"));
        
        const userTypeName = userType.name.toLowerCase();
        
        return allLinks.filter(link => 
            link.roles.includes("all") || 
            link.roles.includes(userTypeName)
        );
    };

    const links = getFilteredLinks();
    
    if (loading) {
        return (
            <nav className="flex flex-col space-y-2">
                <div className="px-2 py-3 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded"></div>
                </div>
                <div className="px-2 py-3 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded"></div>
                </div>
                <div className="px-2 py-3 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded"></div>
                </div>
            </nav>
        );
    }

    return (
        <nav className="flex flex-col space-y-2 ">
            {links.map((link) => (
                <Link key={link.href} href={link.href} className={`px-2 py-3 ${getLinkClass(link.href)}`} >
                    <NavItem icon={link.icon} label={link.label}/>
                </Link>
            ))}     
        </nav>
    )
}