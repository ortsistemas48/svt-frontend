// components/StickerStep.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useApplication } from "@/context/ApplicationContext";
import { useParams } from "next/navigation";

const PLATE_REGEX = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;

type Props = {
  workshopId: number;
  car: any;
  setCar: (car: any) => void;
};

export default function StickerStep({ workshopId, car, setCar }: Props) {
  const { errors, setErrors, setIsIdle } = useApplication() as any;
  const params = useParams();
  const appId = params.applicationId;

  const [plateQuery, setPlateQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [mode, setMode] = useState<"idle" | "result">("idle");
  const [vehicleFound, setVehicleFound] = useState<boolean | null>(null);
  const [obleaValue, setObleaValue] = useState("");

  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [availableHint, setAvailableHint] = useState<string | null>(null);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualPrefix, setManualPrefix] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [isAssigningManual, setIsAssigningManual] = useState(false);

  const fetchRef = useRef<{ id: number; ctrl?: AbortController }>({ id: 0 });
  const prevLicensePlateRef = useRef<string | undefined>(undefined);

  const setCarError = (name: string, msg: string) =>
    setErrors((prev: any) => ({ ...(prev || {}), [`car_${name}`]: msg }));

  useEffect(() => {
    return () => {
      if (fetchRef.current.ctrl) fetchRef.current.ctrl.abort();
      fetchRef.current.id++;
    };
  }, []);

  function safeMergeCar(prev: any, data: any) {
    const filtered = Object.fromEntries(
      Object.entries(data || {}).filter(([, v]) => v !== null && v !== undefined)
    );

    if (filtered.sticker && typeof filtered.sticker === "object") {
      filtered.sticker = Object.fromEntries(
        Object.entries(filtered.sticker).filter(([, v]) => v !== null && v !== undefined)
      );
    }

    const merged = { ...(prev || {}), ...filtered };
    
    // Explicitly clear sticker data if the new data doesn't have it
    // This prevents old sticker data from persisting when switching vehicles
    if (!filtered.sticker && !filtered.sticker_id && !filtered.oblea) {
      merged.sticker_id = undefined;
      merged.sticker = undefined;
    }

    return merged;
  }

  useEffect(() => {
    const hasSticker = !!(car?.sticker_id || car?.sticker?.id);
    const shouldBeIdle = mode !== "result" || !hasSticker;
    setIsIdle(shouldBeIdle);
    
    // Set error if in result mode but no sticker is selected
    if (mode === "result" && !hasSticker) {
      setCarError("sticker_id", "Debés seleccionar una oblea para continuar");
    } else {
      setCarError("sticker_id", "");
    }
  }, [mode, setIsIdle, car?.sticker_id, car?.sticker?.id, setErrors]);

  // Initialize plateQuery from car only on mount or when car.license_plate changes from external source
  useEffect(() => {
    const currentPlate = car?.license_plate;
    // Only sync if license_plate changed externally (not from user editing plateQuery)
    // We sync when: the plate value actually changed AND plateQuery is empty
    if (currentPlate && currentPlate !== prevLicensePlateRef.current && !plateQuery) {
      setPlateQuery(currentPlate);
    }
    // Only update ref when license_plate actually changes (to track external changes)
    if (currentPlate !== prevLicensePlateRef.current) {
      prevLicensePlateRef.current = currentPlate;
    }
    
    const v = car?.sticker?.sticker_number ?? car?.oblea ?? "";
    const expectedValue = v ? String(v) : "";
    // Sync obleaValue to match the current car's sticker status
    // Only update if the value is different to avoid unnecessary re-renders
    if (expectedValue !== obleaValue) {
      setObleaValue(expectedValue);
    }
  }, [car?.license_plate, plateQuery, car?.sticker, car?.sticker_id, car?.oblea, obleaValue]);

  const handlePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.toUpperCase().replace(/[-\s]/g, "");
    setPlateQuery(sanitized);
    
    // If user is editing after a search, reset the result state to allow new search
    if (mode === "result") {
      setMode("idle");
      setVehicleFound(null);
      setCar((prev: any) => ({
        ...(prev || {}),
        sticker_id: undefined,
        sticker: undefined,
      }));
      setObleaValue("");
      setAssignError(null);
      setAvailableHint(null);
    }
    
    if (!sanitized) {
      setCarError("license_plate", "");
      setSearchError(null);
      return;
    }
    if (!PLATE_REGEX.test(sanitized)) {
      setCarError("license_plate", "Formato inválido, usá ABC123, o AB123CD.");
    } else {
      setCarError("license_plate", "");
    }
  };

  const fetchAvailableHint = async () => {
    try {
      setAvailableHint(null);
      const r = await fetch(
        `/api/stickers/available?workshop_id=${workshopId}`,
        { credentials: "include" }
      );
      if (!r.ok) return;
      const list = await r.json();
      if (Array.isArray(list) && list.length > 0) {
        setAvailableHint(list[0]?.sticker_number || null);
      }
    } catch {}
  };

  const sanitizeStickerPart = (s: string) =>
    s.toUpperCase().replace(/[\s-_/\\.]/g, "");

  const fetchVehicleByPlate = async () => {
    const plate = plateQuery.trim().toUpperCase().replace(/[-\s]/g, "");
    if (!plate) {
      setSearchError("Ingresá un dominio válido.");
      return;
    }
    if (!PLATE_REGEX.test(plate)) {
      const msg = "Formato inválido, usá ABC123, o AB123CD.";
      setCarError("license_plate", msg);
      setSearchError(msg);
      return;
    }

    if (fetchRef.current.ctrl) fetchRef.current.ctrl.abort();
    const id = ++fetchRef.current.id;
    const ctrl = new AbortController();
    fetchRef.current.ctrl = ctrl;

    try {
      setIsSearching(true);
      setSearchError(null);
      setVehicleFound(null);
      // Clear sticker data when starting a new search
      setObleaValue("");
      setCar((prev: any) => {
        const updated = { ...(prev || {}) };
        if (updated.license_plate !== plate) {
          // Only clear sticker if it's a different plate
          updated.sticker_id = undefined;
          updated.sticker = undefined;
        }
        return updated;
      });

      const res = await fetch(
        `/api/vehicles/get-vehicle-data/${encodeURIComponent(plate)}`,
        {
          credentials: "include",
          signal: ctrl.signal,
        }
      );
      if (id !== fetchRef.current.id) return;

      if (res.status === 404) {
        // Limpiar por completo los datos del vehículo si no existe, dejando solo el dominio
        setCar({ 
          license_plate: plate,
        });
        setVehicleFound(false);
        setMode("result");
        setErrors((prev: any) => {
          if (!prev) return prev;
          const next: any = {};
          for (const k of Object.keys(prev))
            if (!k.startsWith("car_")) next[k] = prev[k];
          return next;
        });
        void fetchAvailableHint();
        return;
      }
      if (res.status === 400) {
        // Intentar obtener el mensaje de error específico del endpoint
        let errorMessage = "Ocurrió un error al buscar el vehículo.";
        try {
          const errorData = await res.json();
          if (errorData?.error && typeof errorData.error === "string") {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // Si no se puede parsear el JSON, usar el mensaje genérico
          console.error("Error al parsear respuesta de error:", e);
        }
        setSearchError(errorMessage);
        return;
      }

      const data = await res.json();
      setCar((prev: any) => safeMergeCar(prev, data));
      setObleaValue(String(data?.sticker?.sticker_number ?? data?.oblea ?? ""));
      setMode("result");
      void fetchAvailableHint();
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error(e);
        setSearchError("Ocurrió un error de red.");
      }
    } finally {
      if (id === fetchRef.current.id) setIsSearching(false);
    }
  };

  const handleAutoAssign = async () => {
    setAssignError(null);
    setIsAssigning(true);
    try {
      const plate = (
        car?.license_plate ||
        plateQuery ||
        ""
      )
        .trim()
        .toUpperCase();
      if (!plate || !PLATE_REGEX.test(plate)) {
        setAssignError("Dominio inválido, corregilo e intentá otra vez.");
        return;
      }

      const avRes = await fetch(
        `/api/stickers/available?workshop_id=${workshopId}`,
        { credentials: "include" }
      );
      if (!avRes.ok) {
        setAssignError("No se pudieron consultar las obleas disponibles.");
        return;
      }
      const list = await avRes.json();
      if (!Array.isArray(list) || list.length === 0) {
        setAssignError("No hay obleas disponibles en el taller.");
        return;
      }

      const pick = list[0];
      const asRes = await fetch(`/api/stickers/assign-to-car`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_plate: plate,
          sticker_id: pick.id,
          workshop_id: workshopId,
        }),
      });
      if (!asRes.ok) {
        const j = await asRes.json().catch(() => ({}));
        setAssignError(j?.error || "No se pudo asignar la oblea.");
        return;
      }

      setCar((prev: any) => ({
        ...(prev || {}),
        license_plate: plate,
        sticker_id: pick.id,
        sticker: { id: pick.id, sticker_number: pick.sticker_number },
      }));
      setObleaValue(String(pick.sticker_number || ""));
    } catch (e) {
      console.error(e);
      setAssignError("Ocurrió un error asignando la oblea.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async () => {
    setAssignError(null);
    setIsAssigning(true);
    try {
      const plate = (
        car?.license_plate ||
        plateQuery ||
        ""
      )
        .trim()
        .toUpperCase();
      if (!plate) return;

      const res = await fetch(`/api/stickers/unassign-from-car`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_plate: plate, set_available: false }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setAssignError(j?.error || "No se pudo quitar la oblea.");
        return;
      }

      setCar((prev: any) => ({
        ...(prev || {}),
        sticker_id: null,
        sticker: undefined,
      }));
      setObleaValue("");
    } catch (e) {
      console.error(e);
      setAssignError("Ocurrió un error quitando la oblea.");
    } finally {
      setIsAssigning(false);
    }
  };

  function buildStickerFromParts(prefixRaw: string, codeRaw: string) {
    const prefix = sanitizeStickerPart(prefixRaw);
    const code = codeRaw.replace(/\D/g, ""); // sólo dígitos
    return prefix + code;
  }

  const handleManualAssign = async () => {
    setManualError(null);
    setAssignError(null);
    setIsAssigningManual(true);

    try {
      const plate = (
        car?.license_plate ||
        plateQuery ||
        ""
      )
        .trim()
        .toUpperCase();

      if (!plate || !PLATE_REGEX.test(plate)) {
        setManualError("Dominio inválido, corregilo e intentá otra vez.");
        return;
      }

      const cleanedCode = manualCode.replace(/\D/g, "");
      if (!cleanedCode) {
        setManualError("Ingresá el código numérico de la oblea.");
        return;
      }

      const finalSticker = buildStickerFromParts(
        manualPrefix,
        manualCode
      );

      const res = await fetch(`/api/stickers/assign-by-number`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          license_plate: plate,
          workshop_id: workshopId,
          sticker_number: finalSticker,
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setManualError(j?.error || "No se pudo asignar la oblea ingresada.");
        return;
      }

      const j = await res.json();
      setCar((prev: any) => ({
        ...(prev || {}),
        license_plate: plate,
        sticker_id: j?.sticker_id,
        sticker: { id: j?.sticker_id, sticker_number: j?.sticker_number },
      }));
      setObleaValue(String(j?.sticker_number || ""));

      setManualOpen(false);
      setManualPrefix("");
      setManualCode("");
    } catch (e) {
      console.error(e);
      setManualError("Ocurrió un error asignando la oblea.");
    } finally {
      setIsAssigningManual(false);
    }
  };

  const plateErr = errors?.car_license_plate;
  const disableSearch = isSearching || Boolean(plateErr);

  return (
    <div className="min-h-full flex items-center justify-center px-1 sm:px-4 md:px-6">
      <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-10 px-3 sm:px-6 md:px-8 py-4 sm:py-6 mt-4 sm:mt-8 md:mt-12 w-full max-w-2xl bg-white rounded-lg sm:rounded-[14px]">
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-regular text-[#000000] mb-1">
            Oblea del vehículo
          </h2>
          <p className="text-xs sm:text-sm md:text-base font-regular text-[#00000080]">
            Ingresá el dominio, luego elegí autoasignar la primera disponible
            del taller, o asignar una oblea manualmente escribiendo su número.
          </p>
        </div>

        <div className="w-full">
          <label
            htmlFor="plate"
            className="block text-xs sm:text-sm text-gray-700 mb-1"
          >
            Dominio
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="plate"
              type="text"
              placeholder="Ej: ABC123, o AB123CD"
              className={`flex-1 border rounded-[4px] px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 uppercase ${
                plateErr
                  ? "border-red-400 focus:ring-red-500"
                  : "border-[#DEDEDE] focus:ring-[#0040B8]"
              }`}
              value={plateQuery}
              onChange={handlePlateChange}
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
              disabled={disableSearch}
              className={`w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 rounded-[4px] text-xs sm:text-sm md:text-base text-white bg-[#0040B8] hover:bg-[#0038a6] transition ${
                disableSearch ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSearching ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {plateErr && (
            <p className="text-xs sm:text-sm text-red-600 mt-2 sm:mt-3">{plateErr}</p>
          )}
          {!plateErr && searchError && (
            <p className="text-xs sm:text-sm text-red-600 mt-2 sm:mt-3">{searchError}</p>
          )}
        </div>

        {mode === "result" && (
          <div className="mt-4 sm:mt-6 border rounded-lg sm:rounded-[14px] p-3 sm:p-4 space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold">Resultado</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-gray-500">Dominio: </span>
                <span className="font-medium">
                  {car?.license_plate || plateQuery}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Marca: </span>
                <span className="font-medium">
                  {car?.brand || "Vacio"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Modelo: </span>
                <span className="font-medium">
                  {car?.model || "Vacio"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">CRT/CNI: </span>
                <span className="font-medium">
                  {appId || "Vacio"}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <label
                htmlFor="oblea"
                className="block text-xs sm:text-sm text-gray-700 mb-1"
              >
                Oblea actual
              </label>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                <input
                  id="oblea"
                  type="text"
                  placeholder="Ej: ABC123456"
                  className="flex-1 w-full sm:min-w-[180px] border border-[#DEDEDE] rounded-[4px] px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 text-gray-700 cursor-not-allowed"
                  value={obleaValue}
                  onChange={(e) => setObleaValue(e.target.value)}
                  readOnly
                  disabled
                />

                {!car?.sticker_id && (
                  <button
                    type="button"
                    onClick={handleAutoAssign}
                    disabled={isAssigning}
                    className="w-full sm:w-auto px-3 py-2 rounded-[4px] text-xs sm:text-sm text-white bg-[#0040B8] hover:bg-[#024bd4] disabled:opacity-60 transition duration-150"
                  >
                    {isAssigning ? "Asignando..." : "Autoasignar"}
                  </button>
                )}

                {!!car?.sticker_id && (
                  <button
                    type="button"
                    onClick={handleUnassign}
                    disabled={isAssigning}
                    className="w-full sm:w-auto px-3 py-2 rounded-[4px] text-xs sm:text-sm text-[#d91e1e] transition duration-150 border border-[#d91e1e] hover:bg-[#d91e1e] hover:text-white disabled:opacity-60"
                  >
                    Quitar
                  </button>
                )}
              </div>

              {availableHint && !car?.sticker_id && (
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Se asignará la primera oblea disponible: {availableHint}
                </p>
              )}

              {assignError && (
                <p className="text-[10px] sm:text-xs text-red-600 mt-1">{assignError}</p>
              )}

              {errors?.car_sticker_id && (
                <p className="text-xs sm:text-sm text-red-600 mt-1 font-medium">
                  {errors.car_sticker_id}
                </p>
              )}

              <div className="mt-4 sm:mt-5 border-t border-gray-200 pt-4 sm:pt-5 w-full">
                <button
                  type="button"
                  onClick={() => setManualOpen((v) => !v)}
                  className="text-xs sm:text-sm font-medium text-[#0040B8] hover:text-[#0038a6] transition-colors flex items-center gap-1"
                >
                  {manualOpen ? (
                    <>
                      <span>▼</span>
                      <span>Ocultar asignación manual</span>
                    </>
                  ) : (
                    <>
                      <span>▶</span>
                      <span>Asignación manual</span>
                    </>
                  )}
                </button>

                {manualOpen && (
                  <div className="mt-4 sm:mt-5 p-4 sm:p-5 bg-gray-50 rounded-lg sm:rounded-[10px] border border-gray-200 space-y-4">
                    <div>
                      <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                        Número de oblea
                      </label>
                      <p className="text-xs sm:text-sm text-gray-600 mb-4">
                        Ingresá el prefijo (opcional) y el código numérico de la oblea.
                      </p>
                    </div>

                    <div className="bg-white p-3 sm:p-4 rounded-[6px] border border-gray-200 mb-4">
                      <div className="text-[10px] sm:text-xs text-gray-500 mb-1">
                        Vista previa:
                      </div>
                      <div className="text-sm sm:text-base font-mono font-semibold text-gray-800">
                        {sanitizeStickerPart(manualPrefix) +
                          manualCode.replace(/\D/g, "") || "—"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Prefijo <span className="text-gray-400 font-normal">(opcional)</span>
                        </label>
                        <input
                          type="text"
                          value={manualPrefix}
                          onChange={(e) =>
                            setManualPrefix(e.target.value.toUpperCase())
                          }
                          className="border rounded-[6px] px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#0040B8] border-[#DEDEDE] transition-all"
                          placeholder="Ej: ABC"
                          maxLength={10}
                        />
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                          Letras y números, se convertirá a mayúsculas
                        </p>
                      </div>

                      <div className="flex flex-col">
                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-2">
                          Código <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={manualCode}
                          onChange={(e) =>
                            setManualCode(e.target.value.replace(/\D/g, ""))
                          }
                          className={`border rounded-[6px] px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 transition-all ${
                            manualError
                              ? "border-red-400 focus:ring-red-500"
                              : "border-[#DEDEDE] focus:ring-[#0040B8]"
                          }`}
                          placeholder="Ej: 001234"
                          maxLength={20}
                        />
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                          Solo números, requerido
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleManualAssign}
                        disabled={isAssigningManual}
                        className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-[6px] text-xs sm:text-sm font-medium text-white bg-[#0040B8] hover:bg-[#0038a6] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 shadow-sm hover:shadow"
                      >
                        {isAssigningManual
                          ? "Asignando oblea..."
                          : !!car?.sticker_id
                          ? "Reemplazar oblea"
                          : "Asignar oblea"}
                      </button>
                    </div>

                    {manualError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-[6px]">
                        <p className="text-xs sm:text-sm text-red-600 font-medium">
                          {manualError}
                        </p>
                      </div>
                    )}

                    {!manualError && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-[6px]">
                        <p className="text-xs sm:text-sm text-blue-700">
                          <strong>Nota:</strong> El prefijo es opcional. El código debe tener al menos un número.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
