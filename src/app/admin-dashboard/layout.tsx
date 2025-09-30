"use client";

import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";
import Sidebar from "@/components/AdminSidebar";
import {  usePathname, useRouter } from "next/navigation";
import PreLoader from "@/components/PreLoader";
import { DashboardProvider } from "@/context/DashboardContext";
import { PanelLeftOpen } from "lucide-react";


export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const [isChecking, setIsChecking] = useState(true); // auth + membresía
  const [loading, setLoading] = useState(true); // splash
  const [permissionLoading, setPermissionLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true); // control mobile/tablet

  // params: /dashboard/[id]

  // Estado inicial del sidebar: abierto en desktop, cerrado en md- (SSR safe)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSidebarOpen(window.innerWidth >= 768);
    }
  }, []);

  // Bloquear scroll del body cuando el off-canvas está abierto en mobile/tablet
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768;
    if (isMobile && sidebarOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev || "";
      };
    }
  }, [sidebarOpen]);

  // Render
  return (
    <DashboardProvider>
      <div className="h-screen flex flex-col bg-[#f5f5f5]">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar desktop, siempre visible */}
          <div className="pl-4 min-h-full pt-4 hidden lg:block">
            <Sidebar />
          </div>

          {/* Sidebar mobile/tablet, off-canvas */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-40">
              {/* backdrop */}
              <button
                aria-label="Cerrar sidebar"
                className="absolute inset-0 bg-black/40"
                onClick={() => setSidebarOpen(false)}
              />
              {/* panel */}
              <div className="absolute left-0 top-0 h-full w-[84%] max-w-[320px] bg-white shadow-xl">
                <div className="h-full p-4">
                  <Sidebar onToggleSidebar={() => setSidebarOpen(false)} />
                </div>
              </div>
            </div>
          )}

          {/* Contenido principal */}
          <main className="flex-1 p-4 overflow-auto relative">
            {/* Botón abrir, solo mobile/tablet, sticky con padding del main */}
            <div className="lg:hidden sticky top-4 z-20 mb-2">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Abrir sidebar"
                  title="Abrir sidebar"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white shadow hover:bg-gray-50"
                >
                  <PanelLeftOpen className="h-4 w-4 text-slate-700" />
                </button>
              )}
            </div>

            <div className="bg-white min-h-full rounded-[10px] shadow p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
