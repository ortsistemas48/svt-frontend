"use client";

import Link from "next/link";
import clsx from "clsx";
import { useState, useRef, useEffect } from "react";
import { BarChart3, PieChart, CalendarRange, ArrowUpRight, ArrowDownRight, LineChart, Users, ClipboardList, CheckCircle2, ChevronRight, FolderX, AlertCircle, Calendar, WifiOff, Ticket } from "lucide-react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import Card from "@/components/Card";
import { parseISODateLocal, formatISODateLocal } from "./dates";

export type Overview = {
  date_from: string;
  date_to: string;
  workshop_id: number;
  totals: { created: number; completed: number; in_queue: number; approved: number; approval_rate: number; active_users?: number };
};

export type DailyItem = { date: string; created: number; completed: number; approved: number };
export type Daily = { items: DailyItem[]; total_days: number };
export type StatusBreakdown = { items: { status: string; count: number }[]; total: number };
export type ResultBreakdown = { items: { result: string; count: number }[]; total: number };
export type TopModels = { items: { model: string; count: number; brand?: string | null }[]; total_models: number };
export type TopBrands = { items: { brand: string; count: number }[]; total: number };
export type UsageTypes = { items: { use_type: string; count: number }[]; total: number };
export type CommonErrors = { items: { step_name: string; count: number; percentage: number }[]; total: number };
export type Expirations = { items: { license_plate: string; contact: string; days_until: number; expiration_date: string }[]; total: number };
export type LostStickers = { count: number; items: { reason: string; count: number; percentage: number }[] };

/* ===========================
   UI helpers
=========================== */

function EmptyState({
  title = "Sin datos",
  subtitle = "No encontramos información para el rango seleccionado",
  icon: Icon = FolderX,
  className,
  children,
}: {
  title?: string;
  subtitle?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={clsx("flex flex-col items-center justify-center text-center py-8 px-4", className)}>
      <Icon className="h-8 w-8 text-gray-400" />
      <p className="mt-3 text-sm font-medium text-gray-900">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

/**
 * Una tarjeta cuya llamada falló muestra esto, nunca un cero: un cero real y un backend
 * caído tienen que verse distinto.
 */
function ErrorState({ className }: { className?: string }) {
  return (
    <EmptyState
      title="No se pudieron cargar los datos"
      subtitle="Reintentá recargando la página"
      icon={WifiOff}
      className={className}
    />
  );
}

/* Resultados de revisión. 'Condicional Vencido' es una categoría propia: antes caía en el
   gris genérico y sin nombre, aun siendo el resultado de una oblea perdida. */
const RESULT_COLORS: Record<string, string> = {
  "Apto": "#0040B8",
  "Aprobadas": "#0040B8",
  "Rechazado": "#212121",
  "Rechazadas": "#212121",
  "Condicional": "#f97316",
  "Condicional Vencido": "#eab308",
  "Pendientes": "#f97316",
};

const RESULT_LABELS: Record<string, string> = {
  "Apto": "Aprobadas",
  "Rechazado": "Rechazadas",
  "Condicional Vencido": "Condicional vencido",
};

function getResultColor(result: string | null | undefined): string {
  return RESULT_COLORS[result || ""] || "#6b7280";
}

function getResultLabel(result: string | null | undefined): string {
  return RESULT_LABELS[result || ""] ?? result ?? "Sin dato";
}

/* Motivos de pérdida de obleas, tal como los devuelve el backend en sticker_events */
const LOST_REASON_LABELS: Record<string, string> = {
  "Abandono": "Abandono de revisión",
  "Condicional Vencido": "Condicional vencido",
  "Rechazado": "Revisión rechazada",
  "Baja Manual": "Baja manual",
  "Sin clasificar": "Sin clasificar",
};

const LOST_REASON_COLORS: Record<string, string> = {
  "Abandono": "#f97316",
  "Condicional Vencido": "#eab308",
  "Rechazado": "#212121",
  "Baja Manual": "#0040B8",
  "Sin clasificar": "#9ca3af",
};

function getLostReasonLabel(reason: string): string {
  return LOST_REASON_LABELS[reason] ?? reason ?? "Sin clasificar";
}

function getLostReasonColor(reason: string): string {
  return LOST_REASON_COLORS[reason] ?? "#6b7280";
}

function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full bg-emerald-500" style={{ width: `${v}%` }} />
    </div>
  );
}

