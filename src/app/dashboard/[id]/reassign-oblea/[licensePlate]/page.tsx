// app/dashboard/[id]/reasign-oblea/[licensePlate]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { fetchAvailableStickers } from "@/utils";

type StickerData = {
  id: number;
  sticker_number: string | null;
  expiration_date: string | null;
  issued_at: string | null;
  status: string | null;
};

type CarData = {
  id: number;
  license_plate: string;
  brand?: string;
  model?: string;
  sticker_id?: number | null;
  sticker?: StickerData | null; // el endpoint de vehicle ya puede traer el sticker completo
};

export default function ReassignStickerPage() {
  const { id, licensePlate } = useParams<{ id: string; licensePlate: string }>();
  const router = useRouter();

  const [car, setCar] = useState<CarData | null>(null);

  // obleas disponibles para reasignar
  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [newSticker, setNewSticker] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  // 1) Traer datos del auto por patente
  useEffect(() => {
    const plate = (licensePlate ?? "").trim().toUpperCase();
    if (!plate) {
      setErr("Falta la patente en la URL.");
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setErr("");
        setCar(null);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/vehicles/get-vehicle-data/${encodeURIComponent(plate)}`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("No se pudo cargar el vehículo");

        const data = (await res.json()) as CarData;
        setCar(data);
      } catch (e) {
        console.error(e);
        setErr("Ocurrió un error al cargar el auto.");
      } finally {
        setLoading(false);
      }
    })();
  }, [licensePlate]);

  // 2) Traer obleas disponibles para este taller (puede incluir la actual, según tu helper/endpoint)
  useEffect(() => {
    if (!car) return;

    (async () => {
      try {
        const data = await fetchAvailableStickers({
          workshopId: Number(id),
          currentCarId: car.id,
          currentLicensePlate: car.license_plate,
        });

        setStickers(data);

        // Si hay oblea actual y está entre las opciones → preseleccionar
        if (car.sticker_id && data.some((s: StickerData) => s.id === car.sticker_id)) {
          setNewSticker(String(car.sticker_id));
        } else {
          setNewSticker(""); // sin selección si no hay opciones o no coincide
        }
      } catch (e) {
        console.error(e);
        setStickers([]);
        setNewSticker("");
      }
    })();
  }, [car, id]);

  const handleApply = async () => {
    if (!car || !newSticker) return;

    try {
      setLoading(true);
      setErr("");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stickers/reassign-sticker`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_plate: car.license_plate,
          sticker_id: Number(newSticker),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al reasignar la oblea");
      }

      router.push(`/dashboard/${id}/reassign-oblea`);
    } catch (e: any) {
      console.error(e);
      setErr(e.message || "Ocurrió un error al reasignar.");
    } finally {
      setLoading(false);
    }
  };

  const noAvailable = stickers.length === 0;

  return (
    <div className="min-h-full">
      {loading && <p className="mb-3 text-gray-600">Cargando…</p>}
      {!loading && err && <p className="mb-3 text-red-600">{err}</p>}

      {/* Breadcrumb */}
      <article className="flex items-center justify-between text-lg mb-6 px-4">
        <div className="flex items-center gap-1">
          <span>Inicio</span>
          <ChevronRight size={20} />
          <span className="text-[#0040B8]">Reasignación de Oblea</span>
        </div>
      </article>

      <div className="px-10">
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-3xl text-[#0040B8]">Reasignación de Oblea</h2>
          <p className="text-gray-500 text-center">
            Busca el dominio del auto para reasignar la oblea
          </p>
        </div>

        {/* Dominio a reasignar */}
        <section className="mb-6 mt-6">
          <h2 className="text-md text-[#000000] mb-2">Dominio a reasignar</h2>
          <div className="border border-[#D9D9D9] rounded-md p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-gray-500">Dominio</div>
                <div className="font-medium">{car?.license_plate ?? licensePlate}</div>
              </div>
              <div>
                <div className="text-gray-500">Marca - Modelo</div>
                <div className="font-medium">
                  {car ? `${car.brand ?? "-"} ${car.model ?? ""}` : "—"}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Oblea actual</div>
                <div className="font-medium">
                  {car?.sticker?.sticker_number
                    ? car.sticker.sticker_number
                    : car?.sticker_id
                    ? `#${car.sticker_id}`
                    : "—"}
                </div>
                {car?.sticker && (
                  <div className="text-xs text-gray-500 mt-1">
                    {car.sticker.status ? `Estado: ${car.sticker.status}` : ""}
                    {car.sticker.expiration_date
                      ? ` • Vence: ${new Date(car.sticker.expiration_date).toLocaleDateString()}`
                      : ""}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Seleccionar oblea nueva */}
        <section className="mb-10">
          <h3 className="text-sm text-[#0f172a] mb-2">Asignar nueva oblea</h3>

          <select
            className={`w-full border rounded-md px-4 py-3 ${
              noAvailable
                ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                : "border-[#D9D9D9]"
            }`}
            value={noAvailable ? "" : newSticker}
            onChange={(e) => setNewSticker(e.target.value)}
            disabled={loading || noAvailable}
          >
            <option value="">
              {noAvailable
                ? "No hay obleas disponibles para este taller"
                : "Seleccioná una oblea"}
            </option>
            {!noAvailable &&
              stickers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sticker_number ?? `Oblea #${s.id}`}{" "}
                  {s.expiration_date
                    ? `(vence: ${new Date(s.expiration_date).toLocaleDateString()})`
                    : ""}
                </option>
              ))}
          </select>

          {noAvailable && (
            <p className="mt-2 text-sm text-gray-500">
              No hay obleas disponibles para este taller
            </p>
          )}
        </section>

        {/* Acciones */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-56 rounded border border-[#0A4DCC] text-[#0A4DCC] bg-white py-3 font-medium hover:bg-[#0A4DCC] hover:text-white disabled:opacity-60"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={loading || noAvailable || !newSticker}
            className="w-56 rounded bg-[#0A4DCC] text-white py-3 font-semibold hover:bg-[#0843B2] disabled:opacity-60"
          >
            Aplicar cambios
          </button>
        </div>
      </div>
    </div>
  );
} 
