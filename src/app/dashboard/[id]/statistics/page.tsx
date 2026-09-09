// app/dashboard/[id]/statistics/page.tsx
// Note: reading searchParams makes this page dynamic by default in Next.js — no need for force-dynamic

import { Suspense } from "react";
import StatisticsLoader from "@/components/Statistics/Loader";
import StatisticsSkeleton from "@/components/Statistics/Skeleton";
import { comparisonRange, formatISODateLocal } from "@/components/Statistics/dates";

function monthRange(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth();
  return {
    from: formatISODateLocal(new Date(y, m, 1)),
    to: formatISODateLocal(new Date(y, m + 1, 0)),
  };
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
      return {
        from: formatISODateLocal(new Date(yy, mm - 1, 1)),
        to: formatISODateLocal(new Date(yy, mm, 0)),
      };
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
  // Ventana de comparación del mismo largo que la seleccionada, salvo que el rango sea un
  // mes calendario completo, en cuyo caso se compara contra el mes anterior.
  const prev = comparisonRange(from, to);

  // StatisticsLoader is an async Server Component that fetches all data in parallel.
  // The Suspense boundary streams the skeleton to the browser immediately while it resolves.
  return (
    <Suspense fallback={<StatisticsSkeleton />}>
      <StatisticsLoader
        workshopId={workshopId}
        from={from}
        to={to}
        prevFrom={prev.from}
        prevTo={prev.to}
        comparisonLabel={prev.label}
      />
    </Suspense>
  );
}
