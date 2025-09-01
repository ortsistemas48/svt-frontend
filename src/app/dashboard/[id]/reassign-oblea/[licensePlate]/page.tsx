"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { fetchAvailableStickerOrders } from "@/utils";

type StickerData = {
  id: number;
  sticker_number: string | null;
  expiration_date: string | null;
  issued_at: string | null;
  status: string | null;
};

type StickerOrderData = {
  id: number;
  name: string | null;
  available_count: number | null;
};

type CarData = {
  id: number;
  license_plate: string;
  brand?: string;
  model?: string;
  sticker_id?: number | null;
  sticker?: StickerData | null;
};

export default function ReassignStickerPage() {
  const { id, licensePlate } = useParams<{ id: string; licensePlate: string }>();
  const router = useRouter();

  const [car, setCar] = useState<CarData | null>(null);

  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [stickerOrders, setStickerOrders] = useState<StickerOrderData[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [newStickerOrderId, setNewStickerOrderId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  // Modal de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewStickerId, setPreviewStickerId] = useState<number | null>(null);
  const [previewStickerNumber, setPreviewStickerNumber] = useState<string>("");

  useEffect(() => { setNewStickerOrderId(""); }, [stickerOrders]);

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

  // 2) Traer órdenes con disponibilidad
  useEffect(() => {
    if (!car) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingOrders(true);
        const data = await fetchAvailableStickerOrders({
          workshopId: Number(id),
          currentCarId: car.id,
          currentLicensePlate: car.license_plate,
        });
        if (cancelled) return;

        setStickerOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setStickerOrders([]);
        }
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    })();

    return () => { cancelled = true; };
  }, [car, id]);

  const noAvailable = stickerOrders.length === 0;

  // Paso 1: al hacer click en "Aplicar", pedimos el preview y abrimos modal
  const handleApply = async () => {
    if (!car || !newStickerOrderId) return;

    try {
      setLoading(true);
      setErr("");

      // Pido la próxima oblea disponible para mostrar en el modal
      const previewRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/stickers/next-available?sticker_order_id=${Number(newStickerOrderId)}`,
        { credentials: "include" }
      );

      if (!previewRes.ok) {
        const errData = await previewRes.json().catch(() => ({}));
        throw new Error(errData.error || "No hay obleas disponibles en esa orden.");
      }

      const preview = await previewRes.json() as { id: number; sticker_number: string | null };
      setPreviewStickerId(preview.id);
      setPreviewStickerNumber(preview.sticker_number ?? `#${preview.id}`);
      setConfirmOpen(true); // abrir modal
    } catch (e: any) {
      console.error(e);
      setErr(e.message || "Ocurrió un error al preparar la reasignación.");
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: confirmar en el modal y hacer el POST real
  const confirmReassign = async () => {
    if (!car || !newStickerOrderId) return;

    try {
      setLoading(true);
      setErr("");
      setConfirmOpen(false);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stickers/reassign-sticker`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_plate: car.license_plate,
          sticker_order_id: Number(newStickerOrderId),
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
                <div className="text-gray-500">Marca, Modelo</div>
                <div className="font-medium">
                  {car ? `${car.brand ?? ""} ${car.model ?? ""}`.trim() || "—" : "—"}
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

        {/* Seleccionar orden de obleas */}
        <section className="mb-10">
          <h3 className="text-sm text-[#0f172a] mb-2">Asignar nueva oblea</h3>

          <select
            className={`w-full border rounded-md px-4 py-3 ${stickerOrders.length === 0 ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed" : "border-[#D9D9D9]"}`}
            value={stickerOrders.length === 0 ? "" : newStickerOrderId}
            onChange={(e) => setNewStickerOrderId(e.target.value)}
            disabled={loading || stickerOrders.length === 0}
          >
            <option value="">
              {stickerOrders.length === 0 ? "No hay obleas disponibles para este taller" : "Seleccioná una orden de obleas"}
            </option>
            {stickerOrders.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name ?? `Orden #${s.id}`} {typeof s.available_count === "number" ? `(${s.available_count} disp.)` : ""}
              </option>
            ))}
          </select>

          {stickerOrders.length === 0 && (
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
            className="w-56 rounded border duration-150 border-[#0A4DCC] text-[#0A4DCC] bg-white py-3 hover:bg-[#0A4DCC] hover:text-white disabled:opacity-60"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={loading || stickerOrders.length === 0 || !newStickerOrderId}
            className="w-56 rounded duration-150 bg-[#0A4DCC] text-white py-3 hover:bg-[#0843B2] disabled:opacity-60"
          >
            Aplicar cambios
          </button>
        </div>
      </div>

      {/* Modal de confirmación */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmOpen(false)} />
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h4 className="text-xl font-semibold mb-2">Confirmar reasignación</h4>
            <p className="text-gray-700">
              Vas a asignar la oblea{" "}
              <span className="font-semibold">
                {previewStickerNumber || "desconocida"}
              </span>{" "}
              al dominio{" "}
              <span className="font-semibold">{car?.license_plate}</span>.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Se toma la primera oblea disponible de la orden seleccionada.
            </p>

            <div className="mt-6 flex gap-3 justify-center">
              <button
                type="button"
                className="px-4 py-2 rounded border duration-150 border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setConfirmOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded duration-150 bg-[#0A4DCC] text-white hover:bg-[#0843B2]"
                onClick={confirmReassign}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
