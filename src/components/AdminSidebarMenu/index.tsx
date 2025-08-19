'use client'
import Link from "next/link"
import NavItem from "@/components/NavItem"
import {
  UserCheck,
  FilePlus2,
  ShieldUser,
  Users,

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
        { href: `/admin-dashboard/create-decals`, icon: <FilePlus2 size={20} />, label: "Alta de Obleas" }, 
        { href: `/admin-dashboard/approve-users`, icon: <UserCheck size={20} />, label: "Aprobar Titulares" }, 
        { href: `/admin-dashboard/users`, icon: <Users size={20} />, label: "Usuarios" },
        { href: `/admin-dashboard/support`, icon: <ShieldUser size={20} />, label: "Soporte" },  
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