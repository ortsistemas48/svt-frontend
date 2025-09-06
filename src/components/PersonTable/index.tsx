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
  { label: "Teléfono", key: "phone_number" },
  { label: "Email", key: "email" },
  { label: "Provincia", key: "province" },
  { label: "Localidad", key: "city" },
];

// ahora acepta docs
const renderPerson = (person: PersonType, docs: Doc[] = []) => {
  const maxVisible = 3;
  const visible = docs.slice(0, maxVisible);
  const remaining = docs.length - visible.length;

  return (
    <div className="space-y-4 py-4">
      {/* Datos de la persona */}
      <div className="grid grid-cols-2 gap-6">
        {tableData.map((item) => (
          <div key={item.key}>
            <strong className="font-medium opacity-50">{item.label}:</strong>
            <p className={item.key === "province" || item.key === "city" ? "capitalize" : ""}>
              {
                // @ts-expect-error index access permitido para este caso
                person[item.key] || "No disponible"
              }
            </p>
          </div>
        ))}
      </div>

      {/* Documentos */}
      <p className="font-light opacity-40">Documentos</p>

      {docs.length === 0 ? (
        <p className="text-sm text-[#7a7a7a]">Sin documentos</p>
      ) : (
        <div className="flex flex-col">
          <div className="space-y-3">
            {visible.map((d) => (
              // si tu DocumentCard soporta url, podés pasarla como segundo arg: renderDocument(d.file_name, d.file_url)
              <div key={d.id}>{renderDocument(d.file_name)}</div>
            ))}
          </div>

          {remaining > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-blue-500 text-sm hover:underline border rounded border-gray-300 p-2 list-none">
                (+{remaining}) Ver más archivos
              </summary>
              <div className="mt-3 space-y-3">
                {docs.slice(maxVisible).map((d) => (
                  <div key={d.id}>{renderDocument(d.file_name)}</div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default renderPerson;
