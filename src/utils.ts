

export async function fetchUserData({ workshopId }: { workshopId: number }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/get_users/workshop/${workshopId}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Error al traer la aplicación:", text);
    return;
  }
  const data = await res.json();
  return data;
}