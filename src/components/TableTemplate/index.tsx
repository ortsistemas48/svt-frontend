// components/TableTemplate.tsx
import React from "react";
import SkeletonTableTemplate from "@/components/SkeletonTableTemplate";

export type TableHeader = {
  label: React.ReactNode;
  className?: string;
  thProps?: React.ThHTMLAttributes<HTMLTableCellElement>;
};

type Props<T> = {
  headers: TableHeader[]; // 👈 requerido acá
  items: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  isLoading?: boolean;
  emptyMessage?: string;
  rowsPerSkeleton?: number;
  renderSkeletonRow?: (cols: TableHeader[], rowIndex: number) => React.ReactNode;
  outerClassName?: string;
  tableClassName?: string;
  theadClassName?: string;
};

export default function TableTemplate<T>({
  headers,
  items,
  renderRow,
  isLoading = false,
  emptyMessage = "No hay datos para mostrar.",
  rowsPerSkeleton = 5,
  renderSkeletonRow,
  outerClassName = "rounded-[4px] overflow-hidden",
  tableClassName = "w-full text-sm",
  theadClassName = "text-regular bg-[#ffffff] text-[#00000080]",
}: Props<T>) {
  return (
    <div className={outerClassName}>
      <table className={tableClassName}>
        <thead className={theadClassName}>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className={`p-3 text-center text-gray-600 font-light text-sm${h.className ?? ""}`} {...h.thProps}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>

        {isLoading ? (
          <SkeletonTableTemplate
            headers={headers}              // 👈 asegurar que va
            rows={rowsPerSkeleton}
            renderRow={renderSkeletonRow}
          />
        ) : items.length === 0 ? (
          <tbody>
            <tr className="border-t">
              <td colSpan={headers.length} className="p-8 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          </tbody>
        ) : (
          <tbody className="border-t divide-y divide-gray-200">{items.map((it, i) => renderRow(it, i))}</tbody>
        )}
      </table>
    </div>
  );
}
