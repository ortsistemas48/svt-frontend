// components/StickerOrdersTable/index.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  EllipsisVertical,
  Loader2,
} from "lucide-react";
import TableTemplate, { TableHeader } from "@/components/TableTemplate";
import RefreshButton from "@/components/RefreshButton";

/* ===================== Tipos ===================== */
type StickerItem = {
  id: number;
  sticker_number: string;
  expiration_date?: string | null;
  issued_at?: string | null;
  status?: string | null;
  sticker_order_id?: number | null;
  order_name?: string | null;
  workshop_id: number;
  license_plate?: string | null;
};

type PaginationMeta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
  next_page?: number | null;
  prev_page?: number | null;
};

type StickersResponse = {
  stickers: StickerItem[];
  pagination: PaginationMeta;
};

/* ===================== Constantes ===================== */
const TABLE_FILTERS = ["Todos", "En Uso", "Disponible", "No Disponible"] as const;
type UiState = (typeof TABLE_FILTERS)[number];

// enviar tal cual al backend
const uiToApi: Record<Exclude<UiState, "Todos">, string> = {
  "En Uso": "En Uso",
  "Disponible": "Disponible",
  "No Disponible": "No Disponible",
};

// aceptar valores que vengan con mayúsculas o minúsculas
const apiToUi = (api?: string | null): UiState => {
  const s = (api || "").toLowerCase();
  if (s === "en uso") return "En Uso";
  if (s === "no disponible") return "No Disponible";
  if (s === "disponible") return "Disponible";
  // fallback
  return "Disponible";
};

