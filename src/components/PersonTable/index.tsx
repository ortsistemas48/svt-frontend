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
    <div className="space-y-6">
      {/* Datos de la persona */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tableData.map((item) => (
          <div key={item.key} className="bg-gray-50 rounded-lg p-4">
            <dt className="text-sm font-medium text-gray-500 mb-1">{item.label}</dt>
            <dd className={`text-sm font-semibold text-gray-900 ${item.key === "province" || item.key === "city" ? "capitalize" : ""}`}>
              {
                // @ts-expect-error index access permitido para este caso
                person[item.key] || (
                  <span className="text-gray-400 italic">No disponible</span>
                )
              }
            </dd>
          </div>
        ))}
      </div>

      {/* Documentos */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">Documentos</h3>
          <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
            {docs.length}
          </span>
        </div>

        {docs.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">Sin documentos</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((d) => (
              <div key={d.id}>{renderDocument(d.file_name, d.file_url)}</div>
            ))}

            {remaining > 0 && (
              <details className="group">
                <summary className="cursor-pointer flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors duration-200 list-none">
                  <svg className="w-4 h-4 group-open:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Ver {remaining} documento{remaining > 1 ? 's' : ''} más
                </summary>
                <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-200">
                  {docs.slice(maxVisible).map((d) => (
                    <div key={d.id}>{renderDocument(d.file_name, d.file_url)}</div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default renderPerson;
