"use client";

import { AlertTriangle, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import StickerOrdersTable, { StickerOrder } from "@/components/StickerOrdersTable";

// Mismo umbral que usa el Dashboard para avisar stock bajo
const LOW_STOCK = 250;

const fmtNumber = (n: number) => n.toLocaleString("es-AR");

export default function StickersPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<StickerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    if (success) {
      setSuccessMsg(success);
      router.replace(`/dashboard/${id}/stickers`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const usp = new URLSearchParams({ workshop_id: String(id) });
      const res = await fetch(`/api/stickers/list-orders?${usp.toString()}`, { credentials: "include" });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "No se pudieron traer los packs de obleas");
      }
      const data: StickerOrder[] = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setOrders([]);
      setErrorMsg(err?.message || "Error al cargar packs de obleas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const totals = useMemo(() => {
    const available = orders.reduce((acc, o) => acc + (Number(o.available_count) || 0), 0);
    const loaded = orders.reduce((acc, o) => acc + (Number(o.amount) || 0), 0);
    return { available, loaded, packs: orders.length };
  }, [orders]);

  return (
    <div className="max-w-8xl mx-auto px-1 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6">
      <nav aria-label="Ruta" className="flex items-center gap-1 text-xs sm:text-sm md:text-base mb-3 sm:mb-5">
        <Link href={`/dashboard/${id}`} className="text-gray-600 hover:text-[#0040B8]">
          Inicio
        </Link>
        <ChevronRight size={14} className="text-gray-400" />
        <span className="text-[#0040B8] font-medium">Obleas</span>
      </nav>

      <header className="mb-5 sm:mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl text-[#0040B8]">Obleas</h1>
          <p className="mt-1 max-w-[62ch] text-sm sm:text-base text-gray-500">
            Cargá los packs que recibís y seguí cuántas obleas te quedan.
          </p>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
          <Link
            href={`/dashboard/${id}/stickers/all`}
            className="inline-flex items-center justify-center rounded-[4px] border border-[#0040B8] bg-white px-4 py-2.5 text-sm font-medium text-[#0040B8] hover:bg-[#f0f6ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0040B8] focus-visible:ring-offset-2"
          >
            Ver todas las obleas
          </Link>
          <Link
            href={`/dashboard/${id}/stickers/assign-stickers`}
            className="inline-flex items-center justify-center gap-2 rounded-[4px] bg-[#0040B8] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#003080] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0040B8] focus-visible:ring-offset-2"
          >
            <Plus size={16} aria-hidden />
            Asignar nuevas obleas
          </Link>
        </div>
      </header>

      {errorMsg && (
        <div role="alert" className="mb-4 rounded-[4px] border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div role="status" className="mb-4 rounded-[4px] border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      <StockSummary id={id} loading={loading} {...totals} />

      <StickerOrdersTable orders={orders} loading={loading} onRefresh={fetchOrders} />
    </div>
  );
}

/* ===================== Stock del taller ===================== */
function StockSummary({
  id,
  loading,
  available,
  loaded,
  packs,
}: {
  id: string;
  loading: boolean;
  available: number;
  loaded: number;
  packs: number;
}) {
  const used = Math.max(0, loaded - available);
  const pct = loaded > 0 ? Math.round((available / loaded) * 100) : 0;
  const isEmpty = !loading && available === 0;
  const isLow = !loading && available > 0 && available <= LOW_STOCK;

  const fill = isEmpty ? "bg-red-600" : isLow ? "bg-amber-500" : "bg-[#0040B8]";

  return (
    <section
      aria-labelledby="stock-title"
      className="mb-6 sm:mb-8 rounded-[14px] border border-gray-200 bg-white p-4 sm:p-6"
    >
      <h2 id="stock-title" className="text-sm font-medium text-gray-700">
        Stock del taller
      </h2>

      {loading ? (
        <div className="mt-3 animate-pulse space-y-3">
          <div className="h-10 w-40 rounded bg-gray-200/80" />
          <div className="h-3 w-full rounded-full bg-gray-200/80" />
        </div>
      ) : (
        <>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-4xl sm:text-5xl font-semibold tabular-nums text-gray-900 leading-none">
              {fmtNumber(available)}
            </span>
            <span className="text-sm sm:text-base text-gray-600">
              obleas disponibles de {fmtNumber(loaded)} cargadas en {packs} {packs === 1 ? "pack" : "packs"}
            </span>
          </p>

          <div
            className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-200"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={loaded}
            aria-valuenow={available}
            aria-label="Obleas disponibles sobre el total cargado"
          >
            <div className={`h-full rounded-full ${fill} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
          </div>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs sm:text-sm text-gray-600">
            <span className="inline-flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${fill}`} aria-hidden />
              Disponibles {fmtNumber(available)}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-gray-300" aria-hidden />
              Usadas o dadas de baja {fmtNumber(used)}
            </span>
          </div>

          {(isEmpty || isLow) && (
            <div
              className={`mt-4 flex flex-col sm:flex-row sm:items-center gap-3 rounded-[4px] border px-3 py-2.5 text-sm ${
                isEmpty ? "border-red-300 bg-red-50 text-red-700" : "border-amber-300 bg-amber-50 text-amber-800"
              }`}
            >
              <span className="flex items-start gap-2 flex-1">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                {isEmpty
                  ? "No te quedan obleas. Sin stock no vas a poder completar revisiones."
                  : "Te quedan pocas obleas. Cargá un pack nuevo antes de quedarte sin stock."}
              </span>
              <Link
                href={`/dashboard/${id}/stickers/assign-stickers`}
                className="self-start sm:self-auto font-medium underline underline-offset-2 hover:no-underline"
              >
                Cargar pack
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}
