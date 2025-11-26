"use client";

import Link from "next/link";
import clsx from "clsx";
import { useState, useRef, useEffect } from "react";
import { BarChart3, PieChart, CalendarRange, ArrowUpRight, ArrowDownRight, LineChart, Users, ClipboardList, CheckCircle2, ChevronRight, FolderX, AlertCircle, Calendar } from "lucide-react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import Card from "@/components/Card";

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
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });
  const [selectingTo, setSelectingTo] = useState(true); // true = seleccionando "to", false = seleccionando "from"
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
      const fromStr = range.from.toISOString().split("T")[0];
      const toStr = range.to.toISOString().split("T")[0];
      window.location.href = `?from=${fromStr}&to=${toStr}`;
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
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm hover:border-gray-300 transition-colors text-sm"
      >
        <Calendar className="w-4 h-4 text-gray-600" />
        <span className="text-gray-700 font-medium">
          {range?.from && range?.to ? `${formatDate(range.from)} - ${formatDate(range.to)}` : "Seleccionar fechas"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
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
            numberOfMonths={2}
            className="rounded-lg"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
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
          <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-200">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleThisMonth}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Este mes
              </button>
              {(range?.from || range?.to) && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Limpiar
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!range?.from || !range?.to}
                className="rounded-lg border border-[#0040B8] bg-[#0040B8] px-4 py-2 text-white font-medium hover:bg-[#0030a0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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

function WeeklyChart({ data, yAxisTicks, maxTick }: { data: Array<{ label: string; value: number }>; yAxisTicks: number[]; maxTick: number }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Invertir el orden de los ticks para que el 0 esté abajo
  const reversedTicks = [...yAxisTicks].reverse();

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-10 flex flex-col justify-between text-xs text-gray-500 pr-2" style={{ width: "35px" }}>
        {reversedTicks.map((tick, idx) => (
          <span key={`y-axis-${tick}-${idx}`} className="text-right">{tick}</span>
        ))}
      </div>
      
      {/* Chart area */}
      <div className="ml-10 relative" style={{ height: "240px" }}>
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
                        {week.value} inspecciones
                        <div className="absolute left-1/2 top-full -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-600 font-medium">{week.label}</span>
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
}: {
  workshopId: number;
  from: string;
  to: string;
  overview: Overview;
  overviewPrev?: Overview | null;
  daily: Daily;
  status: StatusBreakdown;
  results: ResultBreakdown;
  resultsPrev?: ResultBreakdown | null;
  topModels: TopModels;
  topBrands?: TopBrands;
  usageTypes?: UsageTypes;
  commonErrors?: CommonErrors;
  expirations?: Expirations;
}) {
  // Defensivos por si vienen nulos o incompletos
  const safeOverview = overview ?? ({
    date_from: from,
    date_to: to,
    workshop_id: workshopId,
    totals: { created: 0, completed: 0, in_queue: 0, approved: 0, approval_rate: 0 },
  } as Overview);

  // Deltas vs mes anterior
  const prevOverviewData = overviewPrev ?? null;
  const createdDelta = (() => {
    const prevVal = prevOverviewData?.totals?.created ?? 0;
    const curVal = safeOverview.totals.created ?? 0;
    if (prevVal <= 0) return 0;
    return ((curVal - prevVal) / prevVal) * 100;
  })();

  // Calcular tasas de aprobación, rechazo y condicional basadas en results
  const approvalRate = (() => {
    if (!results?.items?.length || !results.total || results.total === 0) return 0;
    // Buscar todas las variantes posibles de aprobado
    const approved = results.items.find(item => {
      const result = (item.result || "").toLowerCase().trim();
      return result === "apto" || result === "aprobadas" || result === "aprobado";
    });
    if (!approved) return 0;
    return Math.round((approved.count / results.total) * 100);
  })();

  const rejectionRate = (() => {
    if (!results?.items?.length || !results.total || results.total === 0) return 0;
    // Buscar todas las variantes posibles de rechazado
    const rejected = results.items.find(item => {
      const result = (item.result || "").toLowerCase().trim();
      return result === "rechazado" || result === "rechazadas";
    });
    if (!rejected) return 0;
    return Math.round((rejected.count / results.total) * 100);
  })();

  const conditionalRate = (() => {
    if (!results?.items?.length || !results.total || results.total === 0) return 0;
    const conditional = results.items.find(item => item.result === "Condicional");
    if (!conditional) return 0;
    return Math.round((conditional.count / results.total) * 100);
  })();

  // Calcular tasas previas de aprobación, rechazo y condicional
  const prevApprovalRate = (() => {
    if (!resultsPrev?.items?.length || !resultsPrev.total || resultsPrev.total === 0) return null;
    // Buscar todas las variantes posibles de aprobado
    const approved = resultsPrev.items.find(item => {
      const result = (item.result || "").toLowerCase().trim();
      return result === "apto" || result === "aprobadas" || result === "aprobado";
    });
    if (!approved) return 0;
    return Math.round((approved.count / resultsPrev.total) * 100);
  })();

  const prevRejectionRate = (() => {
    if (!resultsPrev?.items?.length || !resultsPrev.total || resultsPrev.total === 0) return null;
    // Buscar todas las variantes posibles de rechazado
    const rejected = resultsPrev.items.find(item => {
      const result = (item.result || "").toLowerCase().trim();
      return result === "rechazado" || result === "rechazadas";
    });
    if (!rejected) return 0;
    return Math.round((rejected.count / resultsPrev.total) * 100);
  })();

  const prevConditionalRate = (() => {
    if (!resultsPrev?.items?.length || !resultsPrev.total || resultsPrev.total === 0) return null;
    const conditional = resultsPrev.items.find(item => item.result === "Condicional");
    if (!conditional) return 0;
    return Math.round((conditional.count / resultsPrev.total) * 100);
  })();

  // Calcular deltas para todas las tasas
  const approvalDelta = (() => {
    if (prevApprovalRate === null) return 0;
    return approvalRate - prevApprovalRate;
  })();

  const rejectionDelta = (() => {
    if (prevRejectionRate === null) return 0;
    return rejectionRate - prevRejectionRate;
  })();

  const conditionalDelta = (() => {
    if (prevConditionalRate === null) return 0;
    return conditionalRate - prevConditionalRate;
  })();

  function Delta({ value, suffix = "%" }: { value: number; suffix?: string }) {
    const v = Math.round(value * 10) / 10;
    const positive = v > 0;
    const negative = v < 0;
    const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : ArrowUpRight;
    const color = positive ? "text-emerald-600" : negative ? "text-rose-600" : "text-gray-500";
    const sign = positive ? "+" : negative ? "" : "";
    return (
      <span className={`inline-flex items-center gap-1 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        {sign}{Math.abs(v)}{suffix}
        <span className="text-gray-500 ml-1">vs mes anterior</span>
      </span>
    );
  }

  function DeltaInverted({ value, suffix = "%" }: { value: number; suffix?: string }) {
    const v = Math.round(value * 10) / 10;
    const positive = v > 0;
    const negative = v < 0;
    const Icon = positive ? ArrowUpRight : negative ? ArrowDownRight : ArrowUpRight;
    // Invertido: positivo (aumento) es malo (rojo), negativo (disminución) es bueno (verde)
    const color = positive ? "text-rose-600" : negative ? "text-emerald-600" : "text-gray-500";
    const sign = positive ? "+" : negative ? "" : "";
    return (
      <span className={`inline-flex items-center gap-1 ${color}`}>
        <Icon className="h-3.5 w-3.5" />
        {sign}{Math.abs(v)}{suffix}
        <span className="text-gray-500 ml-1">vs mes anterior</span>
      </span>
    );
  }

  // Calcular si hay más de 6 semanas en el rango
  const dateFrom = new Date(from);
  const dateTo = new Date(to);
  const daysDiff = Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24));
  const weeksDiff = Math.ceil(daysDiff / 7);
  const useMonthly = weeksDiff > 6;

  // Agrupar datos diarios por semana o mes según el rango
  const chartData = (() => {
    if (!daily?.items?.length) return { data: [], isMonthly: false };
    
    if (useMonthly) {
      // Agrupar por mes
      const byMonth: Record<string, number> = {};
      daily.items.forEach(item => {
        const date = new Date(item.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        byMonth[monthKey] = (byMonth[monthKey] || 0) + item.created;
      });
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const data = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6) // Últimos 6 meses
        .map(([key, value]) => {
          const [year, month] = key.split("-");
          return { label: monthNames[parseInt(month) - 1], value };
        });
      return { data, isMonthly: true };
    } else {
      // Agrupar por semana
      const byWeek: Record<string, number> = {};
      daily.items.forEach(item => {
        const date = new Date(item.date);
        // Obtener el lunes de la semana
        const dayOfWeek = date.getDay();
        const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(date.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        const weekKey = monday.toISOString().slice(0, 10);
        byWeek[weekKey] = (byWeek[weekKey] || 0) + item.created;
      });
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      const data = Object.entries(byWeek)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6) // Últimas 6 semanas
        .map(([key, value]) => {
          const date = new Date(key);
          const weekStart = new Date(date);
          const weekEnd = new Date(date);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const label = `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()}-${weekEnd.getDate()}`;
          return { label, value };
        });
      return { data, isMonthly: false };
    }
  })();

  const maxChartValue = Math.max(...chartData.data.map(d => d.value), 0);
  // Calcular ticks del eje Y similar a la foto (0, 55, 110, 165, 220)
  // Redondear al múltiplo de 55 más cercano
  const maxTick = maxChartValue > 0 ? Math.ceil(maxChartValue / 55) * 55 : 220;
  // Asegurar valores únicos y ordenados
  const yAxisTicks = Array.from(new Set([0, 55, 110, 165, maxTick].filter(v => v <= maxTick))).sort((a, b) => a - b);

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

  const hasAnyData =
    (safeOverview?.totals?.created ?? 0) > 0 ||
    (safeOverview?.totals?.completed ?? 0) > 0 ||
    (safeOverview?.totals?.in_queue ?? 0) > 0 ||
    (results?.items?.length ?? 0) > 0 ||
    (status?.items?.length ?? 0) > 0 ||
    (topModels?.items?.length ?? 0) > 0 ||
    (daily?.items?.length ?? 0) > 0;

  return (
    <div className="bg-white">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <article className="flex items-center justify-between text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
            <ChevronRight size={16} className="sm:w-5 sm:h-5" />
            <span className="text-[#0040B8] font-medium">Estadísticas</span>
          </div>

          <div className="ml-auto">
            <DateRangePicker from={safeOverview.date_from} to={safeOverview.date_to} thisMonth={thisMonth} />
          </div>
        </article>

        {/* Info de rango sin datos */}
        {!hasAnyData && (
          <Card className="mb-6 sm:mb-8">
            <EmptyState
              title="No hay datos para este rango"
              subtitle="Proba cambiar el mes o ajustar el filtro de fechas"
              icon={CalendarRange}
            >
              <div className="flex items-center gap-2">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <div className="relative p-5">
              <div className="absolute top-3 right-3 h-8 w-8 rounded-[14px] bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
                <ClipboardList className="h-4 w-4 text-[#1f63ff]" />
              </div>
              <p className="text-xs text-gray-500">Revisiones creadas</p>
              <p className="mt-2 text-2xl text-gray-900">{safeOverview.totals.created ?? 0}</p>
              <div className="mt-1 text-[11px]">
                <Delta value={createdDelta} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="relative p-5">
              <div className="absolute top-3 right-3 h-8 w-8 rounded-[14px] bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-[#1f63ff]" />
              </div>
              <p className="text-xs text-gray-500">Tasa Aprobación</p>
              <p className="mt-2 text-2xl text-gray-900">{approvalRate}%</p>
              <div className="mt-1 text-[11px]">
                <Delta value={approvalDelta} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="relative p-5">
              <div className="absolute top-3 right-3 h-8 w-8 rounded-[14px] bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-[#1f63ff]" />
              </div>
              <p className="text-xs text-gray-500">Tasa de Rechazo</p>
              <p className="mt-2 text-2xl text-gray-900">{rejectionRate}%</p>
              <div className="mt-1 text-[11px]">
                <DeltaInverted value={rejectionDelta} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="relative p-5">
              <div className="absolute top-3 right-3 h-8 w-8 rounded-[14px] bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
                <LineChart className="h-4 w-4 text-[#1f63ff]" />
              </div>
              <p className="text-xs text-gray-500">Tasa de Condicional</p>
              <p className="mt-2 text-2xl text-gray-900">{conditionalRate}%</p>
              <div className="mt-1 text-[11px]">
                <DeltaInverted value={conditionalDelta} />
              </div>
            </div>
          </Card>
        </div>

        {/* Gráficos: Revisiones Semanales/Mensuales y Estado de Revisiones */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Revisiones Semanales/Mensuales - Gráfico de barras */}
          <Card>
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-base sm:text-lg text-gray-900">
                {chartData.isMonthly ? "Revisiones Mensuales" : "Revisiones Semanales"}
              </h3>
            </div>
            <div className="p-5">
              {chartData.data.length > 0 ? (
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
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-base sm:text-lg text-gray-900">Estado de Revisiones</h3>
            </div>
            <div className="p-5">
              {results?.items?.length ? (
                <div className="flex flex-col items-center">
                  {/* Donut chart */}
                  <div className="relative w-48 h-48 mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {(() => {
                        const total = results.total || 1;
                        let currentAngle = 0;
                        const colors: Record<string, string> = {
                          "Apto": "#0040B8", // emerald-500
                          "Aprobadas": "#0040B8",
                          "Rechazado": "#212121", // red-500
                          "Rechazadas": "#212121",
                          "Condicional": "#f97316", // orange-500
                          "Pendientes": "#f97316",
                        };
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
                          
                          const color = colors[item.result || ""] || "#6b7280";
                          
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
                      const colors: Record<string, string> = {
                        "Apto": "#0040B8",
                        "Aprobadas": "#0040B8",
                        "Rechazado": "#212121",
                        "Rechazadas": "#212121",
                        "Condicional": "#f97316",
                        "Pendientes": "#f97316",
                      };
                      const color = colors[item.result || ""] || "#6b7280";
                      const label = item.result === "Apto" ? "Aprobadas" : item.result === "Rechazado" ? "Rechazadas" : item.result || "Pendientes";
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

        {/* Secciones inferiores: Marcas, Tipos de Uso, Errores, Vencimientos */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-4 sm:gap-6">
          {/* Marcas Más Inspeccionadas */}
          <Card>
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-base sm:text-lg text-gray-900">Marcas Más Inspeccionadas</h3>
            </div>
            <div className="p-5">
              {topBrands?.items?.length ? (
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
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-base sm:text-lg text-gray-900">Tipos de Uso</h3>
            </div>
            <div className="p-5">
              {usageTypes?.items?.length ? (
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
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-base sm:text-lg text-gray-900">Errores Más Comunes</h3>
            </div>
            <div className="p-5">
              {commonErrors?.items?.length ? (
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
                    </div>
              ) : (
                <EmptyState title="Sin errores" subtitle="No hay errores registrados" icon={AlertCircle} className="py-4" />
              )}
            </div>
          </Card>

          {/* Últimos Vencimientos */}
          <Card>
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-base sm:text-lg text-gray-900">Próximos Vencimientos</h3>
            </div>
            <div className="p-5">
              {expirations?.items?.length ? (
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
                              Vence en {item.days_until} {item.days_until === 1 ? "día" : "días"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="Sin vencimientos" subtitle="No hay inspecciones próximas a vencer" icon={AlertCircle} className="py-4" />
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
