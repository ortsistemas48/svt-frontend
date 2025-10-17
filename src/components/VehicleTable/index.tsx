import { CarType } from "@/app/types";
import renderDocument from "../DocumentCard";

const tableData = [
  { label: "Dominio", key: "license_plate" },
  { label: "Marca", key: "brand" },
  { label: "Modelo", key: "model" },
  { label: "Fabricación", key: "manufacture_year" },
  { label: "Peso del auto (KG)", key: "total_weight" },
  { label: "Peso eje trasero (KG)", key: "back_weight" },
  { label: "Peso eje delantero (KG)", key: "front_weight" },
  { label: "Tipo de combustible", key: "fuel_type" },
  { label: "Tipo de vehículo", key: "vehicle_type" },
  { label: "Tipo de uso", key: "usage_type" },
  { label: "Marca de motor", key: "engine_brand" },
  { label: "Número de motor", key: "engine_number" },
  { label: "Marca de chasis", key: "chassis_brand" },
  { label: "Número de chasis", key: "chassis_number" },
  { label: "Nº de cédula verde", key: "green_card_number" },
  { label: "Exp. de la cédula", key: "green_card_expiration" },
  { label: "Nº de licencia", key: "license_number" },
  { label: "Clase de licencia", key: "license_class" },
  { label: "Exp. de la licencia", key: "license_expiration" },
  { label: "Póliza del seguro", key: "insurance" },
  { label: "Patentamiento", key: "registration_year" },
  // 👇 campos del sticker (anidados)

  // (opcional) mostrarlos si querés
  // { label: "Estado de oblea", key: "sticker.status" },
  // { label: "Vencimiento oblea", key: "sticker.expiration_date" },
];

type Doc = {
  id: number;
  file_name: string;
  file_url: string;
  size_bytes?: number;
  mime_type?: string;
  role?: "owner" | "driver" | "car" | "generic";
  created_at?: string;
};

// Helper para acceder a rutas "a.b.c"
function getByPath(obj: any, path: string) {
  return path.split(".").reduce((acc, part) => (acc ? acc[part] : undefined), obj);
}

const renderVehicle = (car: CarType, carDocs: Doc[] = []) => {
  const formatDate = (value: string) => {
    const d = new Date(value);
    // Si no es fecha válida, devolvés el valor crudo
    if (isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  };

  const isDateKey = (key: string) =>
    key === "green_card_expiration" ||
    key === "license_expiration" ||
    key === "sticker.expiration_date";

  // Group fields by category for better organization
  const categories = {
    basic: tableData.slice(0, 4), // Dominio, Marca, Modelo, Año
    technical: tableData.slice(4, 10), // Peso, combustible, tipo vehículo, etc.
    engine: tableData.slice(10, 14), // Motor y chasis
    documents: tableData.slice(14, 23), // Cédula, licencia, seguro
  };

  const renderField = (item: any) => {
    const rawValue = getByPath(car, item.key);
    let value: any = rawValue;

    if (value == null || value === "") {
      value = "No disponible";
    } else if (typeof value === "string" && isDateKey(item.key)) {
      value = formatDate(value);
    }

    return (
      <div key={item.key} className="bg-gray-50 rounded-lg p-4">
        <dt className="text-sm font-medium text-gray-500 mb-1">{item.label}</dt>
        <dd className="text-sm font-semibold text-gray-900 break-all">
          {value === "No disponible" ? (
            <span className="text-gray-400 italic">{value}</span>
          ) : (
            String(value)
          )}
        </dd>
      </div>
    );
  };
  const maxVisible = 3;
  const visible = carDocs.slice(0, maxVisible);
  const remaining = carDocs.length - visible.length;

  return (
    <div className="space-y-8">
      {/* Información Básica */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">Información Básica</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.basic.map(renderField)}
        </div>
      </div>

      {/* Especificaciones Técnicas */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">Especificaciones Técnicas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.technical.map(renderField)}
        </div>
      </div>

      {/* Motor y Chasis */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">Motor y Chasis</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.engine.map(renderField)}
        </div>
      </div>

      {/* Documentación */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">Documentación</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.documents.map(renderField)}
        </div>
      </div>

      {/* Archivos del vehículo */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">Archivos adjuntos del vehículo</h3>
          <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
            {carDocs.length}
          </span>
        </div>

        {carDocs.length === 0 ? (
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
                  Ver {remaining} documento{remaining > 1 ? "s" : ""} más
                </summary>
                <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-200">
                  {carDocs.slice(maxVisible).map((d) => (
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

export default renderVehicle;