/* ===================== Componente principal ===================== */
export default function StickerOrdersTable() {
  const { id } = useParams();

  const [rows, setRows] = useState<StickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UiState>("Todos");
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const perPage = 5;

  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    per_page: perPage,
    total: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
    next_page: null,
    prev_page: null,
  });

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const headers: TableHeader[] = [
    { label: "Número" },
    { label: "Estado" },
    { label: "Emitida" },
    { label: "Vencimiento" },
    { label: "Patente" },
    { label: "Acciones" },
  ];

  const fetchStickers = async (p = page) => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      const usp = new URLSearchParams({
        page: String(p),
        per_page: String(perPage),
      });

      const res = await fetch(
        `/api/stickers/workshop/${id}?${usp.toString()}`,
        { credentials: "include" }
      );

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "No se pudieron traer las obleas");
      }

      const data: StickersResponse = await res.json();
      setRows(Array.isArray(data?.stickers) ? data.stickers : []);
      if (data?.pagination) setMeta(data.pagination);
    } catch (err: any) {
      console.error(err);
      setRows([]);
      setMeta((m) => ({
        ...m,
        total: 0,
        total_pages: 1,
        has_next: false,
        has_prev: false,
      }));
      setErrorMsg(err?.message || "Error al cargar obleas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStickers(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page]);

  const filtered = useMemo(() => {
    let list = rows;

    if (searchQuery.trim()) {
      const s = searchQuery.trim().toLowerCase();
      list = list.filter((o) => {
        const byNumber = (o.sticker_number || "").toLowerCase().includes(s);
        const byPlate  = (o.license_plate || "").toLowerCase().includes(s);
        const byOrder  = (o.order_name || "").toLowerCase().includes(s);
        const byId     = String(o.id).includes(s);
        return byNumber || byPlate || byOrder || byId;
      });
    }

    if (statusFilter !== "Todos") {
      const target = uiToApi[statusFilter].toLowerCase(); // "disponible", "no disponible", "en uso"
      list = list.filter((o) => (o.status || "").toLowerCase() === target);
    }

    return list;
  }, [rows, searchQuery, statusFilter]);

  const statusTone = (ui: UiState) => {
    if (ui === "No Disponible")
      return { text: "text-red-700", bg: "bg-red-50" };
    if (ui === "En Uso")
      return { text: "text-yellow-800", bg: "bg-yellow-50" };
    return { text: "text-green-700", bg: "bg-green-50" };
  };

  const fmtDate = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("es-AR");
  };

  const updateStatus = async (row: StickerItem, nextUi: Exclude<UiState, "Todos">) => {
    const nextApi = uiToApi[nextUi]; // "Disponible" | "No Disponible" | "En Uso"
    const prev = row.status;
    try {
      setUpdatingId(row.id);
      setErrorMsg(null);
      setRows((r) => r.map((it) => (it.id === row.id ? { ...it, status: nextApi } : it)));

      const res = await fetch(`/api/stickers/${row.id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextApi }), // << español canónico
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "No se pudo actualizar el estado");
      }

      setSuccessMsg("Estado actualizado");
      setTimeout(() => setSuccessMsg(null), 1200);
    } catch (err: any) {
      setRows((r) => r.map((it) => (it.id === row.id ? { ...it, status: prev } : it)));
      setErrorMsg(err?.message || "Error al actualizar el estado");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {errorMsg && (
        <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-3 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3 px-[1.5px] pt-1">
          <input
            disabled={loading}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0040B8] disabled:cursor-not-allowed disabled:bg-gray-100 sm:px-4 sm:py-3 sm:text-base"
            placeholder="Buscar por número, patente u orden"
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearchQuery(q);
            }}
          />
          <button
            disabled={loading}
            onClick={() => setSearchQuery(q)}
            className="flex items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 sm:px-4 sm:py-3 sm:text-base"
          >
            <Search size={16} />
            <span className="hidden sm:inline">Buscar</span>
          </button>

          <button
            disabled={loading}
            onClick={() => setShowFilters(!showFilters)}
            className="bg-[#0040B8] flex items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#0040B8] hover:border-[#0040B8] disabled:opacity-50 sm:px-4 sm:py-3 sm:text-base"
          >
            <SlidersHorizontal size={16} className="text-white" />
            <span className="hidden sm:inline text-white">Filtrar</span>
          </button>

          <RefreshButton loading={loading} fetchApps={() => fetchStickers(page)} />
        </div>
      </div>

      {showFilters && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            {TABLE_FILTERS.map((opt) => {
              const active = statusFilter === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setStatusFilter(opt)}
                  className={[
                    "rounded-full px-3 py-1 text-sm border transition",
                    active
                      ? "bg-[#0040B8] text-white border-[#0040B8]"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="stk-table overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <TableTemplate<StickerItem>
              headers={headers}
              items={filtered}
              isLoading={loading}
              emptyMessage="No hay obleas para mostrar"
              rowsPerSkeleton={perPage}
              renderRow={(item) => {
                const ui = apiToUi(item.status);
                const tone = statusTone(ui);
                const isUpdating = updatingId === item.id;
                const isMenuOpen = openMenuId === item.id;

                return (
                  <tr key={item.id} className="transition-colors hover:bg-gray-50">
                    <td className="p-3 text-center">
                      <div className="mx-auto max-w-[220px] truncate text-sm font-medium sm:text-base">
                        {item.sticker_number || "-"}
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs font-medium sm:text-sm ${tone.text} ${tone.bg}`}
                      >
                        {ui}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <div className="text-sm sm:text-base">{fmtDate(item.issued_at)}</div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="text-sm sm:text-base">{fmtDate(item.expiration_date)}</div>
                    </td>

{/* 
                    <td className="p-3 text-center">
                      <div className="mx-auto max-w-[220px] truncate text-sm sm:text-base">
                        {item.order_name || "-"}
                      </div>
                    </td> */}

                    <td className="p-3 text-center">
                      <span className="inline-block rounded-full px-2 py-1 text-xs font-medium sm:text-sm text-gray-800 bg-gray-100">
                        {item.license_plate || "—"}
                      </span>
                    </td>

                    <td className="relative p-3 text-center">
                      {/* Botón solo ícono */}
                      <button
                        aria-haspopup="menu"
                        aria-expanded={isMenuOpen}
                        onClick={() => setOpenMenuId((cur) => (cur === item.id ? null : item.id))}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100"
                      >
                        <EllipsisVertical size={18} />
                        <span className="sr-only">Abrir acciones</span>
                      </button>

                      <RowActionsMenu
                        isOpen={isMenuOpen}
                        onClose={() => setOpenMenuId(null)}
                        disabled={isUpdating}
                        onDisponible={() => updateStatus(item, "Disponible")}
                        onEnUso={() => updateStatus(item, "En Uso")}
                        onNoDisponible={() => updateStatus(item, "No Disponible")}
                      />
                    </td>
                  </tr>
                );
              }}
              renderSkeletonRow={(cols, i) => (
                <tr key={`sk-row-${i}`} className="min-h-[60px] animate-pulse">
                  <td className="p-3 text-center"><Sk className="mx-auto h-4 w-28" /></td>
                  <td className="p-3 text-center"><Sk className="mx-auto h-4 w-20" /></td>
                  <td className="p-3 text-center"><Sk className="mx-auto h-4 w-24" /></td>
                  <td className="p-3 text-center"><Sk className="mx-auto h-4 w-24" /></td>
                  <td className="p-3 text-center"><Sk className="mx-auto h-4 w-28" /></td>
                  <td className="p-3 text-center"><Sk className="mx-auto h-4 w-16" /></td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center">
                      <Sk className="h-8 w-8 rounded-md" />
                    </div>
                  </td>
                </tr>
              )}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
        {meta.total > meta.per_page && (
          <div className="flex items-center gap-2">
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta.has_prev}
            >
              <span className="hidden sm:inline">Anterior</span>
              <span className="sm:hidden">‹</span>
            </button>
            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 sm:text-sm">
              Página {meta.page} de {meta.total_pages}
            </span>
            <button
              className="rounded-md border border-gray-300 px-3 py-2 text-xs transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta.has_next}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">›</span>
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        .stk-table thead { background-color: #fff !important; }
        .stk-table table { border-collapse: collapse; width: 100%; }
        .stk-table thead tr { border-bottom: 1px solid rgb(229 231 235); }
        .stk-table tbody > tr { border-top: 1px solid rgb(229 231 235); }
      `}</style>
    </div>
  );
}

/* ===================== Subcomponentes ===================== */
function Sk({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-gray-200/80 ${className}`} />;
}

function RowActionsMenu({
  isOpen,
  onClose,
  onDisponible,
  onEnUso,
  onNoDisponible,
  disabled,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDisponible: () => void;
  onEnUso: () => void;
  onNoDisponible: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={ref}
      className="absolute right-2 top-10 z-20 w-56 overflow-hidden rounded-md border border-gray-200 bg-white"
      role="menu"
      aria-orientation="vertical"
    >
      <button
        onClick={() => { onDisponible(); onClose(); }}
        disabled={disabled}
        className="flex w-full items-center px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50"
        role="menuitem"
      >
        Marcar como Disponible
      </button>
      <button
        onClick={() => { onEnUso(); onClose(); }}
        disabled={disabled}
        className="flex w-full items-center px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50"
        role="menuitem"
      >
        Marcar como En uso
      </button>
      <button
        onClick={() => { onNoDisponible(); onClose(); }}
        disabled={disabled}
        className="flex w-full items-center px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 disabled:opacity-50"
        role="menuitem"
      >
        Marcar como No disponible
      </button>

      {disabled && (
        <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 border-t border-gray-200">
          <Loader2 size={14} className="animate-spin" />
          Actualizando
        </div>
      )}
    </div>
  );
}
