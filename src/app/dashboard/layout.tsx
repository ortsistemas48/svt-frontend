// components/Layout.tsx
import { ReactNode } from "react";
import ClientLayout from "@/layouts/DashboardClientLayout"; // importás el nuevo wrapper

export const metadata = {
  title: "Dashboard - RTO",
  description: "Sistema RTO",
};

export default function DashBoardLayout({ children }: { children: ReactNode }) {
  return (
    <ClientLayout>{children}</ClientLayout>
  );
}
