import Link from 'next/link';
import {
  CircleFadingPlus,
  RefreshCw,
  ClipboardList,
  ChevronRight,
  AlertTriangle,
  ScrollText,
  CheckCircle,
  AlertCircle,
  Info,
  Check,
  X,
  Printer,
  Clock,
  Triangle,
  Clock2
} from 'lucide-react';
import clsx from 'clsx';
import { fetchDailyStatistics, fetchLatestApplications, fetchQueueApplications } from '@/utils';
import Card from '../Card';
import CheckRTOIcon from '../CheckRTOIcon';

type Status = 'Pendiente' | 'En Cola' | 'En curso' | 'Completado' | 'Cancelado';

const BADGE: Record<Status, string> = {
  Pendiente: 'bg-amber-100 text-amber-800 ring-amber-300',
  'En Cola': 'bg-gray-100 text-gray-800 ring-gray-300',
  'En curso': 'bg-blue-100 text-blue-800 ring-blue-300',
  Completado: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  Cancelado: 'bg-red-100 text-red-800 ring-red-300',
};

const STATUS_ICONS: Record<Status, any> = {
  Pendiente: Clock,
  'En Cola': Clock,
  'En curso': Clock,
  Completado: Check,
  Cancelado: X,
};

interface DashboardProps {
  workshopId: number;
  date?: string;
}

