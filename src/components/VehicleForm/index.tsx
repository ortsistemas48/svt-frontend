"use client";

import FormField from "@/components/PersonFormField";
import { useApplication } from "@/context/ApplicationContext";
import React, { useEffect, useMemo, useState } from "react";
import { fetchAvailableStickers } from "../../utils";
import { useParams } from "next/navigation";

interface FormFieldData {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  options?: { value: string; label: string }[];
  className?: string;
}

interface VehicleFormProps {
  car: any; // incluye: sticker_id y (opcional) sticker { id, sticker_number, expiration_date, status, ... }
  setCar: (car: any) => void;
}

const formData1: FormFieldData[] = [
  { label: "Dominio", placeholder: "Ej: AB123AB", name: "license_plate" },
  { label: "Marca", placeholder: "Ej: Fiat", name: "brand" },
  { label: "Modelo", placeholder: "Ej: Cronos", name: "model" },
  { label: "Año", placeholder: "Ej: 2025", name: "manufacture_year", type: "text" },
  {
    label: "Peso del auto",
    options: [
      { value: "liviano", label: "Liviano" },
      { value: "pesado", label: "Pesado" },
    ],
    name: "weight",
  },
  {
    label: "Tipo de combustible",
    options: [
      { value: "nafta", label: "Nafta" },
      { value: "diesel", label: "Diésel" },
      { value: "electrico", label: "Eléctrico" },
    ],
    name: "fuel_type",
  },
  {
    label: "Tipo de vehículo",
    options: [
      { value: "auto", label: "Auto" },
      { value: "camioneta", label: "Camioneta" },
      { value: "moto", label: "Moto" },
    ],
    name: "vehicle_type",
  },
  {
    label: "Tipo de uso",
    options: [
      { value: "particular", label: "Particular" },
      { value: "comercial", label: "Comercial" },
    ],
    name: "usage_type",
  },
  { label: "Marca de motor", placeholder: "Ej: Toyota", name: "engine_brand" },
  { label: "Número de motor", placeholder: "Ej: B91099432213123", name: "engine_number" },
];

const formData2: FormFieldData[] = [
  { label: "Número de chasis", placeholder: "Ej: 1231415251251451", name: "chassis_number" },
  { label: "Marca de chasis", placeholder: "Ej: MARCA", name: "chassis_brand" },
  { label: "Nº de cédula verde", placeholder: "Ej: 122144351", name: "green_card_number" },
  { label: "Exp. de la cédula", type: "date", placeholder: "dd/mm/aa", name: "green_card_expiration" },
  { label: "Nº de licencia", placeholder: "Ej: 14214545", name: "license_number" },
  { label: "Exp. de la licencia", type: "date", placeholder: "dd/mm/aa", name: "license_expiration" },
  { label: "Póliza del seguro", type: "text", placeholder: "Ej: 123456789", name: "insurance" },
];

type Mode = "idle" | "view" | "edit";

