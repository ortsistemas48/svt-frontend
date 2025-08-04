'use client'
import Link from "next/link"
import NavItem from "@/components/NavItem"
import {
  ClipboardList,
  Clock,
  History,
  FileText,
  FileClock,
  Printer,
  ChartColumn,
  Users,
  Home

} from "lucide-react";
import { usePathname, useParams } from "next/navigation";


export default function SideBarMenu(){
    const pathname = usePathname();
    const { id } = useParams();
    const getLinkClass = (href: string) => {
      return pathname === href
        ? "bg-[#0040B826] rounded-lg text-white"
        : "";
    }
    

    const links = [
        { href: `/dashboard/${id}/`, icon: <Home size={20} />, label: "Inicio" },
        { href: `/dashboard/${id}/applications`, icon: <ClipboardList size={20} />, label: "Trámites" },
        { href: `/dashboard/${id}/inspections-queue`, icon: <Clock size={20} />, label: "Cola de inspecciones" },
        { href: `/dashboard/${id}/inspections-history`, icon: <History size={20} />, label: "Historial de inspecciones" },
        { href: `/dashboard/${id}/domains-history`, icon: <FileClock size={20} />, label: "Historial de dominios" },
        { href: `/dashboard/${id}/reprint-crt`, icon: <Printer size={20} />, label: "Reimpresión de CRT" },
        { href: `/dashboard/${id}/decals`, icon: <FileText size={20} />, label: "Obleas" },
        { href: `/dashboard/${id}/statistics`, icon: <ChartColumn size={20} />, label: "Estadísticas" },
        { href: `/dashboard/${id}/users`, icon: <Users size={20} />, label: "Usuarios" },
    ];
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