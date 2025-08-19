import "./globals.css";
import { Poppins } from "next/font/google";
import ClientLayout from "@/layouts/ClientLayout";
import { getUserFromCookies } from "@/auth";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "Inspección Vehicular - RTO",
  description: "Sistema RTO",
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
