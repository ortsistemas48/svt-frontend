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

  // Estado CRT vigente/vencido según fecha de caducidad
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const expDate = insp?.expiration_date ? new Date(insp.expiration_date) : null;
  const isCrtVigente = expDate ? !isNaN(expDate.getTime()) && expDate >= startOfToday : false;

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
            

            {/* Badge CRT vigente/vencido arriba a la derecha */}
            <div
              className={clsx(
                "absolute top-3 right-3 rounded-full border px-3 py-1 text-[12px] font-medium flex items-center gap-1",
                isCrtVigente ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
              )}
            >
              <span className="opacity-70">CRT:</span>
              <span>{isCrtVigente ? "Vigente" : "Vencido"}</span>
            </div>

            <div className="bg-purple-50 px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-100 rounded-[14px] flex items-center justify-center">
                <Car className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-zinc-900">
                  <span className="md:hidden">Vehículo</span>
                  <span className="hidden md:inline">Datos del vehículo</span>
                </h2>
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
                  <p className={labelCls}>Estado de oblea</p>
                  <p className={clsx(
                    valueCls,
                    insp.result === "Apto" && "text-emerald-700",
                    insp.result === "Condicional" && "text-amber-700",
                    insp.result === "Rechazado" && "text-rose-700"
                  )}>
                    {estado || "No disponible"}
                  </p>
                </div>
              </div>
            </div>

            {/* Barra de resultado abajo */}
            <div className="border-t border-[#eaeaea]" />
            <div
              className={clsx(
                "px-5 py-2",
                insp.result === "Apto" && "bg-blue-50",
                insp.result === "Condicional" && "bg-orange-50",
                insp.result === "Rechazado" && "bg-zinc-50",
                !insp.result && "bg-zinc-50"
              )}
            >
              <div
                className={clsx(
                  "w-full px-1 py-2 text-left text-sm font-normal flex items-center gap-2",
                  insp.result === "Apto" && "text-blue-700",
                  insp.result === "Condicional" && "text-orange-700",
                  insp.result === "Rechazado" && "text-black",
                  !insp.result && "text-zinc-700"
                )}
              >
                {insp.result === "Apto" && <CheckCircle className="h-4 w-4 text-blue-700" />}
                {insp.result === "Condicional" && <Circle className="h-4 w-4 text-orange-700" />}
                {insp.result === "Rechazado" && <XCircle className="h-4 w-4 text-black" />}
                {!insp.result && <Circle className="h-4 w-4 text-zinc-600" />}
                {insp.result ? `Resultado de la revisión: ${insp.result}` : "Resultado de la revisión: No disponible"}
              </div>
            </div>

          </div>

          {/* Datos del taller */}
          <div className="max-w-4xl mx-auto rounded-2xl border border-[#d3d3d3] overflow-hidden">
            <div className="bg-blue-50 px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-[14px] flex items-center justify-center">
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
            Por la presente quien suscribe, deja constancia en carácter de declaración jurada que los CNI correspondientes a la presente planchuela, han sido utilizados para la prestación del servicio de RTO a Vehículos de Jurisdicción local en TRT registrado en la ANSV, procediendo en esta instancia, a la correspondiente rendición para la auditoría periódica y permanente del organismo correspondiente.
            </p>
            <div className="mt-5 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-8">
              <div className="flex items-center justify-center gap-6 lg:gap-8">
                <img
                  src="/images/other-logos/cfsv-logo.png"
                  alt="CFSV"
                  className="h-10 md:h-12 invert opacity-90 brightness-110 contrast-90"
                  loading="lazy"
                  decoding="async"
                />
                <img
                  src="/images/other-logos/ministerio-transporte.png"
                  alt="Ministerio de Transporte"
                  className="h-10 md:h-12 invert opacity-90 brightness-110 contrast-90"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <img
                src="/images/other-logos/sv_logo.png"
                alt="Seguridad Vial"
                className="h-10 md:h-12 invert opacity-90 brightness-110 contrast-90"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
