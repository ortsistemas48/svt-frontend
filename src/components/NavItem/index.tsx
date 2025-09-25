"use client";

import { ReactNode } from "react";

export default function NavItem({
  icon,
  label,
  active = false,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center gap-4 px-3 py-2.5 rounded-[4px] transition-colors",
        active
          ? "bg-[#0040B8]/10 text-[#0040B8]"
          : "text-gray-800 hover:bg-gray-50"
      ].join(" ")}
    >
      <div className="shrink-0">{icon}</div>
      <span className="text-sm">{label}</span>
    </div>
  );
}