export default function VehicleForm({ car, setCar }: VehicleFormProps) {
  const { setIsIdle } = useApplication() as any;

  const [plateQuery, setPlateQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("idle");

  const params = useParams<{ id: string; appId?: string }>();
  const workshopId = Number(params?.id);

  // Obleas disponibles (solo para modo "edit")
  const [stickerOptions, setStickerOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingStickers, setLoadingStickers] = useState(false);
  const [stickersError, setStickersError] = useState<string | null>(null);

  const effectivePlate = (car?.license_plate || plateQuery || "")
    .trim()
    .toUpperCase()
    .replace(/[-\s]/g, "");

  // Etiqueta a mostrar de la oblea actual (modo view)
  const currentStickerLabel = useMemo(() => {
    if (car?.sticker?.sticker_number) return String(car.sticker.sticker_number);
    if (car?.sticker_id) return `Oblea #${car.sticker_id}`;
    return "";
  }, [car?.sticker, car?.sticker_id]);

  // Cargar obleas disponibles (y asegurarnos de incluir la oblea actual si no viene en el listado)
  const loadStickers = async (plateOverride?: string) => {
    try {
      setLoadingStickers(true);
      setStickersError(null);
      const data = await fetchAvailableStickers({
        workshopId,
        currentCarId: car?.id,
        currentLicensePlate: plateOverride ?? (effectivePlate || undefined),
      });

      let options = data.map((s: any) => ({
        value: String(s.id),
        label: s.sticker_number ?? `Oblea ${s.id}`,
      }));

      // Si hay oblea actual, asegurar que esté en el select con su número
      if (car?.sticker_id) {
        const idStr = String(car.sticker_id);
        const exists = options.some((o: any) => o.value === idStr);
        if (!exists) {
          const label = car?.sticker?.sticker_number
            ? car.sticker.sticker_number
            : `Oblea ${idStr}`;
          options = [{ value: idStr, label }, ...options];
        }
      }

      setStickerOptions(options);
    } catch (e: any) {
      console.error(e);
      setStickerOptions([]);
      setStickersError("No se pudieron cargar las obleas disponibles.");
    } finally {
      setLoadingStickers(false);
    }
  };

  // Cargar obleas cuando no estamos en 'idle' (p.ej., en edit o luego de buscar)
  useEffect(() => {
    if (!workshopId) return;
    if (mode !== "idle") {
      loadStickers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workshopId, car?.id, car?.license_plate, mode]);

  // Si vino un auto con patente desde el padre o el endpoint, pasamos a vista
  useEffect(() => {
    if (car?.license_plate && mode === "idle") setMode("view");
  }, [car?.license_plate, mode]);

  const isReadOnly = mode === "view";

  const handleChange = (key: string, value: string) => {
    setCar((prev: any) => ({
      ...prev,
      [key]:
        key === "license_plate"
          ? value.toUpperCase()
          : key === "sticker_id"
          ? Number(value)
          : value,
    }));
  };

  useEffect(() => {
    setIsIdle(mode === "idle");
  }, [mode, setIsIdle]);

  const fetchVehicleByPlate = async () => {
    const plate = plateQuery.trim().toUpperCase();
    if (!plate) {
      setSearchError("Ingresá una patente válida.");
      return;
    }
    try {
      setIsSearching(true);
      setSearchError(null);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/vehicles/get-vehicle-data/${encodeURIComponent(plate)}`,
        { credentials: "include" }
      );

      if (res.status === 404) {
        // no existe → edición con campos vacíos y cargar obleas disponibles
        setCar((prev: any) => ({
          ...prev,
          license_plate: plate,
          sticker_id: undefined,
          sticker: undefined,
        }));
        setMode("edit");
        await loadStickers(plate);
        return;
      }

      if (!res.ok) {
        setSearchError("Ocurrió un error al buscar el vehículo.");
        return;
      }

      const data = await res.json(); // ya incluye sticker_id y (si aplica) sticker {}
      setCar((prev: any) => ({ ...prev, ...data }));
      setMode("view");
      await loadStickers(data.license_plate);
    } catch (e) {
      console.error(e);
      setSearchError("Ocurrió un error de red.");
    } finally {
      setIsSearching(false);
    }
  };

  // Pantalla de búsqueda previa
  if (mode === "idle") {
    return (
      <div className="min-h-full flex items-center justify-center px-6">
        <div className="space-y-6 mb-10 px-8 py-6 mt-12 w-full max-w-2xl bg-white rounded-lg">
          <div>
            <h2 className="text-xl font-regular text-[#000000] mb-1">Datos del vehículo</h2>
            <p className="text-md font-regular text-[#00000080]">
              Ingresá la patente para traer los datos del vehículo
            </p>
          </div>

          <div className="w-full">
            <label htmlFor="plate" className="block text-sm text-gray-700 mb-1">
              Patente
            </label>
            <div className="flex gap-3">
              <input
                id="plate"
                type="text"
                placeholder="Ej: AB123CD"
                className="flex-1 border border-[#DEDEDE] rounded-[10px] px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#0040B8] uppercase"
                value={plateQuery}
                onChange={(e) => setPlateQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    fetchVehicleByPlate();
                  }
                }}
                disabled={isSearching}
              />
              <button
                type="button"
                onClick={fetchVehicleByPlate}
                disabled={isSearching}
                className={`px-6 rounded-[6px] text-white bg-[#0040B8] hover:bg-[#0038a6] transition ${
                  isSearching ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSearching ? "Buscando..." : "Buscar"}
              </button>
            </div>
            {searchError && <p className="text-sm text-red-600 mt-3">{searchError}</p>}
            <p className="text-xs text-gray-500 mt-2">
              Si no se encuentra, podrás cargar los datos manualmente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-10 px-4 mt-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-regular text-[#000000] mb-1">Datos del vehículo</h2>
          {isReadOnly ? (
            <p className="text-sm text-[#00000080]">
              Vehículo encontrado, los campos están bloqueados, solo lectura.
            </p>
          ) : (
            <p className="text-sm text-[#00000080]">
              Vehículo no registrado, completá los datos para guardarlo.
            </p>
          )}
        </div>

        <button
          type="button"
          className="text-[#0040B8] border border-[#0040B8] rounded-[4px] px-3 py-2 text-sm hover:bg-[#0040B8] hover:text-white transition shrink-0"
          onClick={() => {
            setSearchError(null);
            setMode("idle");
            setIsIdle(true);
            setPlateQuery("");
            setCar({});
            setStickerOptions([]);
          }}
        >
          Buscar otra patente
        </button>
      </div>

      <fieldset disabled={isReadOnly} className={isReadOnly ? "opacity-95" : ""}>
        <div className="grid grid-cols-[1fr_1px_1fr] max-xl:grid-cols-1 gap-10 items-start">
          {/* Columna izquierda */}
          <div className="grid grid-cols-2 max-md:grid-cols-1 gap-x-6 gap-y-8 self-start">
            {formData1.map((field, index) =>
              field.options ? (
                <FormField
                  key={index}
                  label={field.label}
                  type="select"
                  options={field.options}
                  name={field.name}
                  isOwner={true}
                  value={
                    field.type === "date" && car?.[field.name]
                      ? new Date(car[field.name]).toISOString().slice(0, 10)
                      : car?.[field.name] ?? ""
                  }
                  onChange={(val) => handleChange(field.name, val)}
                />
              ) : (
                <FormField
                  key={index}
                  label={field.label}
                  placeholder={field.placeholder ?? ""}
                  type={field.type ?? "text"}
                  name={field.name}
                  isOwner={true}
                  value={
                    field.type === "date" && car?.[field.name]
                      ? new Date(car[field.name]).toISOString().slice(0, 10)
                      : car?.[field.name] ?? ""
                  }
                  onChange={(val) => handleChange(field.name, val)}
                />
              )
            )}
          </div>

          {/* Separador */}
          <div className="bg-[#dedede] w-px h-full max-xl:hidden" />

          {/* Columna derecha */}
          <div className="grid grid-cols-2 max-md:grid-cols-1 gap-x-6 gap-y-8">
            {formData2.map((field, index) =>
              field.options ? (
                <FormField
                  key={index}
                  label={field.label}
                  type="select"
                  options={field.options}
                  name={field.name}
                  isOwner={true}
                  value={
                    field.type === "date" && car?.[field.name]
                      ? new Date(car[field.name]).toISOString().slice(0, 10)
                      : car?.[field.name] ?? ""
                  }
                  onChange={(val) => handleChange(field.name, val)}
                />
              ) : (
                <FormField
                  key={index}
                  label={field.label}
                  placeholder={field.placeholder ?? ""}
                  type={field.type ?? "text"}
                  name={field.name}
                  isOwner={true}
                  value={
                    field.type === "date" && car?.[field.name]
                      ? new Date(car[field.name]).toISOString().slice(0, 10)
                      : car?.[field.name] ?? ""
                  }
                  onChange={(val) => handleChange(field.name, val)}
                />
              )
            )}

            {/* Oblea: vista vs edición */}
            {isReadOnly ? (
              <div className="col-span-1">
                <label className="block text-sm text-gray-700 mb-1">Oblea vinculada</label>
                <div className="flex flex-col justify-center gap-y-1 border border-[#DEDEDE] rounded-[10px] px-4 py-3 bg-gray-50">
                  {currentStickerLabel || "—"}
                  {car?.sticker?.expiration_date && (
                    <span className="text-xs text-gray-500">
                      (vence: {new Date(car.sticker.expiration_date).toLocaleDateString()})
                    </span>
                  )}
                  
                </div>
              </div>
            ) : (
              <FormField
                label="Vincular oblea"
                type="select"
                options={stickerOptions}
                name="sticker_id"
                isOwner={true}
                value={car?.sticker_id ? String(car.sticker_id) : ""}
                onChange={(val) => handleChange("sticker_id", val)}
                className="col-span-1"
              />
            )}

            {loadingStickers && <p className="text-xs text-gray-500">Cargando obleas...</p>}
            {!loadingStickers && !stickersError && stickerOptions.length === 0 && !isReadOnly && (
              <div className="text-xs text-gray-500">
                No hay obleas disponibles para este taller.{" "}
                <button type="button" className="text-[#0040B8] underline" onClick={() => loadStickers()}>
                  Reintentar
                </button>
              </div>
            )}
            {stickersError && <p className="text-xs text-red-600">{stickersError}</p>}

            <div />
          </div>
        </div>
      </fieldset>
    </div>
  );
}
