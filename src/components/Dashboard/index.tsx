import Link from 'next/link';
import {
  CircleFadingPlus,
  RefreshCw,
  ClipboardList,
  ChevronRight,
  AlertTriangle,
  ScrollText,
  ArrowUp
} from 'lucide-react';
import clsx from 'clsx';
import { fetchDailyStatistics, fetchLatestApplications, fetchQueueApplications } from '@/utils';
import Card from '../Card';

type Status = 'Pendiente' | 'En Cola' | 'En curso' | 'Completado' | 'A Inspeccionar' | 'Emitir CRT';

const BADGE: Record<Status, string> = {
  Pendiente: 'bg-amber-100 text-amber-700 ring-amber-300',
  'En Cola': 'bg-gray-100 text-gray-700 ring-gray-300',
  'En curso': 'bg-blue-100 text-blue-700 ring-blue-300',
  Completado: 'bg-emerald-100 text-emerald-700 ring-emerald-300',
  'A Inspeccionar': 'bg-amber-50 text-amber-700 ring-amber-300',
  'Emitir CRT': 'bg-violet-100 text-violet-700 ring-violet-300'
};

interface DashboardProps {
  workshopId: number;
  date?: string;
}

export default async function Dashboard({ workshopId, date }: DashboardProps) {
  const statistics = await fetchDailyStatistics(workshopId, date);
  // const approvalPct = Math.round(statistics.applications.approval_rate);

  const latestApps = await fetchLatestApplications(workshopId);
  const queueApps = await fetchQueueApplications(workshopId);

  const quick = [
    { key: 'new', title: 'Nueva revisión', href: `/dashboard/${workshopId}/applications`, icon: CircleFadingPlus },
    { key: 'continue', title: 'Continuar revisión', href: `/dashboard/${workshopId}/continue-application`, icon: ClipboardList },
    { key: 'queue', title: 'Cola de revisiones', href: `/dashboard/${workshopId}/inspections-queue`, icon: RefreshCw },
  ];

  return (
    <div className="bg-white">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <article className="flex items-center justify-between text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
          </div>
        </article>

        <div className="grid grid-cols-1 md:grid-cols-3 min-[1400px]:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="max-[1399px]:hidden">
            <div className="p-5 h-30 flex flex-col items-center justify-center text-center">
              <p className="text-md text-[#4C4C4C]">Revisiones del día</p>
              <div className="mt-3 flex items-center justify-center gap-1">
                {statistics.applications.total > 1 && (
                  <ArrowUp className="h-6 w-6 text-[#00BE16]" />
                )}
                <p
                  className={clsx(
                    "text-3xl font-semibold",
                    statistics.applications.total > 1 ? "text-[#00BE16]" : "text-gray-900"
                  )}
                >
                  {statistics.applications.total}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-5 h-30 flex flex-col items-center justify-center text-center">
              <p className="text-md text-[#4C4C4C]">Revisiones en cola</p>
              <p className="mt-3 text-3xl font-semibold text-[#FF8000]">
                {statistics.applications.in_queue}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5 h-30 flex flex-col items-center justify-center text-center">
              <p className="text-md text-[#4C4C4C]">Revisiones disponibles</p>
              <p className="mt-3 text-3xl font-semibold text-[#0040B8]">
                {statistics.workshop.available_inspections}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5 h-30 flex flex-col items-center justify-center text-center">
              <p className="text-md text-[#4C4C4C]">Obleas disponibles</p>
              <p
                className={clsx(
                  "mt-3 text-3xl font-semibold",
                  statistics.sticker_stock.available <= 250 ? "text-rose-600" : "text-gray-900"
                )}
              >
                {statistics.sticker_stock.available}
              </p>
              {statistics.sticker_stock.available <= 250 && (
                <div className="mt-2 inline-flex items-center gap-2 text-xs text-rose-600">
                  <AlertTriangle className="h-4 w-4" />
                  Stock bajo
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {quick.map(({ key, title, href, icon: Icon }) => (
            <Link key={key} href={href} className="group">
              <Card className="h-full">
                <div className="px-4 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-[50px] bg-[#E6ECF8] text-[#0040B8] flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-md ml-2">{title}</h4>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 group-hover:text-[#0040B8] transition-colors" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <Card className="xl:col-span-2">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Últimas revisiones</h3>
                <p className="mt-1 text-sm text-gray-500">Estados y patentes recientes</p>
              </div>
              <Link href={`/dashboard/${workshopId}/applications`} className="text-sm text-[#0040B8] hover:underline">
                Ver todo
              </Link>
            </div>

            {latestApps.items?.length ? (
              <div className="p-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="py-2 pr-4 font-medium">Patente</th>
                      <th className="py-2 pr-4 font-medium">Titular</th>
                      <th className="py-2 pr-4 font-medium">Estado</th>
                      <th className="py-2 pr-4 font-medium">Actualizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestApps.items.map((r: any) => (
                      <tr key={r.application_id} className="border-t border-gray-100">
                        <td className="py-3 pr-4 font-medium text-gray-900">{r.car?.license_plate || 'N/A'}</td>
                        <td className="py-3 pr-4 text-gray-700">
                          {r.owner ? `${r.owner.first_name || ''} ${r.owner.last_name || ''}`.trim() || 'N/A' : 'N/A'}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={clsx(
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                              BADGE[r.status as Status]
                            )}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-500">
                          {new Date(r.date).toLocaleString('es-AR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {statistics.sticker_stock.available <= 250 && (
                  <Link
                    href={`/dashboard/${workshopId}/stickers`}
                    className="mt-5 block rounded-[4px] border bg-rose-100 border-rose-300 px-4 py-3 text-sm text-rose-500"
                  >
                    Stock bajo de obleas, asigná las tuyas haciendo click aquí.
                  </Link>
                )}
              </div>
            ) : (
              <div className="p-10">
                <div className="flex flex-col items-center justify-center text-center p-6">
                  <div className="h-12 w-12 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                    <ScrollText className="h-6 w-6 text-gray-400" />
                  </div>
                  <h4 className="mt-4 text-sm font-semibold text-gray-900">No hay revisiones recientes</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Cuando cargues trámites, vas a ver acá las últimas patentes y estados.
                  </p>
                  <Link
                    href={`/dashboard/${workshopId}/applications`}
                    className="mt-4 inline-flex items-center gap-2 rounded-[4px] border border-[#0040B8]/30 bg-[#0040B8]/5 px-3 py-2 text-sm text-[#0040B8]"
                  >
                    <CircleFadingPlus className="h-4 w-4" />
                    Crear revisión
                  </Link>
                </div>
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}

