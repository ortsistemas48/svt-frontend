// auth.ts
import { cookies, headers } from "next/headers";
import { apiFetch } from "./utils";

type SessionOut = { user: any | null; workshops: any[] };

async function getBaseURL() {
  const h = await headers(); 
  const host =
    h.get("x-forwarded-host") || h.get("host") || process.env.VERCEL_URL;
  if (!host) throw new Error("No host header");

  const proto =
    h.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "production" ? "https" : "http");

  return `${proto}://${host}`;
}

export async function getUserFromCookies(): Promise<SessionOut> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const base = await getBaseURL();
    const res = await fetch(`${base}/api/auth/me`, {
      cache: "no-store",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    });

    if (!res.ok) return { user: null, workshops: [] };

    const data = await res.json().catch(() => null);
    return {
      user: data?.user ?? null,
      workshops: data?.workshops ?? [],
    };
  } catch {
    return { user: null, workshops: [] };
  }
}

interface Props {
  workshopId: string
}
export default async function fetchUserTypeInWorkshop({ workshopId }: Props) {
  const user = await getUserFromCookies()
  const res = await apiFetch(`/api/users/user-type-in-workshop?userId=${user.user.id}&workshopId=${workshopId}`,
    { credentials: "include"}
  )
  if (res.ok) {
    const data = await res.json()
    return data
  }
  else {
    return {error: "No se puedo hacer la llamada a la api"}
  }
  
}