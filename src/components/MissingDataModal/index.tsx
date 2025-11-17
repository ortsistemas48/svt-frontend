import { PersonType } from "@/app/types";
import { getMissingPersonFields } from "@/utils";
import { ChevronLeft } from "lucide-react";

export default function MissingDataModal({
  missingFields, onClose
}: {
  missingFields: string[];
  onClose: (arg: boolean) => void;
}) {
  const ownerMissingFields = missingFields.filter(field => field.includes('Titular'))
  const driverMissingFields = missingFields.filter(field => field.includes('Conductor'));
  const carMissingFields = missingFields.filter(field => field.includes('Vehículo'));
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[10px] max-w-md w-full p-6">
        <h2 className="text-xl mb-2 font-bold">No se puede continuar</h2>
        <div className="mb-4">
          <h4 className="font-medium text-lg mb-2">
            Faltan campos por completar:
          </h4>
          { (ownerMissingFields.length > 0 || driverMissingFields.length > 0) ?
            (
              <ul className="text-red-500 mt-3 text-sm list-disc list-inside grid grid-cols-2 gap-2">
                {ownerMissingFields.map((field) => (
                  <li key={field} className="col-span-1">
                    {field}
                  </li>
                ))}
                {driverMissingFields.map((field) => (
                  <li key={field} className="col-span-1">
                    {field}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="text-red-500 mt-3 text-sm list-disc list-inside">
                {carMissingFields.map((field) => (
                  <li key={field}>
                    {field}
                  </li>
                ))}
              </ul>
          )}
        </div>
        <div className="flex justify-center gap-5 m-4">
          <button onClick={() => onClose(false)} className="flex gap-x-2 justify-center items-center bg-white border border-[#d91e1e] text-[#d91e1e] duration-150 px-4 py-2 rounded-[4px] hover:text-white hover:bg-[#d91e1e]">
            <ChevronLeft size={18} />
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
