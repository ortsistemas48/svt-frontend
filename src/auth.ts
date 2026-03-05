// auth.ts
import { cookies } from "next/headers";
import { apiFetch } from "./utils";

type SessionOut = { user: any | null; workshops: any[] };

const BACKEND_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL || "https://svt-backend.onrender.com";

export async function getUserFromCookies(): Promise<SessionOut> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    // Call the backend directly — no loopback through Next.js rewrites
    const res = await fetch(`${BACKEND_ORIGIN}/auth/me`, {
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
  if (!user.user) {
    return { error: "Usuario no autenticado" }
  }
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