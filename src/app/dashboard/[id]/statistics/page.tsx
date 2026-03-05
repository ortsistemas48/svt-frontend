// app/dashboard/[id]/statistics/page.tsx
// Note: reading searchParams makes this page dynamic by default in Next.js — no need for force-dynamic

import { Suspense } from "react";
import StatisticsLoader from "@/components/Statistics/Loader";
import StatisticsSkeleton from "@/components/Statistics/Skeleton";

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

function monthRange(date = new Date()) {
  const y = date.getFullYear();
  const m = date.getMonth();
  return { from: fmt(new Date(y, m, 1)), to: fmt(new Date(y, m + 1, 0)) };
}

function prevMonthRangeFrom(fromISO: string) {
  const d = new Date(fromISO + "T00:00:00");
  let prevYear = d.getFullYear();
  let prevMonth = d.getMonth() - 1;
  if (prevMonth < 0) { prevMonth = 11; prevYear--; }
  return { from: fmt(new Date(prevYear, prevMonth, 1)), to: fmt(new Date(prevYear, prevMonth + 1, 0)) };
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
      return { from: fmt(new Date(yy, mm - 1, 1)), to: fmt(new Date(yy, mm, 0)) };
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
  const prevRange = prevMonthRangeFrom(from);

  // StatisticsLoader is an async Server Component that fetches all data in parallel.
  // The Suspense boundary streams the skeleton to the browser immediately while it resolves.
  return (
    <Suspense fallback={<StatisticsSkeleton />}>
      <StatisticsLoader
        workshopId={workshopId}
        from={from}
        to={to}
        prevFrom={prevRange.from}
        prevTo={prevRange.to}
      />
    </Suspense>
  );
}
