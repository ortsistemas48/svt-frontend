"use client";
import { Pencil, Trash2, Play, RefreshCcw, Plus } from "lucide-react";

const inspections = [
  {
    id: 1,
    plate: "AB123AB",
    model: "Fiat Cronos",
    owner: "Alejo Vaquero",
    dni: "46971353",
    date: "30/07/2025",
    time: "22:20 hs",
    status: "Completado",
  },
  {
    id: 2,
    plate: "AB123AB",
    model: "Fiat Cronos",
    owner: "Alejo Vaquero",
    dni: "46971353",
    date: "30/07/2025",
    time: "22:20 hs",
    status: "Completado",
  },
  {
    id: 3,
    plate: "AB123AB",
    model: "Fiat Cronos",
    owner: "Alejo Isaias Vaquero",
    dni: "46971353",
    date: "30/07/2025",
    time: "22:20 hs",
    status: "En curso",
  },
  {
    id: 4,
    plate: "AB123AB",
    model: "Fiat Cronos",
    owner: "Alejo Alejo Vaquero Vaquero",
    dni: "46971353",
    date: "30/07/2025",
    time: "22:20 hs",
    status: "Pendiente",
  },
] as const;

type StatusType = typeof inspections[number]["status"];

const statusColor: Record<StatusType, string> = {
  Completado: "text-green-600",
  "En curso": "text-yellow-600",
  Pendiente: "text-red-500",
};

export default function InspectionsTable() {
  return (
    <div className="px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <input
          type="text"
          placeholder="Busca inspecciones por su: Dominio, Propietario u Oblea"
          className="border px-4 py-3 rounded-[4px] w-full flex-1"
        />
        <div className="flex gap-2">
          <button className="border border-[#0040B8] text-[#0040B8] px-4 py-3 rounded-[4px] flex items-center gap-2">
            <RefreshCcw size={16} /> Actualizar
          </button>
        </div>
      </div>

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
            {inspections.map((item) => (
                <tr key={item.id} className="border-t">
                <td className="p-3 text-center">{item.id}</td>
                <td className="p-3 text-center">
                    <div className="font-medium">{item.plate}</div>
                    <div className="text-xs text-gray-600">{item.model}</div>
                </td>
                <td className="p-3 text-center">
                    <div className="font-medium max-w-[160px] truncate mx-auto">{item.owner}</div>
                    <div className="text-xs text-gray-600">{item.dni}</div>
                </td>
                <td className="p-3 text-center">
                    <div>{item.date}</div> 
                    <div className="text-xs">{item.time}</div>
                </td>
                <td className={`p-3 font-medium text-center ${statusColor[item.status]}`}>
                    {item.status}
                </td>
                <td className="p-3 flex justify-center items-center gap-3">
                    {item.status === "Completado" ? (
                    <Pencil size={16} className="cursor-pointer text-[#0040B8]" />
                    ) : (
                    <Play size={16} className="cursor-pointer text-[#0040B8]" />
                    )}
                    <Trash2 size={16} className="cursor-pointer text-[#0040B8]" />
                </td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
