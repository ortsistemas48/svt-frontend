// app/dashboard/[id]/statistics/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Statistics, {
  type TopModels,
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
  const m = date.getMonth();
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 0);
  return { from: fmt(from), to: fmt(to) };
}

function makeRange(searchParams: any) {
  const entries = Object.entries(searchParams ?? {}).map(([k, v]) => [k, String(v)]);
  const sp = new URLSearchParams(entries as [string, string][]);

  const fromQP = sp.get("from");
  const toQP = sp.get("to");
  if (fromQP && toQP) return { from: fromQP, to: toQP };

  const monthQP = sp.get("month");
  if (monthQP) {
    const [yy, mm] = monthQP.split("-").map(Number);
    if (yy && mm && mm >= 1 && mm <= 12) {
      const from = fmt(new Date(yy, mm - 1, 1));
      const to = fmt(new Date(yy, mm, 0));
      return { from, to };
    }
  }
  return monthRange();
}

export default async function Page(props: any) {
  const { id } = (await props.params) ?? props.params ?? {};
  const sp = (await props.searchParams) ?? props.searchParams ?? {};

  const workshopId = Number(id);
  if (!Number.isFinite(workshopId)) {
    return <div className="p-6 text-sm text-rose-600">Parámetro de taller inválido</div>;
  }

  const { from, to } = makeRange(sp);

  const [overview, daily, status, results, topModelsRaw] = await Promise.all([
    fetchStatisticsOverview(workshopId, from, to) as Promise<Overview>,
    fetchStatisticsDaily(workshopId, from, to) as Promise<Daily>,
    fetchStatusBreakdown(workshopId, from, to) as Promise<StatusBreakdown>,
    fetchResultsBreakdown(workshopId, from, to) as Promise<ResultBreakdown>,
    fetchTopModels(workshopId, from, to, 8) as Promise<any>,
  ]);

  const topModels: TopModels = {
    total_models: (topModelsRaw as any).total_models ?? 0,
    items: ((topModelsRaw as any).items ?? []).map((i: any) => ({
      model: i?.model ?? "N/D",
      brand: i?.brand ?? null,
      count: i?.count ?? 0,
    })),
  };

  return (
    <Statistics
      workshopId={workshopId}
      from={from}
      to={to}
      overview={overview as any}
      daily={daily as any}
      status={status as any}
      results={results as any}
      topModels={topModels}
    />
  );
}