export default async function Dashboard({ workshopId, date }: DashboardProps) {
  const statistics = await fetchDailyStatistics(workshopId, date);

  const latestApps = await fetchLatestApplications(workshopId);
  const queueApps = await fetchQueueApplications(workshopId);

  const quick = [
    { key: 'list', title: 'Revisiones', href: `/dashboard/${workshopId}/applications`, icon: ClipboardList },
    { key: 'queue', title: 'Cola de revisiones', href: `/dashboard/${workshopId}/inspections-queue`, icon: RefreshCw },
    { key: 'new', title: 'Reimprimir CRT', href: `/dashboard/${workshopId}/reprint-crt`, icon: Printer },
  ];

  return (
    <div className="bg-white">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* breadcrumb simple */}
        <article className="flex items-center justify-between text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
          </div>
        </article>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="border-1 border-l-4 border-l-green-500">
            <div className="relative p-5">
              <p className="text-sm text-green-500">Revisiones</p>
              <p className="text-sm text-green-500">del día</p>

              <p className="mt-2 text-3xl font-semibold text-green-600">{statistics.applications.total}</p>
              <div className="absolute top-5 right-5">
                <div className="bg-green-100 p-1 rounded-xl">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-1 border-l-4 border-l-yellow-500">
            <div className="relative p-5">
              <p className="text-sm text-yellow-500">Revisiones</p>
              <p className="text-sm text-yellow-500">en cola</p>

              <p className="mt-2 text-3xl font-semibold text-yellow-600">{statistics.applications.in_queue}</p>
              <div className="absolute top-5 right-5">
                <div className="bg-yellow-100 p-1 rounded-xl">
                  <Clock2 className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-1 border-l-4 border-l-blue-500">
            <div className="relative p-5">
              <p className="text-sm text-blue-500">Revisiones</p>
              <p className="text-sm text-blue-500">disponibles</p>
              <p className="mt-2 text-3xl font-semibold text-blue-600">
                {statistics.workshop.available_inspections}
              </p>
              <div className="absolute top-5 right-5">
                <div className="bg-blue-100 p-1 rounded-xl">
                  <CheckRTOIcon className="h-5 w-5" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-1 border-l-4 border-l-red-500">
            <div className="relative p-5">
              <p className="text-sm text-red-500">Obleas</p>
              <p className="text-sm text-red-500">disponibles</p>

              <p className="mt-2 text-3xl font-semibold text-red-600">
                {statistics.sticker_stock.available}
              </p>
              {statistics.sticker_stock.available <= 250 && (
                <div className="mt-2 text-xs text-red-600">
                  Stock bajo
                </div>
              )}
              <div className="absolute top-5 right-5">
                <div className="bg-red-100 p-1 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* accesos rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {quick.map(({ key, title, href, icon: Icon }) => (
            <Link key={key} href={href} className="group">
              <Card className="h-full">
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full border border-[#0040B8]/20 bg-[#0040B8]/5 text-[#0040B8] flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#0040B8] transition-colors" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* dos columnas, últimos y cola */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Últimas revisiones */}
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

            {/* contenido */}
            {latestApps.items?.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs">
                      <th className="text-base py-3 px-2 sm:px-4 font-medium hidden md:table-cell">ID</th>
                      <th className="text-base py-3 px-2 sm:px-4 font-medium">Vehículo</th>
                      <th className="text-base py-3 px-2 sm:px-4 font-medium hidden lg:table-cell">Titular</th>
                      <th className="text-base py-3 px-2 sm:px-4 font-medium hidden sm:table-cell">Fecha de creación</th>
                      <th className="text-base py-3 px-2 sm:px-4 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestApps.items.map((r: any) => {
                      const StatusIcon = STATUS_ICONS[r.status as Status] || Clock;
                      return (
                        <tr key={r.application_id} className="border-t border-gray-100">
                          <td className="py-4 px-2 sm:px-4 font-medium text-gray-900 hidden md:table-cell">{r.application_id}</td>
                          <td className="py-4 px-2 sm:px-4">
                            <div className="flex flex-col">
                              {
                                r.car?.license_plate ? (<p className="text-base font-medium text-gray-900">{r.car?.license_plate}</p>) : <span className='font-bold'>No Asignado</span>
                              }
                              <span className="text-gray-500 text-xs">{r.car?.model}</span>
                            </div>
                          </td>
                          <td className="py-4 px-2 sm:px-4 text-gray-700 hidden lg:table-cell">
                            <div className="flex flex-col">
                              <span className="text-base">
                                {r.owner ? `${r.owner.first_name || ''} ${r.owner.last_name || ''}`.trim() || 'N/A' : 'N/A'}
                              </span>
                              {r.owner?.dni && (
                                <span className="text-gray-500 text-xs">
                                  {r.owner.dni}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-2 sm:px-4 text-gray-700 text-xs sm:text-sm hidden sm:table-cell">
                            {new Date(r.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')} {new Date(r.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-4 px-2 sm:px-4">
                            <span
                              className={clsx(
                                'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium',
                                BADGE[r.status as Status]
                              )}
                            >
                              <StatusIcon className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">{r.status}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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

          {/* Cola de revisiones */}
          <Card className="xl:col-span-1">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Cola de revisiones</h3>
                <p className="mt-1 text-sm text-gray-500">Lo que espera o está en proceso</p>
              </div>
              <Link href={`/dashboard/${workshopId}/inspections-queue`} className="text-sm text-[#0040B8] hover:underline">
                Ver cola
              </Link>
            </div>

            {queueApps.items?.length ? (
              <div className="p-5">
                <ul className="space-y-3">
                  {queueApps.items.map((q: any) => {
                    const StatusIcon = STATUS_ICONS[q.status as Status] || Clock;
                    return (
                      <li key={q.application_id} className="flex items-center justify-between">
                        <div>
                          {
                            q.car?.license_plate ? (<p className="text-sm font-medium text-gray-900">{q.car?.license_plate}</p>) : <span className='font-bold'>No Asignado</span>
                          }

                          <p className="text-xs text-gray-500">
                            {q.owner ? `${q.owner.first_name || ''} ${q.owner.last_name || ''}`.trim() || 'No Asignado' : <span className="font-black">No Asignado</span>}
                          </p>
                        </div>
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                            BADGE[q.status as Status]
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {q.status}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <div className="p-10">
                <div className="flex flex-col items-center justify-center text-center p-6">
                  <div className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-gray-400" />
                  </div>
                  <h4 className="mt-3 text-sm font-semibold text-gray-900">No hay vehículos en cola</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Cuando agregues nuevas revisiones, van a aparecer acá.
                  </p>
                  <Link
                    href={`/dashboard/${workshopId}/applications`}
                    className="mt-4 inline-flex items-center gap-2 rounded-[4px] border border-[#0040B8]/30 bg-[#0040B8]/5 px-3 py-2 text-sm text-[#0040B8]"
                  >
                    <CircleFadingPlus className="h-4 w-4" />
                    Iniciar revisión
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
