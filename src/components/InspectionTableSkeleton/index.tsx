// components/TableSkeleton.tsx
import React from "react";

interface TableSkeletonProps {
  rows?: number;
}

export default function TableSkeleton({ rows = 5 }: TableSkeletonProps) {
  return (
    <div className="border border-gray-300 rounded-[4px] overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-regular bg-[#ffffff] text-[#00000080]">
          <tr>
            <th className="p-3 text-center">ID</th>
            <th className="p-3 text-center">Vehículo</th>
            <th className="p-3 text-center">Titular</th>
            <th className="p-3 text-center">Fecha de creación</th>
            <th className="p-3 text-center">Estado</th>
            <th className="p-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-t animate-pulse min-h-[60px]">
              {/* ID */}
              <td className="p-3 text-center align-middle">
                <Skeleton className="h-4 w-8 mx-auto" />
              </td>

              {/* Vehículo */}
              <td className="p-3 text-center align-middle">
                <div className="flex flex-col items-center gap-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </td>

              {/* Titular */}
              <td className="p-3 text-center align-middle">
                <div className="flex flex-col items-center gap-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </td>

              {/* Fecha de creación */}
              <td className="p-3 text-center align-middle">
                <div className="flex flex-col items-center gap-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </td>

              {/* Estado */}
              <td className="p-3 text-center align-middle">
                <Skeleton className="h-6 w-20 rounded-full mx-auto" />
              </td>

              {/* Acciones */}
              <td className="p-0 align-middle">
                <div className="flex justify-center items-center gap-3 h-full min-h-[48px] px-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-5 w-5 rounded" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200/80 rounded ${className}`} />;
}
