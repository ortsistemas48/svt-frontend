"use client";

import SideBarItem from "@/components/AdminSidebarMenu";

export default function Sidebar() {


  return (
    <aside className="w-72 max-[1500px]:w-64 h-[calc(100vh-60px)] bg-white border-r border-gray-200 flex flex-col max-md:hidden">
      <div className="flex-1 overflow-y-auto px-6 pt-6 max-[1500px]:px-3 max-[1500px]:pt-4">
        <p className="text-xs text-[#00000080] tracking-wide mb-6 max-[1500px]:mb-4">Menú</p>

        <SideBarItem />

      </div>
    </aside>
  );
}
