"use client";

import { useUser } from "@/context/UserContext";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useParams, usePathname, useRouter } from "next/navigation";
import PreLoader from "@/components/PreLoader";
import { DashboardProvider } from "@/context/DashboardContext";
import { UserTypeInWorkshop } from "@/app/types";

type MembershipResponse =
  | { error: string } // para 4xx
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
  const [isChecking, setIsChecking] = useState(true); // incluye auth + membresía
  const [loading, setLoading] = useState(true); // tu splash/loader visual
  const [userType, setUserType] = useState<UserTypeInWorkshop | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // params: /dashboard/[id]
  const params = useParams() as { id?: string };
  const workshopId = params?.id; // string

  // 1) Gate de autenticación (como ya tenías)
  useEffect(() => {
    if (!user) {
      router.replace("/"); // sin sesión
    } else {
      // si hay sesión, pasamos a chequear membresía
      // (pero no cortamos el loader todavía)
      checkMembership();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, workshopId]);

  // Fetch user type in workshop
  useEffect(() => {
    const fetchUserType = async () => {
      if (!user?.id || !workshopId) return;
      
      try {
        setPermissionLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/user-type-in-workshop?userId=${user.id}&workshopId=${workshopId}`,
          { credentials: "include" }
        );
        
        if (res.ok) {
          const data = await res.json();
          setUserType(data);
        } else {
          console.error("Error fetching user type:", await res.text());
          // If we can't get user type, redirect to home
          router.replace("/");
          return;
        }
      } catch (error) {
        console.error("Error fetching user type:", error);
        router.replace("/");
      } finally {
        setPermissionLoading(false);
      }
    };

    if (user?.id && workshopId && !isChecking) {
      fetchUserType();
    }
  }, [user?.id, workshopId, isChecking, router]);

  // 2) Chequeo contra el endpoint /workshops/:id/membership
  async function checkMembership() {
    if (!workshopId) {
      router.replace("/"); // sin id en la ruta
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workshops/${workshopId}/membership`, {
        method: "GET",
        credentials: "include", // importante si tu auth va por cookies
        
      });
      // 401: no autorizado -> a inicio (o página de login)
      if (res.status === 401 || res.status === 404) {
        router.replace("/");
        router.refresh();
        return;
      }

      const data: MembershipResponse = await res.json();

      // 200 con is_member false -> sin acceso a ese taller
      if ("is_member" in data && !data.is_member) {
        router.replace("/"); // o "/dashboard"
        router.refresh();
        return;
      }

      // OK: puede ver el dashboard
      setIsChecking(false);
    } catch (e) {
      // error de red/servidor -> a una página de error genérica o home
      router.replace("/");
    }
  }

  // Check if user has permission to access the current route
  function checkRoutePermission() {
    if (!userType || !workshopId) return;

    const userTypeName = userType.name.toLowerCase();
    
    // Define route permissions based on SideBarMenu configuration
    const routePermissions: { [key: string]: string[] } = {
      [`/dashboard/${workshopId}/`]: ["all"],
      [`/dashboard/${workshopId}/applications`]: ["all"],
      [`/dashboard/${workshopId}/inspections-queue`]: ["all"],
      [`/dashboard/${workshopId}/reprint-crt`]: ["all"],
      [`/dashboard/${workshopId}/buy-oblea`]: ["titular"],
      [`/dashboard/${workshopId}/statistics`]: ["titular", "ingeniero"],
      [`/dashboard/${workshopId}/users`]: ["titular"],
      [`/dashboard/${workshopId}/settings`]: ["titular"],

    };

    // Check if current pathname matches any restricted route
    const currentRoute = pathname;
    const allowedRoles = routePermissions[currentRoute];

    if (allowedRoles) {
      const hasPermission = allowedRoles.includes("all") || allowedRoles.includes(userTypeName);
      
      if (!hasPermission) {
        // Redirect to dashboard home if no permission
        router.replace(`/dashboard/${workshopId}/`);
        return;
      }
    }
  }

  // 3) Permission checking based on route and user type
  useEffect(() => {
    if (!permissionLoading && userType && pathname) {
      checkRoutePermission();
    }
  }, [permissionLoading, userType, pathname]);

  // 4) Tu loader visual (lo mantengo tal cual usabas)
  useEffect(() => {
    if (!isChecking && !permissionLoading) {
      const timeout = setTimeout(() => {
        setLoading(false);
      }, 1750);
      return () => clearTimeout(timeout);
    }
  }, [isChecking, permissionLoading]);

  if (isChecking || loading || permissionLoading) return <PreLoader />;

  // 4) Render del dashboard
  return (
    <DashboardProvider>
      <div className="h-screen flex flex-col bg-[#f5f5f5]">
        <Topbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 p-4 overflow-auto">
            <div className="bg-white min-h-full rounded-[10px] shadow p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
