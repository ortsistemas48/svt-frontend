import "./globals.css";
import { poppins } from "@/fonts";
import ClientLayout from "@/layouts/ClientLayout";
import { getUserFromCookies } from "@/auth";

export const metadata = {
  title: "CheckRTO - Sistema de Inspección Vehicular",
  description: "CheckRTO es el sistema de inspección vehicular #1 en la Argentina.",
};


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, workshops } = await getUserFromCookies();
  
  return (
    <html lang="es">
      <body className={poppins.variable}>
        <ClientLayout user={user} workshops={workshops}>{children}</ClientLayout>
      </body>
    </html>
  );
}
