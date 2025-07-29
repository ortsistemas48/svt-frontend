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

} from "lucide-react";
import { usePathname } from "next/navigation";
export default function SideBarMenu(){
    const pathname = usePathname();
    const getLinkClass = (href: string) => {
      return pathname === href
        ? "bg-[#0040B826] rounded-xl text-white"
        : "";
    }
    const links = [
        { href: "/dashboard/applications", icon: <ClipboardList size={20} />, label: "Inspección" },
        { href: "/dashboard/inspections-queue", icon: <Clock size={20} />, label: "Cola de inspecciones" },
        { href: "/dashboard/inspections-history", icon: <History size={20} />, label: "Historial de inspecciones" },
        { href: "/dashboard/domains-history", icon: <FileClock size={20} />, label: "Historial de dominios" },
        { href: "/dashboard/reprint-crt", icon: <Printer size={20} />, label: "Reimpresión de CRT" },
        { href: "/dashboard/decals", icon: <FileText size={20} />, label: "Obleas" },
        { href: "/dashboard/statistics", icon: <ChartColumn size={20} />, label: "Estadísticas" },
        { href: "/dashboard/users", icon: <Users size={20} />, label: "Usuarios" },
    ];
    console.log(getLinkClass("/dashboard/applications"));
    return (
        <nav className="flex flex-col space-y-3 ">
            {links.map((link) => (
                
                <Link key={link.href} href={link.href} className={`p-4 ${getLinkClass(link.href)}`} >
                    <NavItem icon={link.icon} label={link.label} />
                </Link>
            ))}     
        </nav>
    )
}