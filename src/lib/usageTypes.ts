export const USAGE_TYPE_OPTIONS = [
  { value: "A", label: "A - Oficial" },
  { value: "B", label: "B - Diplomático, Consular u Org. Internacional" },
  { value: "C", label: "C - Particular" },
  { value: "D", label: "D - De alquiler / alquiler con chofer (Taxi - Remis)" },
  { value: "E", label: "E - Transporte público de pasajeros" },
  { value: "E1", label: "E1 - Servicio internacional (regular y turismo); larga distancia y urbanos cat. M1, M2, M3" },
  { value: "E2", label: "E2 - Interjurisdiccional y jurisdiccional; regulares/turismo cat. M1, M2, M3" },
  { value: "F", label: "F - Transporte escolar" },
  { value: "G", label: "G - Cargas (generales/peligrosas), recolección, carretones, servicios industriales y trabajos sobre la vía pública" },
  { value: "H", label: "H - Emergencia, seguridad, fúnebres, remolque, maquinaria especial o agrícola y trabajos sobre la vía pública" },
];

export const TDF_USAGE_TYPE_D_LABEL = "D - De alquiler / con chofer (Taxi, Remis, STUPPE)";

/**
 * Resuelve el tipo de uso guardado en la base (puede venir como código "C"
 * o como etiqueta completa "C - Particular") a su código y descripción.
 * Devuelve null si el valor está vacío o no corresponde a un tipo conocido.
 */
export function getUsageType(raw?: string | null) {
  const value = (raw ?? "").toString().trim();
  if (!value) return null;

  const code = value.split("-")[0].trim().toUpperCase();
  const option = USAGE_TYPE_OPTIONS.find(
    (opt) => opt.value === value.toUpperCase() || opt.value === code
  );
  if (!option) return { code: value, description: "" };

  return {
    code: option.value,
    description: option.label.slice(option.value.length + 3),
  };
}
