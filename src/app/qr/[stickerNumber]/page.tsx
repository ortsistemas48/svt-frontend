import { fetchQrData } from "@/utils";
import { Car, Wrench } from "lucide-react";
import CheckRTOIcon from "@/components/CheckRTOIcon";

export default async function QrPage({ params }: { params: Promise<{ stickerNumber: string }> }) {
  const { stickerNumber } = await params;
  const qrData = await fetchQrData(stickerNumber);
  console.log(qrData);
  
  if (!qrData) {
    return <div>No se pudo cargar el dato del QR</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <CheckRTOIcon className="w-8 h-8" />
          <h1 className="text-2xl font-bold text-gray-900">Check RTO</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          {/* Vehicle Data Section */}
          <div className="bg-purple-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-purple-600" size={20} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Datos del vehículo</h2>
                <p className="text-sm text-gray-600">Información técnica del vehículo</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Dominio</label>
                <p className="text-base text-gray-900 font-semibold">{qrData.car.license_plate}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Marca</label>
                <p className="text-base text-gray-900 font-semibold">{qrData.car.brand}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Modelo</label>
                <p className="text-base text-gray-900 font-semibold">{qrData.car.model}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Año</label>
                <p className="text-base text-gray-900 font-semibold">{qrData.car.registration_year}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Oblea vinculada</label>
                <p className="text-base text-gray-900 font-semibold">{qrData.sticker_number}</p>
              </div>
            </div>
          </div>

          {/* Workshop Data Section */}
          <div className="bg-blue-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-blue-600" size={20} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Datos del taller</h2>
                <p className="text-sm text-gray-600">Emisor del certificado</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">CUIT</label>
                <p className="text-base text-gray-900 font-semibold">
                  {qrData.workshop.cuit || 'No Disponible'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Razón social</label>
                <p className="text-base text-gray-900 font-semibold">{qrData.workshop.razon_social}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Planta</label>
                <p className="text-base text-gray-900 font-semibold">{qrData.workshop.plant_number}</p>
              </div>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">
            Este certificado y su oblea asociada han sido emitidos a través de 
            CheckRTO S.A, sistema integral de gestión validado conforme a lo establecido por la Ley Nacional de Tránsito N° 24.449 y su Decreto Reglamentario N° 779/95, contando con la autorización otorgada por la autoridad competente para la asignación de obleas oficiales, lo que garantiza su plena validez legal y autenticidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
