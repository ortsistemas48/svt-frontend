// app/dashboard/[id]/statistics/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Statistics, {
  type TopModels, // <- usá el tipo del componente
  type Overview,
  type Daily,
  type StatusBreakdown,
  type ResultBreakdown,
} from "@/components/Statistics";
import {
  fetchStatisticsOverview,
  fetchStatisticsDaily,
  fetchStatusBreakdown,
  fetchResultsBreakdown,
  fetchTopModels,
} from "@/utils";

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

function monthRange(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth(); // 0..11
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 0); // último día del mes
  return { from: fmt(from), to: fmt(to) };
}

/**
 * Prioridades:
 * 1) Si vienen from y to en la URL, usalos tal cual.
 * 2) Si viene month=YYYY-MM, arma el rango de ese mes.
 * 3) Si no viene nada, usa el mes actual.
 */
function makeRange(searchParams: { [k: string]: string | string[] | undefined }) {
  const sp = new URLSearchParams(Object.entries(searchParams).map(([k, v]) => [k, String(v)]));

  const fromQP = sp.get("from");
  const toQP = sp.get("to");
  if (fromQP && toQP) return { from: fromQP, to: toQP };

  const monthQP = sp.get("month"); // ej: 2025-10
  if (monthQP) {
    const [yy, mm] = monthQP.split("-").map(Number);
    if (yy && mm && mm >= 1 && mm <= 12) {
      const from = fmt(new Date(yy, mm - 1, 1));
      const to = fmt(new Date(yy, mm, 0));
      return { from, to };
    }
  }

  // default: mes actual
  return monthRange();
}

export default async function Page({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const workshopId = Number(params.id);
  if (!Number.isFinite(workshopId)) {
    return <div className="p-6 text-sm text-rose-600">Parámetro de taller inválido</div>;
  }

  const { from, to } = makeRange(searchParams);

  const [overview, daily, status, results, topModelsRaw] = await Promise.all([
    fetchStatisticsOverview(workshopId, from, to) as Promise<Overview>,
    fetchStatisticsDaily(workshopId, from, to) as Promise<Daily>,
    fetchStatusBreakdown(workshopId, from, to) as Promise<StatusBreakdown>,
    fetchResultsBreakdown(workshopId, from, to) as Promise<ResultBreakdown>,
    fetchTopModels(workshopId, from, to, 8), 
  ]);

  const topModels: TopModels = {
    total_models: topModelsRaw.total_models,
    items: topModelsRaw.items.map(i => ({
      model: i.model ?? "N/D",
      brand: i.brand ?? null,
      count: i.count,
    })),
  };

  return (
    <Statistics
      workshopId={workshopId}
      from={from}
      to={to}
      overview={overview}
      daily={daily}
      status={status}
      results={results}
      topModels={topModels}
    />
  );
}
