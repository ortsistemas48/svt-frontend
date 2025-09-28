'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CircleFadingPlus,
  RefreshCw,
  ClipboardList,
  FileBadge2,
  ScrollText,
  Users,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';

// mock KPIs y filas
const MOCK = {
  today: 6,
  in_queue: 3,
  approval_rate: 0.82,
  crt_stock: 9,
  recent: [
    { id: 1, plate: 'AB123CD', owner: 'Juan Perez', status: 'Aprobado', updated_at: new Date().toISOString() },
    { id: 2, plate: 'AC456EF', owner: 'María López', status: 'En Progreso', updated_at: new Date().toISOString() },
    { id: 3, plate: 'AD789GH', owner: 'Carlos Diaz', status: 'Pendiente', updated_at: new Date().toISOString() },
    { id: 4, plate: 'AE321JK', owner: 'Ana Ruiz', status: 'Rechazado', updated_at: new Date().toISOString() },
  ],
  queue: [
    { id: 11, plate: 'AF222AA', owner: 'Pedro Gomez', status: 'Pendiente', updated_at: new Date().toISOString() },
    { id: 12, plate: 'AG333BB', owner: 'Lucia S.', status: 'En Progreso', updated_at: new Date().toISOString() },
    { id: 13, plate: 'AH444CC', owner: 'R. Ortega', status: 'Pendiente', updated_at: new Date().toISOString() },
  ],
} as const;

type Status = 'Pendiente' | 'En Progreso' | 'Aprobado' | 'Rechazado';

const BADGE: Record<Status, string> = {
  Pendiente: 'bg-amber-100 text-amber-800 ring-amber-300',
  "En Progreso": 'bg-blue-100 text-blue-800 ring-blue-300',
  Aprobado: 'bg-emerald-100 text-emerald-800 ring-emerald-300',
  Rechazado: 'bg-rose-100 text-rose-800 ring-rose-300',
};

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-[8px] border border-[#d3d3d3] bg-white', className)}>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const { id } = useParams<{ id: string }>();
  const approvalPct = Math.round(MOCK.approval_rate * 100);

  const quick = [
    { key: 'new', title: 'Nueva revisión', desc: 'Iniciar un trámite nuevo', href: `/dashboard/${id}/applications`, icon: CircleFadingPlus },
    { key: 'queue', title: 'Cola de revisiones', desc: 'Ver pendientes y en proceso', href: `/dashboard/${id}/queue`, icon: RefreshCw },
    { key: 'list', title: 'Revisiones', desc: 'Listado y búsqueda', href: `/dashboard/${id}/applications/list`, icon: ClipboardList },
    { key: 'crt', title: 'Reimpresión de CRT', desc: 'Reimprimir certificados', href: `/dashboard/${id}/crt`, icon: FileBadge2 },
    { key: 'obleas', title: 'Comprar obleas', desc: 'Stock para el taller', href: `/dashboard/${id}/store/obleas`, icon: ScrollText },
    { key: 'users', title: 'Usuarios', desc: 'Permisos y roles', href: `/dashboard/${id}/users`, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* breadcrumb simple, igual al de tus pantallas */}
        <article className="flex items-center justify-between text-sm sm:text-base lg:text-lg mb-4 sm:mb-6">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Inicio</span>
            <ChevronRight size={16} className="sm:w-5 sm:h-5" />
            <span className="text-[#0040B8] font-medium">Resumen</span>
          </div>
        </article>

        {/* KPIs, cuatro cards en blanco */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <div className="p-5">
              <p className="text-sm text-gray-500">Revisiones hoy</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{MOCK.today}</p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <p className="text-sm text-gray-500">En cola</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{MOCK.in_queue}</p>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-[#0040B8]" style={{ width: `${Math.min(100, MOCK.in_queue * 12)}%` }} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <p className="text-sm text-gray-500">Tasa de aprobación</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{approvalPct}%</p>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${approvalPct}%` }} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <p className="text-sm text-gray-500">Obleas disponibles</p>
              <p className={clsx('mt-2 text-3xl font-semibold', MOCK.crt_stock <= 10 ? 'text-rose-600' : 'text-gray-900')}>
                {MOCK.crt_stock}
              </p>
              {MOCK.crt_stock <= 10 && (
                <div className="mt-2 inline-flex items-center gap-2 text-xs text-rose-600">
                  <AlertTriangle className="h-4 w-4" />
                  Stock bajo
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* accesos rápidos, estilo blanco con borde gris, ícono azul */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {quick.map(({ key, title, desc, href, icon: Icon }) => (
            <Link key={key} href={href} className="group">
              <Card className="h-full">
                <div className="p-5 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-[4px] border border-[#0040B8]/20 bg-[#0040B8]/5 text-[#0040B8] flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#0040B8] transition-colors" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* dos columnas, últimos y cola, todo blanco */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          <Card className="xl:col-span-2">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Últimas revisiones</h3>
                <p className="mt-1 text-sm text-gray-500">Estados y patentes recientes</p>
              </div>
              <Link href={`/dashboard/${id}/applications/list`} className="text-sm text-[#0040B8] hover:underline">
                Ver todo
              </Link>
            </div>

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
                  {MOCK.recent.map(r => (
                    <tr key={r.id} className="border-t border-gray-100">
                      <td className="py-3 pr-4 font-medium text-gray-900">{r.plate}</td>
                      <td className="py-3 pr-4 text-gray-700">{r.owner}</td>
                      <td className="py-3 pr-4">
                        <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset', BADGE[r.status as Status])}>
                          {r.status === 'Aprobado'}
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{new Date(r.updated_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="xl:col-span-1">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Cola de revisiones</h3>
                <p className="mt-1 text-sm text-gray-500">Lo que espera o está en proceso</p>
              </div>
              <Link href={`/dashboard/${id}/queue`} className="text-sm text-[#0040B8] hover:underline">
                Ver cola
              </Link>
            </div>

            <div className="p-5">
              <ul className="space-y-3">
                {MOCK.queue.map(q => (
                  <li key={q.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{q.plate}</p>
                      <p className="text-xs text-gray-500">{q.owner}</p>
                    </div>
                    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset', BADGE[q.status as Status])}>
                      {q.status}
                    </span>
                  </li>
                ))}
              </ul>

              {MOCK.crt_stock <= 10 && (
                <Link
                  href={`/dashboard/${id}/store/obleas`}
                  className="mt-5 block rounded-[4px] border bg-rose-100 border-rose-300 px-4 py-3 text-sm text-emerald-800 hover:bg-emerald-100"
                >
                  Stock bajo de obleas, hacé tu compra
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
