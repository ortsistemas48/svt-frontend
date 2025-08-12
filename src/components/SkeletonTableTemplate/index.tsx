// components/SkeletonTableTemplate/index.tsx
import React from "react";
import type { TableHeader } from "@/components/TableTemplate";

type Props = {
  headers?: TableHeader[];              // 👈 opcional
  rows?: number;
  renderRow?: (cols: TableHeader[], rowIndex: number) => React.ReactNode;
};

export default function SkeletonTableTemplate({
  headers = [],                         // 👈 default para evitar undefined
  rows = 5,
  renderRow,
}: Props) {
  // Si no hay headers, devolvemos un tbody vacío para no crashear
  if (!headers || headers.length === 0) {
    return <tbody />;
  }

  if (renderRow) {
    return <tbody>{Array.from({ length: rows }).map((_, i) => renderRow(headers, i))}</tbody>;
  }

  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-t animate-pulse">
          {headers.map((_, col) => (
            <td key={col} className="p-3 text-center align-middle">
              <div className="flex flex-col items-center gap-1">
                <Sk className="h-4 w-24" />
                {col > 0 && col < headers.length - 2 && <Sk className="h-3 w-20" />}
              </div>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

function Sk({ className = "" }: { className?: string }) {
  return <div className={`bg-gray-200/80 rounded ${className}`} />;
}
