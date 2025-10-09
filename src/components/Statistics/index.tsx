import Link from "next/link";
import clsx from "clsx";
import { BarChart3, PieChart, CalendarRange, ArrowUpRight, ChevronRight } from "lucide-react";
import Card from "@/components/Card";

export type Overview = {
  date_from: string;
  date_to: string;
  workshop_id: number;
  totals: { created: number; completed: number; in_queue: number; approved: number; approval_rate: number };
};

export type DailyItem = { date: string; created: number; completed: number; approved: number };
export type Daily = { items: DailyItem[]; total_days: number };
export type StatusBreakdown = { items: { status: string; count: number }[]; total: number };
export type ResultBreakdown = { items: { result: string; count: number }[]; total: number };
export type TopModels = { items: { model: string; count: number; brand?: string | null }[]; total_models: number };


function ProgressBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full bg-emerald-500" style={{ width: `${v}%` }} />
    </div>
  );
}

function TinyBars({ data, max }: { data: number[]; max: number }) {
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

export default function Statistics({
  workshopId,
  from,
  to,
  overview,
  daily,
  status,
  results,
  topModels,
}: {
  workshopId: number;
  from: string;
  to: string;
  overview: Overview;
  daily: Daily;
  status: StatusBreakdown;
  results: ResultBreakdown;
  topModels: TopModels;
}) {
  const approvalPct = Math.round(overview.totals.approval_rate || 0);
  const createdSerie = daily.items.map(d => d.created);
  const completedSerie = daily.items.map(d => d.completed);
  const approvedSerie = daily.items.map(d => d.approved);
  const maxY = Math.max(...createdSerie, ...completedSerie, ...approvedSerie, 1);

    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div className="bg-white">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <article className="flex items-center justify-between text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
            <ChevronRight size={16} className="sm:w-5 sm:h-5" />
            <span className="text-[#0040B8] font-medium">Estadísticas</span>
          </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm">
            {/* rango actual mostrado */}
            <span className="text-gray-600">{overview.date_from} a {overview.date_to}</span>

            {/* atajos */}
            <Link
                href={`?month=${thisMonth}`}
                className="ml-3 rounded-[4px] border border-[#0040B8]/30 bg-[#0040B8]/5 px-2 py-1 text-[#0040B8]">
                Este mes
            </Link>
            <Link
                href={`?month=${prevMonth}`}
                className="rounded-[4px] border border-gray-300 bg-gray-50 px-2 py-1 text-gray-700">
                Mes anterior
            </Link>
            </div>
        </article>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card><div className="p-5"><p className="text-sm text-gray-500">Trámites creados</p><p className="mt-2 text-3xl font-semibold text-gray-900">{overview.totals.created}</p></div></Card>
          <Card><div className="p-5"><p className="text-sm text-gray-500">Completados</p><p className="mt-2 text-3xl font-semibold text-gray-900">{overview.totals.completed}</p></div></Card>
          <Card><div className="p-5"><p className="text-sm text-gray-500">En cola</p><p className="mt-2 text-3xl font-semibold text-gray-900">{overview.totals.in_queue}</p></div></Card>
          <Card><div className="p-5"><p className="text-sm text-gray-500">Tasa de aprobación</p><p className="mt-2 text-3xl font-semibold text-gray-900">{approvalPct}%</p><ProgressBar value={approvalPct} /></div></Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="xl:col-span-2">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-gray-500" /><h3 className="text-base sm:text-lg font-semibold text-gray-900">Tendencia diaria</h3></div>
              <div className="text-xs text-gray-500">Creados, Completados, Aprobados</div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><p className="text-xs text-gray-500 mb-2">Creados</p><TinyBars data={createdSerie} max={maxY} /></div>
                <div><p className="text-xs text-gray-500 mb-2">Completados</p><TinyBars data={completedSerie} max={maxY} /></div>
                <div><p className="text-xs text-gray-500 mb-2">Aprobados</p><TinyBars data={approvedSerie} max={maxY} /></div>
              </div>
              <div className="mt-4 text-xs text-gray-500">Desde {overview.date_from}, hasta {overview.date_to}</div>
            </div>
          </Card>

          <Card>
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2"><PieChart className="h-5 w-5 text-gray-500" /><h3 className="text-base sm:text-lg font-semibold text-gray-900">Estados</h3></div>
            </div>
            <div className="p-5 space-y-2">
              {status.items.map(s => {
                const pct = status.total ? Math.round((s.count / status.total) * 100) : 0;
                return (
                  <div key={s.status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{s.status}</span>
                    <ColorBadge label={`${pct}%`} value={s.count} ring="ring-gray-300" bg="bg-gray-100" text="text-gray-800" />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <Card className="xl:col-span-1">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Resultados</h3>
              <p className="text-sm text-gray-500">Distribución por resultado</p>
            </div>
            <div className="p-5 space-y-3">
              {results.items.length ? results.items.map(r => {
                const pct = results.total ? Math.round((r.count / results.total) * 100) : 0;
                return (
                  <div key={r.result || "Sin dato"}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{r.result || "Sin dato"}</span>
                      <span className="text-gray-900 font-medium">{r.count}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-[#0040B8]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-gray-500">Sin datos en el rango</p>}
            </div>
          </Card>

          <Card className="xl:col-span-2">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Modelos más frecuentes</h3>
                <p className="text-sm text-gray-500">Top 8 por cantidad</p>
              </div>
            </div>
            <div className="p-5 overflow-x-auto">
              {topModels.items.length ? (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-4 font-medium">Marca</th>
                      <th className="py-2 pr-4 font-medium">Modelo</th>
                      <th className="py-2 pr-4 font-medium">Cantidad</th>
                      <th className="py-2 pr-4 font-medium">Tendencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topModels.items.map((m, i) => (
                      <tr key={`${m.brand}-${m.model}-${i}`} className="border-t border-gray-100">
                        <td className="py-3 pr-4 text-gray-700">{m.brand || "N/D"}</td>
                        <td className="py-3 pr-4 font-medium text-gray-900">{m.model || "N/D"}</td>
                        <td className="py-3 pr-4">{m.count}</td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <ArrowUpRight className="h-4 w-4" />
                            estable
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-sm text-gray-500">Sin datos en el rango</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
