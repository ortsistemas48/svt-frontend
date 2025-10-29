import { fetchQrData } from "@/utils";
import { Car, Wrench, CheckCircle, XCircle, Circle } from "lucide-react";
import CheckRTOIcon from "@/components/CheckRTOIcon";
import clsx from "clsx";

function fmtDate(d?: string | null) {
  if (!d) return "No disponible";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "No disponible";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default async function QrPage({ params }: { params: Promise<{ stickerNumber: string }> }) {
  const { stickerNumber } = await params;
  const qrData = await fetchQrData(stickerNumber);

  if (!qrData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-zinc-600">
        No se pudo cargar el dato del QR
      </div>
    );
  }

  const car = qrData.car || {};
  const workshop = qrData.workshop || {};
  const insp = qrData.inspection || {};

  const labelCls = "text-[13px] font-medium text-zinc-600";
  const valueCls = "text-[15px] text-zinc-900";

  // Badge de estado: toma el de la inspección y, si no hay, el del sticker
  const estado = ( qrData.sticker_status || "").toString();
  const estadoCfg =
    estado === "En Uso"
      ? { Icon: CheckCircle, wrap: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" }
      : estado === "No Disponible"
      ? { Icon: XCircle, wrap: "bg-rose-50 border-rose-200", text: "text-rose-700" }
      : { Icon: Circle, wrap: "bg-zinc-50 border-zinc-200", text: "text-zinc-700" };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-4">
          <div className="w-full bg-white border border-zinc-200 rounded-xl px-6 py-4 flex items-center gap-2">
            <CheckRTOIcon className="w-7 h-7" />
            <span className="text-md font-semibold text-zinc-800">Check RTO</span>
          </div>
        </div>

        {/* Contenido */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 space-y-6">
          {/* Datos del vehículo */}
          <div className="relative max-w-4xl mx-auto rounded-2xl border border-[#d3d3d3] overflow-hidden">
            {/* Badge de estado en esquina */}
            <div
              className={clsx(
                "absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                estadoCfg.wrap,
                estadoCfg.text
              )}
              title={`Estado: ${estado || "No disponible"}`}
            >
              <estadoCfg.Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{estado || "No disponible"}</span>
            </div>

            <div className="bg-purple-50 px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-zinc-900">Datos del vehículo</h2>
                <p className="text-xs text-zinc-600">Información técnica del vehículo</p>
              </div>
            </div>
            <div className="border-t border-[#eaeaea]" />

            {/* Vehículo */}
            <div className="px-5 py-5 bg-white">
              {/* 1 por fila en mobile, 3 por fila en pantallas grandes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 md:gap-y-4">
                <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-2 md:space-y-1">
                  <p className={labelCls}>Dominio</p>
                  <p className={valueCls}>{(car.license_plate || "No disponible")?.toString().toUpperCase()}</p>
                </div>
                <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-2 md:space-y-1">
                  <p className={labelCls}>Marca</p>
                  <p className={valueCls}>{car.brand || "No disponible"}</p>
                </div>
                <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-2 md:space-y-1">
                  <p className={labelCls}>Modelo</p>
                  <p className={valueCls}>{car.model || "No disponible"}</p>
                </div>

                <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-2 md:space-y-1">
                  <p className={labelCls}>Año de patentamiento</p>
                  <p className={valueCls}>{car.patent_year || car.registration_year || "No disponible"}</p>
                </div>
                <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-2 md:space-y-1">
                  <p className={labelCls}>Oblea vinculada</p>
                  <p className={valueCls}>{qrData.sticker_number || "No disponible"}</p>
                </div>
                <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-2 md:space-y-1">
                  <p className={labelCls}>N° CRT/CNI</p>
                  <p className={valueCls}>{insp.application_id || "No disponible"}</p>
                </div>

                <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-2 md:space-y-1">
                  <p className={labelCls}>Emisión de CRT</p>
                  <p className={valueCls}>{fmtDate(insp.inspection_date || insp.issue_date)}</p>
                </div>
                <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-2 md:space-y-1">
                  <p className={labelCls}>Caducidad de CRT</p>
                  <p className={valueCls}>{fmtDate(insp.expiration_date)}</p>
                </div>
                <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-2 md:space-y-1">
                  <p className={labelCls}>Resultado de revisión</p>
                  <p className={clsx(
                    valueCls,
                    insp.result === "Apto" && "text-emerald-700",
                    insp.result === "Condicional" && "text-amber-700",
                    insp.result === "Rechazado" && "text-rose-700"
                  )}>
                    {insp.result || "No disponible"}
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Datos del taller */}
          <div className="max-w-4xl mx-auto rounded-2xl border border-[#d3d3d3] overflow-hidden">
            <div className="bg-blue-50 px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-zinc-900">Datos del taller</h2>
                <p className="text-xs text-zinc-600">Emisor del certificado</p>
              </div>
            </div>
            <div className="border-t border-[#eaeaea]" />

            {/* Taller */}
            <div className="px-5 py-5 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 md:gap-y-4">
                <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-2 md:space-y-1">
                  <p className={labelCls}>CUIT</p>
                  <p className={valueCls}>{workshop.cuit || "No disponible"}</p>
                </div>
                <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-2 md:space-y-1">
                  <p className={labelCls}>Razón social</p>
                  <p className={valueCls}>{workshop.razon_social || "No disponible"}</p>
                </div>
                <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-2 md:space-y-1">
                  <p className={labelCls}>Nombre</p>
                  <p className={valueCls}>{workshop.name || "No disponible"}</p>
                </div>
                <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-2 md:space-y-1">
                  <p className={labelCls}>Provincia</p>
                  <p className={valueCls}>{workshop.province || "No disponible"}</p>
                </div>
                <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-2 md:space-y-1">
                  <p className={labelCls}>Localidad</p>
                  <p className={valueCls}>{workshop.city || "No disponible"}</p>
                </div>
                <div className="text-center md:text-left flex flex-col items-center md:items-start space-y-2 md:space-y-1">
                  <p className={labelCls}>Domicilio</p>
                  <p className={valueCls}>{workshop.address || "No disponible"}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Leyenda legal */}
          <div className="max-w-4xl mx-auto rounded-2xl border border-[#d3d3d3] bg-white p-6 text-center">
            <p className="text-sm text-zinc-700 leading-relaxed">
              Este certificado y su oblea asociada han sido emitidos a través de CheckRTO S.A, sistema integral de gestión validado conforme a lo establecido por la Ley Nacional de Tránsito N° 24.449 y su Decreto Reglamentario N° 779/95, contando con la autorización otorgada por la autoridad competente para la asignación de obleas oficiales, lo que garantiza su plena validez legal y autenticidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
