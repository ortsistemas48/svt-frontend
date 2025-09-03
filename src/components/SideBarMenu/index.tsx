'use client'
import Link from "next/link"
import NavItem from "@/components/NavItem"
import {
  ClipboardList,
  Clock,
  History,
  FileText,
  FilePlus,
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
        { href: `/dashboard/${id}/`, icon: <Home size={20} />, label: "Inicio" }, //todos 
        { href: `/dashboard/${id}/applications`, icon: <ClipboardList size={20} />, label: "Revisiones" }, //todos 
        { href: `/dashboard/${id}/inspections-queue`, icon: <Clock size={20} />, label: "Cola de revisiones" }, //todos 
        { href: `/dashboard/${id}/reprint-crt`, icon: <Printer size={20} />, label: "Reimpresión de CRT" }, //todos 
        // { href: `/dashboard/${id}/reassign-oblea`, icon: <FileText size={20} />, label: "Reasignación de Obleas" }, //todos 
        { href: `/dashboard/${id}/buy-oblea`, icon: <FilePlus size={20} />, label: "Comprar obleas" }, //todos 
        { href: `/dashboard/${id}/statistics`, icon: <ChartColumn size={20} />, label: "Estadísticas" }, //solo el ingeniero y el garage owner
        { href: `/dashboard/${id}/users`, icon: <Users size={20} />, label: "Usuarios" }, //solo puede verlo el garage owner 
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