// app/dashboard/[id]/reasign-oblea/[licensePlate]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type CarData = {
  id: number;
  license_plate: string;
  brand?: string;
  model?: string;
  sticker_id?: number | null;
};

type StickerData = {
  id: number;
  sticker_number: string | null;
  expiration_date: string | null;
  issued_at: string | null;
  status: string | null;
  sticker_order_id: number | null;
  workshop_id: number | null;
};

// Helper: detectar abortos intencionales (razón o DOMException)
const isAbort = (e: any) =>
  e?.name === "AbortError" ||
  e === "cleanup: unmount or deps change" ||
  e?.code === 20 ||
  /abort/i.test(String(e?.message ?? e));

export default function ReassignStickerPage() {
  const { id, licensePlate } = useParams<{ id: string; licensePlate: string }>();
  const router = useRouter();

  const [car, setCar] = useState<CarData | null>(null);
  const [sticker, setSticker] = useState<StickerData | null>(null);

  const [loadingCar, setLoadingCar] = useState(false);
  const [loadingSticker, setLoadingSticker] = useState(false);

  const [err, setErr] = useState<string>("");
  const [stickerErr, setStickerErr] = useState<string>("");

  const [newSticker, setNewSticker] = useState("");

  // 1) Traer el auto por licensePlate
  useEffect(() => {
    const plate = (licensePlate ?? "").trim().toUpperCase();
    if (!plate) {
      setErr("Falta la patente en la URL.");
      return;
    }

    const controller = new AbortController();
    let active = true;

    (async () => {
      try {
        setLoadingCar(true);
        setErr("");
        setCar(null);
        setSticker(null); // resetea info de oblea si cambió la patente

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/vehicles/get-vehicle-data/${encodeURIComponent(plate)}`,
          { credentials: "include", signal: controller.signal }
        );
        if (!res.ok) throw new Error("No se pudo cargar el vehículo");

        const data = (await res.json()) as CarData;
        if (!active) return;
        setCar(data);
      } catch (e: any) {
        if (isAbort(e)) return;
        console.error(e);
        if (active) setErr("Ocurrió un error al cargar el auto.");
      } finally {
        if (active) setLoadingCar(false);
      }
    })();

    return () => {
      active = false;
      controller.abort("cleanup: unmount or deps change");
    };
  }, [licensePlate]);

  // 2) Si el auto tiene sticker_id, traer la oblea
  useEffect(() => {
    if (!car?.sticker_id) {
      setSticker(null);
      setStickerErr("");
      return;
    }

    const controller = new AbortController();
    let active = true;

    (async () => {
      try {
        setLoadingSticker(true);
        setStickerErr("");
        setSticker(null);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/stickers/${car.sticker_id}`,
          { credentials: "include", signal: controller.signal }
        );
        if (!res.ok) throw new Error("No se pudo cargar la oblea actual");

        const data = (await res.json()) as StickerData | null;
        if (!active) return;
        setSticker(data);
      } catch (e: any) {
        if (isAbort(e)) return;
        console.error(e);
        if (active) setStickerErr("No se pudo cargar la oblea vinculada.");
      } finally {
        if (active) setLoadingSticker(false);
      }
    })();

    return () => {
      active = false;
      controller.abort("cleanup: unmount or deps change");
    };
  }, [car?.sticker_id]);

  const handleGenerate = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setNewSticker(`OB-${rand}`);
  };

  const handleApply = async () => {
    console.log("Aplicar cambios", {
      workshopId: id,
      licensePlate,
      newSticker,
    });
    // TODO: POST/PUT a tu endpoint de reasignación
  };

  const handleCancel = () => {
    router.back();
  };

  const loading = loadingCar || loadingSticker;

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      {/* Estados globales */}
      {loading && <p className="mb-4 text-gray-600">Cargando…</p>}
      {!loading && err && <p className="mb-4 text-red-600">{err}</p>}

      {/* Dominio a reasignar */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-[#0f172a] mb-2">Dominio a reasignar</h2>
        <div className="border border-[#D9D9D9] rounded-md p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="text-gray-500">Dominio</div>
              <div className="font-medium">
                {car?.license_plate ?? (licensePlate ?? "").toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Marca - Modelo</div>
              <div className="font-medium">
                {car ? `${car.brand ?? "-"} ${car.model ?? ""}` : "—"}
              </div>
            </div>
            <div>
              <div className="text-gray-500">Oblea vinculada</div>
              <div className="font-medium">
                {stickerErr
                  ? "—"
                  : sticker
                  ? sticker.sticker_number ?? `#${sticker.id}`
                  : car?.sticker_id
                  ? "Cargando oblea…"
                  : "No tiene oblea"}
              </div>
              {car?.sticker_id && (
                <div className="text-xs text-gray-500 mt-1">
                  {sticker?.status ? `Estado: ${sticker.status}` : ""}
                  {sticker?.expiration_date
                    ? ` • Vence: ${new Date(sticker.expiration_date).toLocaleDateString()}`
                    : ""}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Asignar oblea */}
      <section className="mb-10">
        <h3 className="text-sm text-[#0f172a] mb-2">Asignar oblea</h3>
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          <input
            type="text"
            placeholder="Seleccioná o generá una oblea"
            className="flex-1 rounded-md border border-[#D9D9D9] px-4 py-3 bg-[#efefef]"
            value={newSticker}
            onChange={(e) => setNewSticker(e.target.value)}
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleGenerate}
            className="rounded px-6 py-3 bg-[#0040B8] text-white font-medium hover:bg-[#0037a3] disabled:opacity-60"
            disabled={loading}
          >
            Generar
          </button>
        </div>
      </section>

      {/* Acciones */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
        <button
          type="button"
          onClick={handleCancel}
          className="w-56 rounded border border-[#0A4DCC] text-[#0A4DCC] bg-white py-3 font-medium hover:bg-[#0A4DCC] hover:text-white disabled:opacity-60"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="w-56 rounded bg-[#0A4DCC] text-white py-3 font-semibold hover:bg-[#0843B2] disabled:opacity-60"
          disabled={!newSticker || loading}
        >
          Aplicar cambios
        </button>
      </div>
    </div>
  );
}
