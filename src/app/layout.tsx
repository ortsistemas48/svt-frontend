import "./globals.css";
import { Poppins } from "next/font/google";
import ClientLayout from "@/layouts/ClientLayout";
import { cookies } from "next/headers";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "Inspección Vehicular - RTO",
  description: "Sistema RTO",
};

export async function getUserFromCookies() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!res.ok) return { user: null, workshops: [] };

    const data = await res.json();
    return { user: data.user, workshops: data.workshops };
  } catch {
    return { user: null, workshops: [] };
  }
}
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
