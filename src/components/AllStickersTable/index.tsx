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
import TableFilters from "../TableFilters";

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
export default function StickerOrdersTable({ externalSearchQuery = "" }: { externalSearchQuery?: string }) {
  const { id } = useParams();

  const [rows, setRows] = useState<StickerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || "");
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
  const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const headers: TableHeader[] = [
    { label: "Número", thProps: { style: { width: "180px", minWidth: "180px" } } },
    { label: "Estado", thProps: { style: { width: "140px", minWidth: "140px" } } },
    { label: "Emitida", thProps: { style: { width: "110px", minWidth: "110px" } } },
    { label: "Patente", thProps: { style: { width: "100px", minWidth: "100px" } } },
  ];

  const fetchStickers = async (p = page, search = searchQuery, status = statusFilter) => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMsg(null);

      const usp = new URLSearchParams({
        page: String(p),
        per_page: String(perPage),
      });

      if (search.trim()) {
        usp.set("q", search.trim());
      }

      if (status !== "Todos") {
        usp.set("status", uiToApi[status]);
      }

      
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
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchStickers(page, searchQuery, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page, searchQuery, statusFilter]);

  // Sincronizar searchQuery externo
  useEffect(() => {
    if (externalSearchQuery !== undefined && externalSearchQuery !== searchQuery) {
      setSearchQuery(externalSearchQuery);
      setQ(externalSearchQuery);
      setPage(1);
    }
  }, [externalSearchQuery]);

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
    <div className="px-0 sm:px-0">
      {errorMsg && (
        <div className="mb-3 rounded-[4px] border border-red-300 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700 mx-1 sm:mx-0">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-3 rounded-[4px] border border-green-300 bg-green-50 px-3 py-2 text-xs sm:text-sm text-green-700 mx-1 sm:mx-0">
          {successMsg}
        </div>
      )}

      <div className="hidden sm:flex mb-4 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between overflow-visible">
        <div className="flex flex-1 gap-3 px-[1.5px] pt-1 overflow-visible">
          <div className="relative flex-1">
            <input
              disabled={loading}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-[4px] border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#0040B8] disabled:cursor-not-allowed disabled:bg-gray-100 sm:px-4 sm:py-3 sm:pr-12 sm:text-base"
              placeholder="Buscar por número, patente u orden"
              onKeyDown={(e) => {
                if (e.key === "Enter") setSearchQuery(q);
              }}
            />
            <button
              disabled={loading}
              onClick={() => setSearchQuery(q)}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors duration-200 disabled:opacity-50 sm:right-3"
              type="button"
            >
              <Search size={16} />
            </button>
          </div>
          <div className="hidden sm:block relative">
            <button
              disabled={loading}
              onClick={() => {
                setShowFilters(!showFilters);
                setPage(1);
              }}
              className="flex bg-[#0040B8] items-center justify-center gap-2 rounded-[4px] border border-gray-300 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-[#0040B8] hover:border-[#0040B8] disabled:opacity-50 sm:px-4 sm:py-3 sm:text-base"
            >
              <SlidersHorizontal size={16} className="text-white" />
              <span className="hidden sm:inline text-white">Filtrar</span>
            </button>
            {showFilters && <TableFilters tableFilters={TABLE_FILTERS} statusFilter={statusFilter} setStatusFilter={(status) => setStatusFilter(status as UiState)} setShowFilters={setShowFilters} setPage={setPage} />}
          </div>
          <RefreshButton loading={loading} fetchApps={() => fetchStickers(page)} />
        </div>
      </div>

      {/* Vista de tarjetas para mobile/tablet */}
      <div className="xl:hidden px-1 sm:px-0">
        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            {[...Array(perPage)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 sm:p-4 animate-pulse">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="border border-gray-200 rounded-lg p-4 sm:p-6 md:p-8 text-center">
            <p className="text-xs sm:text-sm md:text-base text-gray-500">No hay obleas para mostrar</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {rows.map((item) => {
              const ui = apiToUi(item.status);
              const tone = statusTone(ui);
              const isUpdating = updatingId === item.id;
              const isMenuOpen = openMenuId === item.id;

              return (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 space-y-3 relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-3 min-w-0">
                      {/* Número de oblea */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Número</p>
                        <p className="text-sm font-semibold text-gray-900 break-words">
                          {item.sticker_number || "-"}
                        </p>
                      </div>

                      {/* Estado y Patente en una fila */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Estado</p>
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${tone.text} ${tone.bg}`}
                          >
                            {ui}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Patente</p>
                          <span className="inline-block rounded-full px-2.5 py-1 text-xs font-medium text-gray-800 bg-gray-100">
                            {item.license_plate || "—"}
                          </span>
                        </div>
                      </div>

                      {/* Fecha de emisión */}
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Emitida</p>
                        <p className="text-xs text-gray-900">{fmtDate(item.issued_at)}</p>
                      </div>
                    </div>

                  </div>
                  
                  {isUpdating && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <Loader2 size={14} className="animate-spin" />
                      Actualizando...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Vista de tabla para desktop */}
      <div className="hidden xl:block stk-table overflow-hidden rounded-[14px] border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <TableTemplate<StickerItem>
            headers={headers}
            items={rows}
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
                  <td className="p-3 text-center" style={{ width: "180px", minWidth: "180px" }}>
                    <div className="mx-auto truncate text-sm font-medium sm:text-base">
                      {item.sticker_number || "-"}
                    </div>
                  </td>

                  <td className="p-3 text-center" style={{ width: "140px", minWidth: "140px" }}>
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium sm:text-sm ${tone.text} ${tone.bg}`}
                    >
                      {ui}
                    </span>
                  </td>

                  <td className="p-3 text-center" style={{ width: "110px", minWidth: "110px" }}>
                    <div className="text-sm sm:text-base">{fmtDate(item.issued_at)}</div>
                  </td>

                  <td className="p-3 text-center" style={{ width: "100px", minWidth: "100px" }}>
                    <span className="inline-block rounded-full px-2 py-1 text-xs font-medium sm:text-sm text-gray-800 bg-gray-100">
                      {item.license_plate || "—"}
                    </span>
                  </td>
                </tr>
              );
            }}
              renderSkeletonRow={(cols, i) => (
                <tr key={`sk-row-${i}`} className="min-h-[60px] animate-pulse">
                  <td className="p-3 text-center" style={{ width: "180px", minWidth: "180px" }}><Sk className="mx-auto h-4 w-28" /></td>
                  <td className="p-3 text-center" style={{ width: "140px", minWidth: "140px" }}><Sk className="mx-auto h-4 w-20" /></td>
                  <td className="p-3 text-center" style={{ width: "110px", minWidth: "110px" }}><Sk className="mx-auto h-4 w-24" /></td>
                  <td className="p-3 text-center" style={{ width: "100px", minWidth: "100px" }}><Sk className="mx-auto h-4 w-16" /></td>
                </tr>
              )}
            />
        </div>
      </div>

      <div className="mt-4 sm:mt-6 flex flex-col items-center justify-start gap-3 text-xs sm:text-sm px-1 sm:px-0">
        {meta.total > meta.per_page && (
          <div className="flex items-center gap-2">
            <button
              className="rounded-[4px] border border-gray-300 px-2 sm:px-4 py-2 text-xs sm:text-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
              className="rounded-[4px] border border-gray-300 px-2 sm:px-4 py-2 text-xs sm:text-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
  buttonRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDisponible: () => void;
  onEnUso: () => void;
  onNoDisponible: () => void;
  disabled?: boolean;
  buttonRef?: { current: HTMLButtonElement | null };
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    // Calcular posición cuando se abre el menú (fixed es relativo al viewport)
    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      // Asegurar que el menú no se salga de la pantalla en mobile
      const menuWidth = 224; // w-56 = 224px
      const rightSpace = window.innerWidth - rect.right;
      const leftSpace = rect.left;
      
      let menuRight = window.innerWidth - rect.right;
      
      // Si no hay espacio a la derecha, posicionar a la izquierda
      if (rightSpace < menuWidth && leftSpace >= menuWidth) {
        menuRight = window.innerWidth - rect.left;
      }
      
      setPosition({
        top: rect.bottom + 4,
        right: menuRight,
      });
    }

    // Handlers para cerrar el menú
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      const target = e.target as Node;
      // No cerrar si el click es dentro del menú o del botón
      if (ref.current.contains(target) || buttonRef?.current?.contains(target)) {
        return;
      }
      onClose();
    };
    
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    // Agregar listeners después de un pequeño delay para evitar que se cierre inmediatamente
    // Esto permite que el estado se actualice y el menú se renderice antes de agregar los listeners
    const timeoutId = setTimeout(() => {
      // Usar click en lugar de mousedown/touchstart para mejor comportamiento en mobile
      // El capture phase asegura que se ejecute antes que otros handlers
      document.addEventListener("click", onDocClick, true);
      document.addEventListener("keydown", onKey);
    }, 10);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      // Remover listeners si ya se agregaron
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen || !position) return null;

  return (
    <div
      ref={ref}
      className="fixed z-[9999] w-56 overflow-hidden rounded-[4px] border border-gray-200 bg-white shadow-lg"
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`,
        maxWidth: `calc(100vw - 16px)`, // Asegurar que no se salga en mobile
      }}
      role="menu"
      aria-orientation="vertical"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDisponible();
          onClose();
        }}
        disabled={disabled}
        className="flex w-full items-center px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 touch-manipulation"
        role="menuitem"
        type="button"
      >
        Marcar como Disponible
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEnUso();
          onClose();
        }}
        disabled={disabled}
        className="flex w-full items-center px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 touch-manipulation"
        role="menuitem"
        type="button"
      >
        Marcar como En uso
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNoDisponible();
          onClose();
        }}
        disabled={disabled}
        className="flex w-full items-center px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50 touch-manipulation"
        role="menuitem"
        type="button"
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
