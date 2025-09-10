"use client";

import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useRouter } from "next/navigation";

export default function DashboardClientLayout({ children }: { children: React.ReactNode }) {
  const user = useUser();
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  useEffect(() => {
    if (!user) {
      router.push("/");
    } else {
      setIsChecking(false);
    }
  }, [user]);

  if (isChecking) return null;

return (
  <div className="h-screen flex flex-col">
    {/* Topbar ocupa todo el ancho */}
    <Topbar />

    {/* Cuerpo dividido en sidebar + contenido */}
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <main className="flex-1 p-4 overflow-auto">
        <div className="bg-white min-h-full rounded-[10px] shadow p-4 pt-8 pl-8 pb-0">
          {children}
        </div>
      </main>
    </div>
  </div>
);
}
