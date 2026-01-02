"use client";

import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar"; // si no lo usás, podés quitarlo
import { useParams, usePathname, useRouter } from "next/navigation";
import PreLoader from "@/components/PreLoader";
import { DashboardProvider } from "@/context/DashboardContext";
import { UserTypeInWorkshop } from "@/app/types";
import { PanelLeftOpen } from "lucide-react";

type MembershipResponse =
  | { error: string }
  | {
      workshop_id: number;
      user_id: string;
      is_member: boolean;
      user_type_id?: number;
    };

export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const [isChecking, setIsChecking] = useState(true); // auth + membresía
  const [loading, setLoading] = useState(true); // splash
  const [userType, setUserType] = useState<UserTypeInWorkshop | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true); // control mobile/tablet

  // params: /dashboard/[id]
  const params = useParams() as { id?: string };
  const workshopId = params?.id;

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

  // 1) Gate de autenticación
  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else {
      checkMembership();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, workshopId]);

  // 2) Chequeo membresía
  async function checkMembership() {
    if (!workshopId) {
      router.replace("/login");
      return;
    }
    try {
      const res = await fetch(
        `/api/workshops/${workshopId}/membership`,
        { method: "GET", credentials: "include" }
      );
      if (res.status === 401 || res.status === 404) {
        router.replace("/login");
        router.refresh();
        return;
      }
      const data: MembershipResponse = await res.json();
      if ("is_member" in data && !data.is_member) {
        router.replace("/login");
        router.refresh();
        return;
      }
      setIsChecking(false);
    } catch {
      router.replace("/login");
    }
  }

  // Fetch user type in workshop
  useEffect(() => {
    const fetchUserType = async () => {
      if (!user?.id || !workshopId) return;
      try {
        setPermissionLoading(true);
        const res = await fetch(
          `/api/users/user-type-in-workshop?userId=${user.id}&workshopId=${workshopId}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setUserType(data);
        } else {
          console.error("Error fetching user type,", await res.text());
          router.replace("/login");
          return;
        }
      } catch (error) {
        console.error("Error fetching user type,", error);
        router.replace("/login");
      } finally {
        setPermissionLoading(false);
      }
    };
    if (user?.id && workshopId && !isChecking) {
      fetchUserType();
    }
  }, [user?.id, workshopId, isChecking, router]);

  // 3) Permisos por ruta
  function checkRoutePermission() {
    if (!userType || !workshopId) return;
    const userTypeName = userType.name.toLowerCase();

    const routePermissions: { [key: string]: string[] } = {
      [`/dashboard/${workshopId}/`]: ["all"],
      [`/dashboard/${workshopId}/applications`]: ["administrativo", "titular", "ingeniero"],
      [`/dashboard/${workshopId}/inspections-queue`]: ["all"],
      [`/dashboard/${workshopId}/reprint-crt`]: ["administrativo", "titular", "ingeniero"],
      [`/dashboard/${workshopId}/stickers`]: ["administrativo", "titular", "ingeniero"],
      [`/dashboard/${workshopId}/payment`]: ["administrativo", "titular", "ingeniero"],
      [`/dashboard/${workshopId}/buy-oblea`]: ["titular"],
      [`/dashboard/${workshopId}/statistics`]: ["titular", "ingeniero"],
      [`/dashboard/${workshopId}/users`]: ["titular", "ingeniero"],
      [`/dashboard/${workshopId}/files`]: ["titular", "ingeniero"],
      [`/dashboard/${workshopId}/settings`]: ["titular"],
    };

    const currentRoute = pathname;
    const allowedRoles = routePermissions[currentRoute];
    if (allowedRoles) {
      const hasPermission =
        allowedRoles.includes("all") || allowedRoles.includes(userTypeName);
      if (!hasPermission) {
        router.replace(`/dashboard/${workshopId}/`);
        return;
      }
    }
  }

  useEffect(() => {
    if (!permissionLoading && userType && pathname) {
      checkRoutePermission();
    }
  }, [permissionLoading, userType, pathname]);

  // 4) Loader visual
  useEffect(() => {
    if (!isChecking && !permissionLoading) {
      const timeout = setTimeout(() => setLoading(false), 1750);
      return () => clearTimeout(timeout);
    }
  }, [isChecking, permissionLoading]);

  if (isChecking || loading || permissionLoading) return <PreLoader />;

  // Render
  return (
    <DashboardProvider>
      <div className="h-screen flex flex-col bg-[#f5f5f5]">
        <div className="flex flex-1 overflow-hidden">
        {/* Sidebar desktop, siempre visible */}
        <div className="pl-4 min-h-full pt-4 hidden lg:block">
          {/* Logo encima del sidebar */}
          <div className="mb-3">
            <div className="bg-white rounded-[14px] shadow px-4 py-4 flex items-center justify-center w-[290px] max-[1500px]:w-[256px]">
              <Link
                href={`/dashboard/${workshopId ?? ""}`}
                aria-label="Ir al inicio"
                className="inline-flex"
              >
                <img src="/images/logo.svg" alt="" className="h-7 w-auto" />
              </Link>
            </div>
          </div>
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
                  {/* Logo encima del sidebar (mobile) */}
                  <div className="mb-4">
                    <div className="bg-white rounded-[14px] shadow p-3 flex items-center justify-center">
                      <Link
                        href={`/dashboard/${workshopId ?? ""}`}
                        aria-label="Ir al inicio"
                        className="inline-flex"
                      >
                        <img src="/images/logo.svg" alt="" className="h-8 w-auto" />
                      </Link>
                    </div>
                  </div>
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
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[4px] border border-slate-200 bg-white shadow hover:bg-gray-50"
                >
                  <PanelLeftOpen className="h-4 w-4 text-slate-700" />
                </button>
              )}
            </div>

            <div className="bg-white min-h-full rounded-[14px] shadow p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
