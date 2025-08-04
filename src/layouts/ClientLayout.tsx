"use client";

import { UserProvider } from "@/context/UserContext";

export default function ClientLayout({
  user,
  workshops,
  children,
}: {
  user: any;
  workshops: any[];
  children: React.ReactNode;
}) {
  return (
    <UserProvider user={user} workshops={workshops}>
      {children}
    </UserProvider>
  );
}
