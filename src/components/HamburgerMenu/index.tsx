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
  Home,
  FilePlus

} from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { useState } from "react";

export default function HamburgerMenu() {
  const pathname = usePathname();
  const getLinkClass = (href: string) => {
    return pathname === href
      ? "bg-[#0040B826] rounded-lg text-white"
      : "";
  }
  const { id } = useParams();
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="block md:hidden relative z-50">
      <button
        type="button"
        className="p-2 w-10 h-10 text-gray-600 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-controls="navbar-hamburger"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <span className="sr-only">Abrir menú</span>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 17 14" xmlns="http://www.w3.org/2000/svg">
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M1 1h15M1 7h15M1 13h15"
          />
        </svg>
      </button>

      {isOpen && (
        <ul
          id="navbar-hamburger"
          className="absolute min-w-full left-[-10px] mt-2 bg-white shadow-lg rounded-md py-2"
        >
          {links.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex items-center gap-2 px-4 py-3 transition-all duration-150 ${getLinkClass(link.href)}`}
                onClick={() => setIsOpen(false)} // cerrar al hacer clic
              >
                <NavItem icon={link.icon} label={link.label} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}