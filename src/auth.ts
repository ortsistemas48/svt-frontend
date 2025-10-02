import { cookies } from "next/headers";

export async function getUserFromCookies() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  try {
    const res = await fetch(`/api/auth/me`, {
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