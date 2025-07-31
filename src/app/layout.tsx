import "./globals.css";
import { Poppins } from "next/font/google";
import { cookies } from "next/headers";
import ClientLayout from "./ClientLayout"; // importás el nuevo wrapper

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-poppins",
});

export const metadata = {
  title: "RTO",
  description: "Sistema RTO",
};

async function getUserFromCookies() {
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

    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromCookies();

  return (
    <html lang="es">
      <body className={poppins.variable}>
        <ClientLayout user={user}>{children}</ClientLayout>
      </body>
    </html>
  );
}
