"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  ScrollText,
  Printer,
  ShieldUser,
  Users,
  UserCheck,
  FilePlus2,
  type LucideIcon,
  Banknote, 
} from "lucide-react";
import NavItem from "@/components/NavItem";
import { UserTypeInWorkshop } from "@/app/types";

type Props = {
  userId: string;
  userType: UserTypeInWorkshop | null;
  loading: boolean;
};

type LinkItem = {
  href: string;
  icon: LucideIcon;   // <- guardamos el componente, no el elemento
  label: string;
};

export default function SideBarMenu({ userType, loading }: Props) {
  const pathname = usePathname();

  const links: LinkItem[] = [
    { href: `/admin-dashboard`, icon: Users, label: "Usuarios" },
    { href: `/admin-dashboard/payments`, icon: Banknote, label: "Aprobar Pagos" },
    { href: `/admin-dashboard/approve-workshops`, icon: UserCheck, label: "Aprobar Talleres" },
    { href: `/admin-dashboard/support`, icon: ShieldUser, label: "Soporte" },
  ];

  const baseHref = `/admin-dashboard`;

  const isActive = (href: string) => {
    if (href === baseHref) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  if (loading) {
    return (
      <nav className="flex flex-col gap-2 px-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-9 rounded-lg bg-gray-200 animate-pulse" />
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-3">
      {links.map(({ href, icon: IconCmp, label }) => {
        const active = isActive(href);
        return (
          <Link key={href} href={href} className="block">
            <NavItem
              icon={<IconCmp size={20} className="text-[#0040B8]" />}
              label={label}
              active={active}
            />
          </Link>
        );
      })}
    </nav>
  );
}
