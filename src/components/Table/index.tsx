import page from "@/app/page";
import { Application } from "@/app/types";
import { Inspect, Pencil, Play, Trash2 } from "lucide-react";
import InspectionTableSkeleton from "../InspectionTableSkeleton";
const statusColor: Record<Application["status"], string> = {
  Completado: "text-green-600",
  "En curso": "text-blue-600",
  Pendiente: "text-red-500",
  "En Cola": "text-yellow-600",
};
interface TableComponentProps {
  applications: Application[];
  currentData: Application[];
  actions: { action: string; icon: React.ReactNode }[];
}
export default function TableComponent({ applications, currentData, actions }: TableComponentProps) {
  return (
    applications.length === 0 ? (
      <InspectionTableSkeleton />
    ) : 
    (
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
            {

              currentData.map((item) => {
                const dateObj = new Date(item.date);
                const date = dateObj.toLocaleDateString("es-AR");
                const time = dateObj.toLocaleTimeString("es-AR", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr key={item.application_id} className="border-t">
                    <td className="p-3 text-center">{item.application_id}</td>
                    <td className="p-3 text-center">
                      <div className="font-medium">{item.car?.license_plate || "-"}</div>
                      <div className="text-xs text-gray-600">
                        {item.car?.brand} {item.car?.model}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="font-medium max-w-[160px] truncate mx-auto">
                        {item.owner?.first_name || "-"} {item.owner?.last_name || ""}
                      </div>
                      <div className="text-xs text-gray-600">
                        {item.owner?.dni || "-"}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div>{date}</div>
                      <div className="text-xs">{time}</div>
                    </td>
                    <td className={`p-3 font-medium text-center ${statusColor[item.status]}`}>
                      {item.status}
                    </td>
                    <td className="p-0">
                      <div className="flex justify-center items-center gap-3 h-full min-h-[48px] px-3">
                        {actions.map(({ action, icon }, idx) => {
                          if (
                            action === "play" &&
                            !["En curso", "Pendiente", "En Cola"].includes(item.status)
                          ) {
                            return null;
                          }
                          return (
                            <span key={action + idx} className="cursor-pointer text-[#0040B8]">
                              {icon}
                            </span>
                          );
                        })}

                      </div>
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
        </table>
      </div>
    )
  );
}