import Statistics, { type TopModels } from ".";
import {
  fetchStatisticsOverview,
  fetchStatisticsDaily,
  fetchStatusBreakdown,
  fetchResultsBreakdown,
  fetchTopModels,
  fetchTopBrands,
  fetchUsageTypes,
  fetchCommonErrors,
  fetchUpcomingExpirations,
  fetchLostStickers,
} from "@/utils";

interface StatisticsLoaderProps {
  workshopId: number;
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
  comparisonLabel: string;
}

export default async function StatisticsLoader({
  workshopId,
  from,
  to,
  prevFrom,
  prevTo,
  comparisonLabel,
}: StatisticsLoaderProps) {
  // Cada fetcher devuelve null si falla; ese null llega hasta la tarjeta correspondiente,
  // que muestra un error en vez de un cero indistinguible de "no hubo actividad".
  const [
    overview,
    overviewPrev,
    daily,
    status,
    results,
    resultsPrev,
    topModelsRaw,
    topBrands,
    usageTypes,
    commonErrors,
    expirations,
    lostStickers,
  ] = await Promise.all([
    fetchStatisticsOverview(workshopId, from, to),
    fetchStatisticsOverview(workshopId, prevFrom, prevTo),
    fetchStatisticsDaily(workshopId, from, to),
    fetchStatusBreakdown(workshopId, from, to),
    fetchResultsBreakdown(workshopId, from, to),
    fetchResultsBreakdown(workshopId, prevFrom, prevTo),
    fetchTopModels(workshopId, from, to, 8),
    fetchTopBrands(workshopId, from, to, 5),
    fetchUsageTypes(workshopId, from, to),
    fetchCommonErrors(workshopId, from, to, 3),
    fetchUpcomingExpirations(workshopId, 20),
    fetchLostStickers(workshopId, from, to),
  ]);

  const topModels: TopModels | null = topModelsRaw
    ? {
        total_models: topModelsRaw.total_models ?? 0,
        items: (topModelsRaw.items ?? []).map((i) => ({
          model: i?.model ?? "N/D",
          brand: i?.brand ?? null,
          count: i?.count ?? 0,
        })),
      }
    : null;

  return (
    <Statistics
      workshopId={workshopId}
      from={from}
      to={to}
      comparisonLabel={comparisonLabel}
      overview={overview}
      overviewPrev={overviewPrev}
      daily={daily}
      status={status}
      results={results}
      resultsPrev={resultsPrev}
      topModels={topModels}
      topBrands={topBrands}
      usageTypes={usageTypes}
      commonErrors={commonErrors}
      expirations={expirations}
      lostStickers={lostStickers}
    />
  );
}
