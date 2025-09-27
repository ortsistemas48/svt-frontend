"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  ClipboardList,
  Clock,
  FilePlus,
  Printer,
  ChartColumn,
  Users,
  Home
} from "lucide-react";
import NavItem from "@/components/NavItem";
import { UserTypeInWorkshop } from "@/app/types";

type Props = {
  userId: string;
  userType: UserTypeInWorkshop | null;
  loading: boolean;
};

export default function SideBarMenu({ userType, loading }: Props) {
  const pathname = usePathname();
  const { id } = useParams();

  const links = [
    { href: `/dashboard/${id}`, icon: Home, label: "Inicio", roles: ["all"] },
    { href: `/dashboard/${id}/applications`, icon: ClipboardList, label: "Inspección", roles: ["all"] },
    { href: `/dashboard/${id}/inspections-queue`, icon: Clock, label: "Cola de inspecciones", roles: ["all"] },
    { href: `/dashboard/${id}/reprint-crt`, icon: Printer, label: "Reimpresión de CRT", roles: ["all"] },
    { href: `/dashboard/${id}/stickers`, icon: FilePlus, label: "Obleas", roles: ["titular"] },
    { href: `/dashboard/${id}/statistics`, icon: ChartColumn, label: "Estadísticas", roles: ["titular", "ingeniero"] },
    { href: `/dashboard/${id}/users`, icon: Users, label: "Usuarios", roles: ["titular"] },
  ];

  const role = userType?.name?.toLowerCase();
  const filtered = role
    ? links.filter(l => l.roles.includes("all") || l.roles.includes(role))
    : links.filter(l => l.roles.includes("all"));

    const baseHref = `/dashboard/${id}`;

    const isActive = (href: string) => {
    // Inicio solo activo en la ruta exacta
    if (href === baseHref) {
        return pathname === href;
    }
    // Para el resto, activo si es exacto o subruta
    return pathname === href || pathname.startsWith(href + "/");
    };

  if (loading) {
    return (
      <nav className="flex flex-col gap-2 px-1">
        {[0,1,2,3].map(i => (
          <div key={i} className="h-9 rounded-lg bg-gray-200 animate-pulse" />
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-3">
      {filtered.map(({ href, icon: Icon, label }) => {
        const active = isActive(href);
        return (
          <Link key={href} href={href} className="block">
            <NavItem
              icon={<Icon size={20} className="text-[#0040B8]" />}
              label={label}
              active={active}
            />
          </Link>
        );
      })}
    </nav>
  );
}
