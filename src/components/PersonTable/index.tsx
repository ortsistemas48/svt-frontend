import { PersonType } from "@/app/types";
import renderDocument from "../DocumentCard";

type Doc = {
  id: number;
  file_name: string;
  file_url: string;
  size_bytes?: number;
  mime_type?: string;
  role?: "owner" | "driver" | "car" | "generic";
  created_at?: string;
};

const tableData = [
  { label: "Nombre", key: "first_name" },
  { label: "Apellido", key: "last_name" },
  { label: "DNI", key: "dni" },
  { label: "CUIT", key: "cuit" },
  { label: "Razón social", key: "razon_social" },
  { label: "Teléfono", key: "phone_number" },
  { label: "Email", key: "email" },
  { label: "Provincia", key: "province" },
  { label: "Localidad", key: "city" },
];

// ahora acepta docs
const renderPerson = (person: PersonType) => {

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {tableData.map((item) => (
          <div key={item.key} className="bg-gray-50 rounded-lg sm:rounded-[14px] p-3 sm:p-4">
            <dt className="text-xs sm:text-sm font-medium text-gray-500 mb-1">{item.label}</dt>
            <dd
              className={`text-xs sm:text-sm font-semibold text-gray-900 ${
                item.key === "province" || item.key === "city" ? "capitalize" : ""
              }`}
            >
              {
                // @ts-expect-error acceso indexado a propósito
                person[item.key] || <span className="text-gray-400 italic">No disponible</span>
              }
            </dd>
          </div>
        ))}
      </div>
    </div>
  );
};

export default renderPerson;
