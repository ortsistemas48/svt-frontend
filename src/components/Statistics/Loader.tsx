import Statistics, { type TopModels, type Overview, type Daily, type StatusBreakdown, type ResultBreakdown } from ".";
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
} from "@/utils";

interface StatisticsLoaderProps {
  workshopId: number;
  from: string;
  to: string;
  prevFrom: string;
  prevTo: string;
}

export default async function StatisticsLoader({
  workshopId,
  from,
  to,
  prevFrom,
  prevTo,
}: StatisticsLoaderProps) {
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
  ] = await Promise.all([
    fetchStatisticsOverview(workshopId, from, to) as Promise<Overview>,
    fetchStatisticsOverview(workshopId, prevFrom, prevTo) as Promise<Overview>,
    fetchStatisticsDaily(workshopId, from, to) as Promise<Daily>,
    fetchStatusBreakdown(workshopId, from, to) as Promise<StatusBreakdown>,
    fetchResultsBreakdown(workshopId, from, to) as Promise<ResultBreakdown>,
    fetchResultsBreakdown(workshopId, prevFrom, prevTo) as Promise<ResultBreakdown>,
    fetchTopModels(workshopId, from, to, 8) as Promise<any>,
    fetchTopBrands(workshopId, from, to, 5) as Promise<any>,
    fetchUsageTypes(workshopId, from, to) as Promise<any>,
    fetchCommonErrors(workshopId, from, to, 3) as Promise<any>,
    fetchUpcomingExpirations(workshopId, 20) as Promise<any>,
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
      overviewPrev={overviewPrev as any}
      daily={daily as any}
      status={status as any}
      results={results as any}
      resultsPrev={resultsPrev as any}
      topModels={topModels}
      topBrands={topBrands as any}
      usageTypes={usageTypes as any}
      commonErrors={commonErrors as any}
      expirations={expirations as any}
    />
  );
}
