"use client";

import { UserProvider } from "@/context/UserContext";

export default function ClientLayout({
  user,
  children,
}: {
  user: any; // Podés tiparlo si querés
  children: React.ReactNode;
}) {
  
  return <UserProvider user={user}>{children}</UserProvider>;
}
