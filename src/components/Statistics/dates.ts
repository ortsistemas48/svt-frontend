/**
 * Helpers de fecha para estadísticas.
 *
 * `new Date("2026-09-01")` se interpreta como medianoche UTC, y leerla con getMonth() o
 * getDay() en Argentina (UTC−3) devuelve el 31 de agosto. Eso hacía que el día 1 de cada
 * mes se imputara al mes anterior en el gráfico y que el selector de fechas mostrara un
 * día menos. Estas funciones trabajan siempre en hora local.
 */

/** "YYYY-MM-DD" -> Date a medianoche local (no UTC). */
export function parseISODateLocal(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Date -> "YYYY-MM-DD" usando los componentes locales (no toISOString). */
export function formatISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Cantidad de días que abarca el rango, inclusive en ambos extremos. */
export function daysInRange(from: string, to: string): number {
  const a = parseISODateLocal(from);
  const b = parseISODateLocal(to);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
}

/** true si [from, to] es exactamente un mes calendario completo. */
export function isFullCalendarMonth(from: string, to: string): boolean {
  const a = parseISODateLocal(from);
  const b = parseISODateLocal(to);
  const lastDay = new Date(a.getFullYear(), a.getMonth() + 1, 0).getDate();
  return (
    a.getDate() === 1 &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    b.getDate() === lastDay
  );
}

export type ComparisonRange = {
  from: string;
  to: string;
  /** Etiqueta a mostrar junto a los deltas. */
  label: string;
};

/**
 * Período de comparación.
 *
 * Antes siempre se devolvía el mes calendario anterior completo, aun cuando el usuario
 * elegía un rango de 5 días: el delta comparaba 5 días contra 30. Ahora, si el rango es
 * un mes completo se compara contra el mes anterior; si no, contra una ventana del mismo
 * largo inmediatamente anterior.
 */
export function comparisonRange(from: string, to: string): ComparisonRange {
  if (isFullCalendarMonth(from, to)) {
    const a = parseISODateLocal(from);
    const prevStart = new Date(a.getFullYear(), a.getMonth() - 1, 1);
    const prevEnd = new Date(a.getFullYear(), a.getMonth(), 0);
    return {
      from: formatISODateLocal(prevStart),
      to: formatISODateLocal(prevEnd),
      label: "vs mes anterior",
    };
  }

  const days = daysInRange(from, to);
  const start = parseISODateLocal(from);
  const prevEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 1);
  const prevStart = new Date(
    prevEnd.getFullYear(),
    prevEnd.getMonth(),
    prevEnd.getDate() - (days - 1)
  );
  return {
    from: formatISODateLocal(prevStart),
    to: formatISODateLocal(prevEnd),
    label: "vs período anterior",
  };
}