function TinyBars({ data, max }: { data: number[]; max: number }) {
  if (!data?.length || max <= 0) {
    return <EmptyState title="Sin serie" subtitle="No hay puntos para graficar" icon={BarChart3} className="h-16" />;
  }
  const localMax = Math.max(1, max || Math.max(...data, 1));
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((n, i) => {
        const h = Math.max(4, Math.round((n / localMax) * 64));
        return <div key={i} className="w-2 bg-[#0040B8] rounded-sm" style={{ height: h }} />;
      })}
    </div>
  );
}

function ColorBadge({ label, value, ring, bg, text }: { label: string; value: number; ring: string; bg: string; text: string }) {
  return (
    <div className={clsx("rounded-[4px] ring-1 ring-inset px-2.5 py-1 text-xs font-medium inline-flex items-center gap-2", ring, bg, text)}>
      <span className="opacity-80">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function getUsageTypeLabel(useType: string): string {
  if (!useType) return "Sin dato";
  
  // Normalizar: trim y uppercase
  const normalized = useType.trim().toUpperCase();
  
  const mapping: Record<string, string> = {
    "A": "Oficial",
    "B": "Diplomático, Consular u Org. Internacional",
    "C": "Particular",
    "D": "De alquiler / alquiler con chofer (Taxi - Remis)",
    "E": "Transporte Público",
    "E1": "Servicio internacional; larga distancia/urbanos M1-M3",
    "E2": "Inter/Jurisdiccional; regulares/turismo M1-M3",
    "F": "Transporte escolar",
    "G": "Comercial",
    "H": "Emergencia/seguridad/fúnebres/remolque/maquinaria",
  };
  
  return mapping[normalized] || useType;
}

function DateRangePicker({ from, to, thisMonth }: { from: string; to: string; thisMonth: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>({
    from: from ? parseISODateLocal(from) : undefined,
    to: to ? parseISODateLocal(to) : undefined,
  });
  const [selectingTo, setSelectingTo] = useState(true); // true = seleccionando "to", false = seleccionando "from"
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;

    // Si no hay rango o el rango está completo, empezar nuevo rango con esta fecha como "to"
    if (!range?.to || (range?.from && range?.to)) {
      setRange({ from: undefined, to: selectedDate });
    } else if (range.to && !range.from) {
      // Ya hay "to", ahora establecer "from"
      // Si la fecha seleccionada es posterior a "to", intercambiar
      if (selectedDate > range.to) {
        setRange({ from: range.to, to: selectedDate });
      } else {
        setRange({ from: selectedDate, to: range.to });
      }
    }
  };

  const handleApply = () => {
    if (range?.from && range?.to) {
      // Componentes locales, no toISOString: el usuario eligió días en su calendario
      window.location.href = `?from=${formatISODateLocal(range.from)}&to=${formatISODateLocal(range.to)}`;
    }
  };

  const handleThisMonth = () => {
    window.location.href = `?month=${thisMonth}`;
  };

  const handleReset = () => {
    setRange({ from: undefined, to: undefined });
    setSelectingTo(true);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          // Si hay un rango completo, resetear para empezar nuevo rango
          if (range?.from && range?.to) {
            setSelectingTo(true);
          }
        }}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 sm:px-4 py-2 shadow-sm hover:border-gray-300 transition-colors text-xs sm:text-sm w-full sm:w-auto"
      >
        <Calendar className="w-4 h-4 text-gray-600" />
        <span className="text-gray-700 font-medium">
          {range?.from && range?.to ? `${formatDate(range.from)} - ${formatDate(range.to)}` : "Seleccionar fechas"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] p-3 sm:p-4 w-[calc(100vw-2rem)] sm:w-auto sm:max-w-none max-w-[calc(100vw-2rem)] overflow-auto max-h-[90vh]">
          <DayPicker
            mode="single"
            selected={selectingTo ? range?.to : range?.from}
            onSelect={(date) => {
              if (!date) return;
              
              // Si tenemos un rango completo, reiniciar con el nuevo clic como "to"
              if (range?.from && range?.to) {
                setRange({ from: undefined, to: date });
                setSelectingTo(false);
                return;
              }
              
              if (selectingTo) {
                // Primer clic: establecer "to" (hasta)
                setRange({ from: undefined, to: date });
                setSelectingTo(false); // Siguiente clic será "from"
              } else {
                // Segundo clic: establecer "from" (desde)
                if (range?.to) {
                  if (date > range.to) {
                    // La fecha seleccionada es posterior a "to", intercambiar
                    setRange({ from: range.to, to: date });
                  } else {
                    // La fecha seleccionada es anterior a "to", orden correcto
                    setRange({ from: date, to: range.to });
                  }
                  setSelectingTo(true); // Siguiente clic reinicia
                }
              }
            }}
            modifiers={{
              in_range: (date) => {
                if (!range?.from || !range?.to) return false;
                const dateTime = date.getTime();
                const fromTime = range.from.getTime();
                const toTime = range.to.getTime();
                return dateTime >= fromTime && dateTime <= toTime;
              },
              range_start: (date) => {
                if (!range?.from) return false;
                return date.toDateString() === range.from.toDateString();
              },
              range_end: (date) => {
                if (!range?.to) return false;
                return date.toDateString() === range.to.toDateString();
              },
            }}
            modifiersClassNames={{
              selected: "bg-[#0040B8] text-white hover:bg-[#0030a0]",
              in_range: "bg-blue-100 text-blue-900 hover:bg-blue-200",
              range_start: "bg-[#0040B8] text-white rounded-l-md",
              range_end: "bg-[#0040B8] text-white rounded-r-md",
            }}
            numberOfMonths={isMobile ? 1 : 2}
            className="rounded-lg"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
              month: "space-y-4 w-full",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium text-gray-900",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md transition-colors",
              day_selected: "bg-[#0040B8] text-white hover:bg-[#0030a0] hover:text-white focus:bg-[#0040B8] focus:text-white rounded-md",
              day_today: "bg-gray-100 text-gray-900 font-semibold",
              day_outside: "day-outside text-gray-400 opacity-50 aria-selected:bg-gray-100 aria-selected:text-gray-400 aria-selected:opacity-30",
              day_disabled: "text-gray-400 opacity-50",
              day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-gray-900",
              day_hidden: "invisible",
            }}
          />
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleThisMonth}
                className="rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-xs sm:text-sm w-full sm:w-auto"
              >
                Este mes
              </button>
              {(range?.from || range?.to) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-xs sm:text-sm w-full sm:w-auto"
                >
                  Limpiar
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-3 sm:px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-xs sm:text-sm w-full sm:w-auto"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!range?.from || !range?.to}
                className="rounded-lg border border-[#0040B8] bg-[#0040B8] px-3 sm:px-4 py-2 text-white font-medium hover:bg-[#0030a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm w-full sm:w-auto"
              >
                Aplicar
              </button>
            </div>
          </div>
          {range?.to && !range?.from && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              Selecciona la fecha de inicio (desde)
            </div>
          )}
          {!range?.to && (
            <div className="mt-2 text-xs text-gray-500 text-center">
              Selecciona la fecha de fin (hasta)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Escala del eje Y a partir del máximo real. Antes los ticks eran múltiplos fijos de 55
 * con fallback 220, así que un taller con 3 revisiones dibujaba barras invisibles contra
 * un eje de 0 a 220.
 */
function niceScale(max: number, steps = 4): { ticks: number[]; maxTick: number } {
  if (!Number.isFinite(max) || max <= 0) {
    return { ticks: [0, 1, 2, 3, 4], maxTick: 4 };
  }
  const rawStep = max / steps;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  const niceStep = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
  const maxTick = Math.ceil(max / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let v = 0; v <= maxTick + niceStep / 2; v += niceStep) {
    ticks.push(Math.round(v));
  }
  return { ticks, maxTick };
}

function WeeklyChart({ data, yAxisTicks, maxTick }: { data: Array<{ label: string; value: number }>; yAxisTicks: number[]; maxTick: number }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Invertir el orden de los ticks para que el 0 esté abajo
  const reversedTicks = [...yAxisTicks].reverse();

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-10 flex flex-col justify-between text-[10px] sm:text-xs text-gray-500 pr-2" style={{ width: "30px" }}>
        {reversedTicks.map((tick, idx) => (
          <span key={`y-axis-${tick}-${idx}`} className="text-right">{tick}</span>
        ))}
      </div>
      
      {/* Chart area */}
      <div className="ml-8 sm:ml-10 relative" style={{ height: "200px", maxHeight: "240px" }}>
        {/* Grid lines horizontales */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {reversedTicks.map((tick, idx) => (
            <div key={`grid-${tick}-${idx}`} className="border-t border-dashed border-gray-200" style={{ borderTopWidth: idx === reversedTicks.length - 1 ? "0" : "1px" }} />
          ))}
        </div>
        
        {/* Bars */}
        <div className="absolute inset-0 flex items-end justify-between gap-3 pb-10 px-1">
          {data.map((week, i) => {
            const height = maxTick > 0 ? (week.value / maxTick) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full relative">
                <div className="w-full flex items-end justify-center h-full relative">
                  <div
                    className="w-full bg-[#0040B8] rounded-t-lg cursor-pointer transition-opacity hover:opacity-80 relative"
                    style={{ 
                      height: `${height}%`, 
                      minHeight: week.value > 0 ? "4px" : "0",
                      maxHeight: "100%"
                    }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {hoveredIndex === i && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg pointer-events-none whitespace-nowrap z-20"
                      >
                        {week.value} revisiones
                        <div className="absolute left-1/2 top-full -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-gray-600 font-medium">{week.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ===========================
   Main component
=========================== */

export default function Statistics({
  workshopId,
  from,
  to,
  comparisonLabel,
  overview,
  overviewPrev,
  daily,
  status,
  results,
  resultsPrev,
  topModels,
  topBrands,
  usageTypes,
  commonErrors,
  expirations,
  lostStickers,
}: {
  workshopId: number;
  from: string;
  to: string;
  comparisonLabel: string;
  overview: Overview | null;
  overviewPrev?: Overview | null;
  daily: Daily | null;
  status: StatusBreakdown | null;
  results: ResultBreakdown | null;
  resultsPrev?: ResultBreakdown | null;
  topModels: TopModels | null;
  topBrands?: TopBrands | null;
  usageTypes?: UsageTypes | null;
  commonErrors?: CommonErrors | null;
  expirations?: Expirations | null;
  lostStickers?: LostStickers | null;
}) {
  // Un null significa "la llamada falló", distinto de "no hubo actividad". Solo se usa
  // este placeholder para las fechas del encabezado; las tarjetas muestran el error.
  const safeOverview = overview ?? ({
    date_from: from,
    date_to: to,
    workshop_id: workshopId,
    totals: { created: 0, completed: 0, in_queue: 0, approved: 0, approval_rate: 0 },
  } as Overview);

  /**
   * Porcentaje de un resultado sobre el total de revisiones completadas del período.
   * Devuelve null cuando no hay base de comparación posible, para no mostrar un 0% que
   * se lee como "ninguna revisión aprobó".
   */
  function rateOf(data: ResultBreakdown | null | undefined, matches: (r: string) => boolean): number | null {
    if (!data || !data.total) return null;
    const found = data.items.filter(item => matches((item.result || "").toLowerCase().trim()));
    const count = found.reduce((acc, item) => acc + item.count, 0);
    return Math.round((count / data.total) * 100);
  }

  const isApto = (r: string) => r === "apto" || r === "aprobadas" || r === "aprobado";
  const isRechazado = (r: string) => r === "rechazado" || r === "rechazadas";
  // 'Condicional Vencido' es su propia categoría: un condicional que venció no es un
  // condicional pendiente, y sumarlos acá inflaba la tasa de condicional.
  const isCondicional = (r: string) => r === "condicional";

  const approvalRate = rateOf(results, isApto);
  const rejectionRate = rateOf(results, isRechazado);
  const conditionalRate = rateOf(results, isCondicional);

  const prevApprovalRate = rateOf(resultsPrev, isApto);
  const prevRejectionRate = rateOf(resultsPrev, isRechazado);
  const prevConditionalRate = rateOf(resultsPrev, isCondicional);

  // Un delta solo existe si hay ambos extremos. Antes, sin período previo se mostraba
  // "+0%", que se lee como "no cambió" en vez de "no hay con qué comparar".
  const diff = (cur: number | null, prev: number | null) =>
    cur === null || prev === null ? null : cur - prev;

  const approvalDelta = diff(approvalRate, prevApprovalRate);
  const rejectionDelta = diff(rejectionRate, prevRejectionRate);
  const conditionalDelta = diff(conditionalRate, prevConditionalRate);

  const createdDelta = (() => {
    const prevVal = overviewPrev?.totals?.created;
    const curVal = overview?.totals?.created;
    if (prevVal === undefined || curVal === undefined || prevVal <= 0) return null;
    return ((curVal - prevVal) / prevVal) * 100;
  })();

  function Delta({ value, suffix = "%", inverted = false }: { value: number | null; suffix?: string; inverted?: boolean }) {
    if (value === null) {
      return <span className="text-gray-400">Sin base de comparación</span>;
    }
    const v = Math.round(value * 10) / 10;
    const positive = v > 0;
    const negative = v < 0;
    const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : ArrowUpRight;
    // Invertido: en rechazo y condicional, subir es malo
    const good = inverted ? negative : positive;
    const bad = inverted ? positive : negative;
    const color = good ? "text-emerald-600" : bad ? "text-rose-600" : "text-gray-500";
    const sign = positive ? "+" : "";
    return (
      <span className={`inline-flex items-center gap-1 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        {sign}{Math.abs(v)}{suffix}
        <span className="text-gray-500 ml-1">{comparisonLabel}</span>
      </span>
    );
  }

  const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  // Calcular si hay más de 6 semanas en el rango
  const dateFrom = parseISODateLocal(from);
  const dateTo = parseISODateLocal(to);
  const daysDiff = Math.round((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const weeksDiff = Math.ceil(daysDiff / 7);
  const useMonthly = weeksDiff > 6;

  // Agrupar datos diarios por semana o mes según el rango.
  // Todas las fechas se parsean en hora local: con new Date("2026-09-01") el día 1 caía
  // en el mes anterior al leerlo con getMonth() desde Argentina.
  const chartData = (() => {
    if (!daily?.items?.length) return { data: [], isMonthly: false };

    if (useMonthly) {
      const byMonth: Record<string, number> = {};
      daily.items.forEach(item => {
        const date = parseISODateLocal(item.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        byMonth[monthKey] = (byMonth[monthKey] || 0) + item.created;
      });
      // Sin slice: recortar en silencio hacía que el gráfico mostrara menos revisiones
      // de las que el rango contiene.
      const data = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => {
          const [, month] = key.split("-");
          return { label: MONTH_NAMES[parseInt(month) - 1], value };
        });
      return { data, isMonthly: true };
    } else {
      const byWeek: Record<string, number> = {};
      daily.items.forEach(item => {
        const date = parseISODateLocal(item.date);
        // Lunes de la semana, sin mutar la fecha original
        const dayOfWeek = date.getDay();
        const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);
        const weekKey = formatISODateLocal(monday);
        byWeek[weekKey] = (byWeek[weekKey] || 0) + item.created;
      });
      const data = Object.entries(byWeek)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => {
          const weekStart = parseISODateLocal(key);
          const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
          const label = `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()}-${weekEnd.getDate()}`;
          return { label, value };
        });
      return { data, isMonthly: false };
    }
  })();

  const maxChartValue = Math.max(...chartData.data.map(d => d.value), 0);
  const { ticks: yAxisTicks, maxTick } = niceScale(maxChartValue);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

  // Si todo falló no es que no haya datos: no se pudieron pedir. Ese caso se avisa aparte.
  const allFailed =
    !overview && !daily && !status && !results && !topModels && !topBrands &&
    !usageTypes && !commonErrors && !expirations && !lostStickers;

  const hasAnyData =
    (overview?.totals?.created ?? 0) > 0 ||
    (overview?.totals?.completed ?? 0) > 0 ||
    (overview?.totals?.in_queue ?? 0) > 0 ||
    (results?.items?.length ?? 0) > 0 ||
    (status?.items?.length ?? 0) > 0 ||
    (topModels?.items?.length ?? 0) > 0 ||
    (daily?.items?.length ?? 0) > 0 ||
    (lostStickers?.count ?? 0) > 0;

  const topLostReason = lostStickers?.items?.[0] ?? null;

  return (
    <div className="bg-white">
      <div className="max-w-8xl mx-auto px-0 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-6">
        <article className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 text-xs sm:text-sm md:text-base lg:text-lg mb-2 sm:mb-4 md:mb-6 px-1 sm:px-0">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
            <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
            <span className="text-[#0040B8] font-medium">Estadísticas</span>
          </div>

          <div className="w-full sm:w-auto sm:ml-auto">
            <DateRangePicker from={safeOverview.date_from} to={safeOverview.date_to} thisMonth={thisMonth} />
          </div>
        </article>

        {/* Todo el backend falló: no confundir con un rango vacío */}
        {allFailed && (
          <Card className="mb-4 sm:mb-6 md:mb-8 mx-1 sm:mx-0">
            <EmptyState
              title="No se pudieron cargar las estadísticas"
              subtitle="No hubo respuesta del servidor. Reintentá recargando la página."
              icon={WifiOff}
            />
          </Card>
        )}

        {/* Info de rango sin datos */}
        {!allFailed && !hasAnyData && (
          <Card className="mb-4 sm:mb-6 md:mb-8 mx-1 sm:mx-0">
            <EmptyState
              title="No hay datos para este rango"
              subtitle="Proba cambiar el mes o ajustar el filtro de fechas"
              icon={CalendarRange}
            >
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Link
                  href={`?month=${thisMonth}`}
                  className="rounded-[4px] border border-[#0040B8]/30 bg-[#0040B8]/5 px-3 py-1.5 text-[#0040B8] text-xs">
                  Ver este mes
                </Link>
                <Link
                  href={`?month=${prevMonth}`}
                  className="rounded-[4px] border border-gray-300 bg-gray-50 px-3 py-1.5 text-gray-700 text-xs">
                  Ver mes anterior
                </Link>
              </div>
            </EmptyState>
          </Card>
        )}

        {/* KPIs estilo tarjeta con icono */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8 px-1 sm:px-0">
          <Card>
            <div className="relative p-4 sm:p-5">
              <div className="absolute top-3 right-3 h-7 w-7 sm:h-8 sm:w-8 rounded-[14px] bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
                <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 text-[#1f63ff]" />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500">Revisiones creadas</p>
              <p className="mt-2 text-xl sm:text-2xl text-gray-900">
                {overview ? overview.totals.created ?? 0 : <span className="text-gray-400">—</span>}
              </p>
              <div className="mt-1 text-[10px] sm:text-[11px]">
                {overview ? <Delta value={createdDelta} /> : <span className="text-gray-400">Sin datos del servidor</span>}
              </div>
            </div>
          </Card>

          <Card>
            <div className="relative p-4 sm:p-5">
              <div className="absolute top-3 right-3 h-7 w-7 sm:h-8 sm:w-8 rounded-[14px] bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-[#1f63ff]" />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500">Tasa Aprobación</p>
              <p className="mt-2 text-xl sm:text-2xl text-gray-900">
                {approvalRate === null ? <span className="text-gray-400">—</span> : `${approvalRate}%`}
              </p>
              <div className="mt-1 text-[10px] sm:text-[11px]">
                {results ? <Delta value={approvalDelta} /> : <span className="text-gray-400">Sin datos del servidor</span>}
              </div>
            </div>
          </Card>

          <Card>
            <div className="relative p-4 sm:p-5">
              <div className="absolute top-3 right-3 h-7 w-7 sm:h-8 sm:w-8 rounded-[14px] bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-[#1f63ff]" />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500">Tasa de Rechazo</p>
              <p className="mt-2 text-xl sm:text-2xl text-gray-900">
                {rejectionRate === null ? <span className="text-gray-400">—</span> : `${rejectionRate}%`}
              </p>
              <div className="mt-1 text-[10px] sm:text-[11px]">
                {results ? <Delta value={rejectionDelta} inverted /> : <span className="text-gray-400">Sin datos del servidor</span>}
              </div>
            </div>
          </Card>

          <Card>
            <div className="relative p-4 sm:p-5">
              <div className="absolute top-3 right-3 h-7 w-7 sm:h-8 sm:w-8 rounded-[14px] bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
                <LineChart className="h-3 w-3 sm:h-4 sm:w-4 text-[#1f63ff]" />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500">Tasa de Condicional</p>
              <p className="mt-2 text-xl sm:text-2xl text-gray-900">
                {conditionalRate === null ? <span className="text-gray-400">—</span> : `${conditionalRate}%`}
              </p>
              <div className="mt-1 text-[10px] sm:text-[11px]">
                {results ? <Delta value={conditionalDelta} inverted /> : <span className="text-gray-400">Sin datos del servidor</span>}
              </div>
            </div>
          </Card>

          <Card>
            <div className="relative p-4 sm:p-5">
              <div className="absolute top-3 right-3 h-7 w-7 sm:h-8 sm:w-8 rounded-[14px] bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-[#1f63ff]" />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-500">Obleas perdidas</p>
              <p className="mt-2 text-xl sm:text-2xl text-gray-900">
                {lostStickers ? lostStickers.count : <span className="text-gray-400">—</span>}
              </p>
              <div className="mt-1 text-[10px] sm:text-[11px] text-gray-500">
                {!lostStickers
                  ? <span className="text-gray-400">Sin datos del servidor</span>
                  : topLostReason
                    ? `Principal: ${getLostReasonLabel(topLostReason.reason).toLowerCase()} · ${topLostReason.count}`
                    : "Ninguna en el período"}
              </div>
            </div>
          </Card>
        </div>

        {/* Gráficos: Revisiones Semanales/Mensuales y Estado de Revisiones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8 px-1 sm:px-0">
          {/* Revisiones Semanales/Mensuales - Gráfico de barras */}
          <Card>
            <div className="p-3 sm:p-4 md:p-5 border-b border-gray-100">
              <h3 className="text-sm sm:text-base md:text-lg text-gray-900">
                {chartData.isMonthly ? "Revisiones Mensuales" : "Revisiones Semanales"}
              </h3>
            </div>
            <div className="p-3 sm:p-4 md:p-5">
              {!daily ? (
                <ErrorState />
              ) : chartData.data.length > 0 ? (
                <WeeklyChart data={chartData.data} yAxisTicks={yAxisTicks} maxTick={maxTick} />
              ) : (
                <EmptyState
                  title={chartData.isMonthly ? "Sin datos mensuales" : "Sin datos semanales"}
                  subtitle="No hay revisiones para mostrar"
                  icon={BarChart3}
                />
              )}
            </div>
          </Card>

          {/* Estado de Revisiones - Gráfico de donut */}
          <Card>
            <div className="p-3 sm:p-4 md:p-5 border-b border-gray-100">
              <h3 className="text-sm sm:text-base md:text-lg text-gray-900">Estado de Revisiones</h3>
            </div>
            <div className="p-3 sm:p-4 md:p-5">
              {!results ? (
                <ErrorState />
              ) : results.items?.length ? (
                <div className="flex flex-col items-center">
                  {/* Donut chart */}
                  <div className="relative w-40 h-40 sm:w-48 sm:h-48 mb-3 sm:mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {(() => {
                        const total = results.total || 1;
                        let currentAngle = 0;
                        return results.items.map((item, i) => {
                          const percentage = (item.count / total) * 100;
                          const angle = (percentage / 100) * 360;
                          const startAngle = currentAngle;
                          const endAngle = currentAngle + angle;
                          currentAngle = endAngle;
                          
                          const largeArc = angle > 180 ? 1 : 0;
                          const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
                          const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
                          const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180);
                          const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180);
                          
                          const color = getResultColor(item.result);

                          return (
                            <path
                              key={i}
                              d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={color}
                              stroke="white"
                              strokeWidth="2"
                            />
                          );
                        });
                      })()}
                      <circle cx="50" cy="50" r="30" fill="white" />
                    </svg>
                  </div>
                  
                  {/* Legend */}
                  <div className="w-full flex flex-wrap items-center justify-center gap-4">
                    {results.items.map((item, i) => {
                      const color = getResultColor(item.result);
                      const label = getResultLabel(item.result);
                      return (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-gray-700">{label}:</span>
                          <span className="font-medium text-gray-900">{item.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <EmptyState title="Sin estados" subtitle="No hay revisiones con estado registrado" icon={PieChart} />
              )}
            </div>
          </Card>
        </div>

        {/* Obleas perdidas por motivo */}
        <div className="mb-4 sm:mb-6 md:mb-8 px-1 sm:px-0">
          <Card>
            <div className="p-3 sm:p-4 md:p-5 border-b border-gray-100 flex items-center justify-between gap-3">
              <h3 className="text-sm sm:text-base md:text-lg text-gray-900">Obleas perdidas por motivo</h3>
              {lostStickers ? (
                <span className="text-xs sm:text-sm text-gray-500">
                  {lostStickers.count} {lostStickers.count === 1 ? "oblea" : "obleas"} en el período
                </span>
              ) : null}
            </div>
            <div className="p-3 sm:p-4 md:p-5">
              {!lostStickers ? (
                <ErrorState />
              ) : lostStickers.items?.length ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-3 sm:gap-y-4">
                    {lostStickers.items.map((item, i) => {
                      const maxCount = Math.max(...lostStickers.items.map(r => r.count), 1);
                      const width = (item.count / maxCount) * 100;
                      const color = getLostReasonColor(item.reason);
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between text-sm mb-1 gap-3">
                            <span className="text-gray-700 truncate">{getLostReasonLabel(item.reason)}</span>
                            <span className="flex-shrink-0 text-gray-900">
                              <span className="font-medium">{item.count}</span>
                              <span className="text-gray-500 ml-1.5 text-xs">{item.percentage}%</span>
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500">
                    Se cuenta la fecha en que la oblea se dio de baja, no la fecha de la revisión.
                    Las bajas anteriores a la puesta en marcha del historial no tienen motivo registrado.
                  </p>
                </>
              ) : (
                <EmptyState
                  title="Sin obleas perdidas"
                  subtitle="No se dio de baja ninguna oblea en el período"
                  icon={Ticket}
                  className="py-4"
                />
              )}
            </div>
          </Card>
        </div>

        {/* Secciones inferiores: Marcas, Tipos de Uso, Errores, Vencimientos */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 px-1 sm:px-0">
          {/* Marcas Más Inspeccionadas */}
          <Card>
            <div className="p-3 sm:p-4 md:p-5 border-b border-gray-100">
              <h3 className="text-sm sm:text-base md:text-lg text-gray-900">Marcas Más Inspeccionadas</h3>
            </div>
            <div className="p-3 sm:p-4 md:p-5">
              {!topBrands ? (
                <ErrorState className="py-4" />
              ) : topBrands.items?.length ? (
                <div className="space-y-3">
                  {topBrands.items.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-[4px] bg-blue-50 flex items-center justify-center text-sm text-[#0040B8]">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.brand}</p>
                    </div>
                      <div className="flex-shrink-0">
                        <span className="text-sm text-gray-600">{item.count}</span>
                    </div>
                    </div>
                  ))}
                  </div>
              ) : (
                <EmptyState title="Sin marcas" subtitle="No hay datos de marcas" icon={BarChart3} className="py-4" />
              )}
            </div>
          </Card>

          {/* Tipos de Uso */}
          <Card>
            <div className="p-3 sm:p-4 md:p-5 border-b border-gray-100">
              <h3 className="text-sm sm:text-base md:text-lg text-gray-900">Tipos de Uso</h3>
            </div>
            <div className="p-3 sm:p-4 md:p-5">
              {!usageTypes ? (
                <ErrorState className="py-4" />
              ) : usageTypes.items?.length ? (
                <div className="space-y-3">
                  {usageTypes.items.map((item, i) => {
                    const maxCount = Math.max(...usageTypes.items.map(u => u.count), 1);
                    const width = (item.count / maxCount) * 100;
                  return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700">{getUsageTypeLabel(item.use_type)}</span>
                          <span className="font-medium text-gray-900">{item.count}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full bg-[#0040B8] rounded-full" style={{ width: `${width}%` }} />
                        </div>
                    </div>
                  );
                  })}
                </div>
              ) : (
                <EmptyState title="Sin tipos de uso" subtitle="No hay datos de tipos de uso" icon={BarChart3} className="py-4" />
              )}
            </div>
          </Card>

          {/* Errores Más Comunes */}
          <Card>
            <div className="p-3 sm:p-4 md:p-5 border-b border-gray-100">
              <h3 className="text-sm sm:text-base md:text-lg text-gray-900">Errores Más Comunes</h3>
            </div>
            <div className="p-3 sm:p-4 md:p-5">
              {!commonErrors ? (
                <ErrorState className="py-4" />
              ) : commonErrors.items?.length ? (
                <div className="space-y-3">
                  {commonErrors.items.map((item, i) => {
                    const percentageColor = i === 0 ? "text-red-600" : "text-orange-600";
                  return (
                      <div key={i} className="rounded-lg bg-gray-100 px-4 py-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.step_name}</p>
                            <p className="text-xs text-gray-600 mt-1">{item.count} casos</p>
                          </div>
                          <div className="flex-shrink-0 ml-4">
                            <span className={`text-sm ${percentageColor}`}>{item.percentage}%</span>
                          </div>
                      </div>
                      </div>
                    );
                  })}
                  <p className="pt-1 text-[11px] text-gray-500">
                    Porcentaje sobre las {commonErrors.total} revisiones con algún paso observado.
                  </p>
                    </div>
              ) : (
                <EmptyState title="Sin errores" subtitle="No hay errores registrados" icon={AlertCircle} className="py-4" />
              )}
            </div>
          </Card>

          {/* Últimos Vencimientos */}
          <Card>
            <div className="p-3 sm:p-4 md:p-5 border-b border-gray-100">
              <h3 className="text-sm sm:text-base md:text-lg text-gray-900">Próximos Vencimientos</h3>
            </div>
            <div className="p-3 sm:p-4 md:p-5">
              {!expirations ? (
                <ErrorState className="py-4" />
              ) : expirations.items?.length ? (
                <div className="max-h-[280px] overflow-y-auto pr-2 space-y-3">
                  {expirations.items.map((item, i) => {
                    const isUrgent = item.days_until <= 30;
                    return (
                      <div key={i} className={clsx(
                        "rounded-lg p-3 border",
                        isUrgent ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-200"
                      )}>
                        <div className="flex items-start gap-2">
                          <AlertCircle className={clsx("w-5 h-5 flex-shrink-0 mt-0.5", isUrgent ? "text-rose-600" : "text-amber-600")} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{item.license_plate}</p>
                            <p className="text-xs text-gray-600 mt-1">{item.contact}</p>
                            <p className="text-xs font-medium text-gray-700 mt-1">
                              {item.days_until === 0
                                ? "Vence hoy"
                                : `Vence en ${item.days_until} ${item.days_until === 1 ? "día" : "días"}`}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="Sin vencimientos" subtitle="No hay revisiones próximas a vencer" icon={AlertCircle} className="py-4" />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
