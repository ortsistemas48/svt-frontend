"use client";

import React, { useCallback, useEffect, useMemo, useState, useDeferredValue } from "react";
import { ChevronRight, Pencil, Search, CheckSquare, XCircle } from "lucide-react";
import { getProvinces, getLocalidadesByProvincia, apiFetch } from "@/utils";

type Option = { value: string; label: string; key: string };

type UsageType = { value: string; label: string };

const USAGE_TYPES: UsageType[] = [
  { value: "A", label: "A - Oficial" },
  { value: "B", label: "B - Diplomático, Consular u Org. Internacional" },
  { value: "C", label: "C - Particular" },
  { value: "D", label: "D - De alquiler / alquiler con chofer (Taxi - Remis)" },
  { value: "E", label: "E - Transporte público de pasajeros" },
  { value: "E1", label: "E1 - Servicio internacional; larga distancia/urbanos M1-M3" },
  { value: "E2", label: "E2 - Inter/Jurisdiccional; regulares/turismo M1-M3" },
  { value: "F", label: "F - Transporte escolar" },
  { value: "G", label: "G - Cargas / servicios / trabajos vía pública" },
  { value: "H", label: "H - Emergencia/seguridad/fúnebres/remolque/maquinaria" },
];

type AgeBands = {
  up_to_36: number | "";
  from_3_to_7: number | "";
  over_7: number | "";
};

type ValidityByUsage = Record<string, AgeBands>; // key: usage value (A, B, ...)

async function fetchValidity(provinceValue: string, localidadKey: string): Promise<ValidityByUsage> {
  const url = `/api/inspection_validity/${encodeURIComponent(provinceValue)}/${encodeURIComponent(localidadKey)}`;
  try {
    const res = await apiFetch(url, { method: "GET" });
    if (!res.ok) return {} as ValidityByUsage;
    const data = await res.json();
    return data as ValidityByUsage;
  } catch {
    return {} as ValidityByUsage;
  }
}

export default function InspectionValidityPage() {
  const [provinces, setProvinces] = useState<Option[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Option | null>(null);
  const [localidades, setLocalidades] = useState<Option[]>([]);
  const [selectedLocalidad, setSelectedLocalidad] = useState<Option | null>(null);

  const [validity, setValidity] = useState<ValidityByUsage>({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const [bulk, setBulk] = useState<AgeBands>({ up_to_36: "", from_3_to_7: "", over_7: "" });
  // Lote por localidades
  const [selectedLocalidades, setSelectedLocalidades] = useState<Record<string, boolean>>({});
  const [bulkLoc, setBulkLoc] = useState<AgeBands>({ up_to_36: "", from_3_to_7: "", over_7: "" });
  const selectedLocCount = useMemo(() => Object.values(selectedLocalidades).filter(Boolean).length, [selectedLocalidades]);
  const [locSearch, setLocSearch] = useState("");
  const deferredSearch = useDeferredValue(locSearch);
  const filteredLocalidades = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return localidades;
    return localidades.filter(l => l.label.toLowerCase().includes(q));
  }, [localidades, deferredSearch]);
  const selectedVisibleCount = useMemo(() => filteredLocalidades.reduce((acc, l) => acc + (selectedLocalidades[l.key] ? 1 : 0), 0), [filteredLocalidades, selectedLocalidades]);
  const visibleCount = filteredLocalidades.length;
  const allVisibleSelected = visibleCount > 0 && selectedVisibleCount === visibleCount;
  const totalCount = localidades.length;
  const allSelected = totalCount > 0 && selectedLocCount === totalCount;

  // Filtro por tipo de uso para lote de localidades (ALL = todos)
  const [bulkLocUsage, setBulkLocUsage] = useState<"ALL" | UsageType["value"]>("ALL");

  useEffect(() => {
    getProvinces().then(setProvinces);
  }, []);

  useEffect(() => {
    if (!selectedProvince) return;
    setSelectedLocalidad(null);
    setSavedMsg(null);
    getLocalidadesByProvincia(selectedProvince.value).then(setLocalidades);
    setSelectedLocalidades({});
    setBulkLoc({ up_to_36: "", from_3_to_7: "", over_7: "" });
  }, [selectedProvince]);

  useEffect(() => {
    if (!selectedProvince || !selectedLocalidad) return;
    (async () => {
      const next = await fetchValidity(selectedProvince.value, selectedLocalidad.key);
      const filled: ValidityByUsage = { ...next };
      USAGE_TYPES.forEach(({ value }) => {
        if (!filled[value]) filled[value] = { up_to_36: "", from_3_to_7: "", over_7: "" };
      });
      Object.keys(filled).forEach((k) => {
        const r = filled[k] as any;
        if (r) {
          r.up_to_36 = r.up_to_36 == null ? "" : r.up_to_36;
          r.from_3_to_7 = r.from_3_to_7 == null ? "" : r.from_3_to_7;
          r.over_7 = r.over_7 == null ? "" : r.over_7;
        }
      });
      setValidity(filled);
      setSavedMsg(null);
    })();
  }, [selectedProvince, selectedLocalidad]);

  const canSave = useMemo(() => !!selectedProvince && !!selectedLocalidad, [selectedProvince, selectedLocalidad]);

  const applyBulkToAll = () => {
    setValidity(prev => {
      const next: ValidityByUsage = { ...prev };
      USAGE_TYPES.forEach(({ value }) => {
        const row = next[value] ?? { up_to_36: "", from_3_to_7: "", over_7: "" };
        next[value] = {
          up_to_36: bulk.up_to_36 !== "" ? bulk.up_to_36 : row.up_to_36,
          from_3_to_7: bulk.from_3_to_7 !== "" ? bulk.from_3_to_7 : row.from_3_to_7,
          over_7: bulk.over_7 !== "" ? bulk.over_7 : row.over_7,
        };
      });
      return next;
    });
  };

  const handleChange = (usage: string, field: keyof AgeBands, val: string) => {
    const intVal = val === "" ? "" : Math.max(0, Math.min(120, Number(val) || 0));
    setValidity(prev => ({
      ...prev,
      [usage]: { ...prev[usage], [field]: intVal },
    }));
  };

  const handleSave = async () => {
    if (!selectedProvince || !selectedLocalidad) return;
    setSaving(true);
    setSavedMsg(null);
    try {
      const payload: Record<string, { up_to_36: number | null; from_3_to_7: number | null; over_7: number | null }> = {};
      USAGE_TYPES.forEach(({ value }) => {
        const row = validity[value] ?? { up_to_36: "", from_3_to_7: "", over_7: "" };
        payload[value] = {
          up_to_36: row.up_to_36 === "" ? null : Number(row.up_to_36),
          from_3_to_7: row.from_3_to_7 === "" ? null : Number(row.from_3_to_7),
          over_7: row.over_7 === "" ? null : Number(row.over_7),
        };
      });

      const res = await apiFetch(
        `/api/inspection_validity/${encodeURIComponent(selectedProvince.value)}/${encodeURIComponent(selectedLocalidad.key)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: payload }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      setSavedMsg("Guardado correctamente");
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(null), 2000);
    }
  };

  const toggleSelectAllLocalidades = (checked: boolean) => {
    const next: Record<string, boolean> = { ...selectedLocalidades };
    filteredLocalidades.forEach(l => { next[l.key] = checked; });
    setSelectedLocalidades(next);
  };

  const toggleSelectAllLocalidadesAll = (checked: boolean) => {
    const next: Record<string, boolean> = { ...selectedLocalidades };
    localidades.forEach(l => { next[l.key] = checked; });
    setSelectedLocalidades(next);
  };

  const clearAllSelections = () => setSelectedLocalidades({});

  const handleToggleRow = useCallback((key: string, checked: boolean) => {
    setSelectedLocalidades(prev => ({ ...prev, [key]: checked }));
  }, []);

  const handleEditRow = useCallback((opt: Option) => {
    setSelectedLocalidad(opt);
  }, []);

  const applyAndSaveBulkToSelectedLocalidades = async () => {
    if (!selectedProvince) return;
    const hasAny = selectedLocCount > 0;
    if (!hasAny) return;
    setSaving(true);
    setSavedMsg(null);
    try {
      const selectedKeys = localidades.filter(l => selectedLocalidades[l.key]).map(l => l.key);
      const values: Record<string, number> = {};
      if (bulkLoc.up_to_36 !== "") values.up_to_36 = Number(bulkLoc.up_to_36);
      if (bulkLoc.from_3_to_7 !== "") values.from_3_to_7 = Number(bulkLoc.from_3_to_7);
      if (bulkLoc.over_7 !== "") values.over_7 = Number(bulkLoc.over_7);

      const res = await apiFetch(
        `/api/inspection_validity/${encodeURIComponent(selectedProvince.value)}/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            localidad_keys: selectedKeys,
            values,
            usage_codes: bulkLocUsage === "ALL" ? undefined : [bulkLocUsage]
          }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      setSavedMsg(`Guardado en ${selectedLocCount} localidad(es)`);
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMsg(null), 2500);
    }
  };

  return (
    <div className="min-w-full">
      <article className="flex items-center justify-between text-xs sm:text-sm md:text-base lg:text-lg mb-3 sm:mb-4 md:mb-6 px-1 sm:px-2 md:px-4">
        <div className="flex items-center gap-1">
          <span className="text-gray-600">Inicio</span>
          <ChevronRight size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
          <span className="text-[#0040B8]">Validez CRT</span>
        </div>
      </article>

      {!selectedProvince && (
        <section className="px-1 sm:px-2">
          <div className="flex flex-col items-center gap-1 sm:gap-2 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl text-[#0040B8] text-center">Provincias</h2>
            <p className="text-xs sm:text-sm text-gray-500 text-center px-2 sm:px-4">Elegí una provincia para configurar la validez por jurisdicción.</p>
          </div>
          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {provinces.map((p) => (
              <button
                key={p.key}
                className="text-left rounded-[4px] border border-slate-200 bg-white hover:bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 shadow-sm"
                onClick={() => setSelectedProvince(p)}
              >
                <p className="text-sm sm:text-base font-medium">{p.label}</p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">Configurar localidades</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedProvince && !selectedLocalidad && (
        <section className="px-1 sm:px-2">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <button
                className="text-xs sm:text-sm text-[#0040B8] hover:underline"
                onClick={() => setSelectedProvince(null)}
              >
                Volver a provincias
              </button>
              <span className="text-slate-400 text-xs sm:text-sm">/</span>
              <span className="text-xs sm:text-sm text-slate-700 truncate">{selectedProvince.label}</span>
            </div>
          </div>

      <div className="rounded-lg sm:rounded-[14px] border border-slate-200 bg-white p-3 sm:p-4">
        {/* Controles superiores */}
        <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2 w-full md:w-[460px]">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar localidad..."
                value={locSearch}
                onChange={(e) => setLocSearch(e.target.value)}
                className="w-full pl-7 sm:pl-8 pr-2 sm:pr-3 py-1.5 sm:py-2 border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                aria-label="Buscar localidad"
              />
            </div>
            <span className="hidden md:inline px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">{selectedLocCount} seleccionadas de {totalCount}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="md:hidden px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">{selectedLocCount} de {totalCount}</span>
            <button
              className={`inline-flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 rounded-[4px] border ${allSelected ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-blue-50 border-blue-200 text-blue-700'} hover:bg-blue-100 disabled:opacity-60`}
              onClick={() => toggleSelectAllLocalidadesAll(!allSelected)}
              disabled={totalCount === 0}
              aria-label={allSelected ? 'Desmarcar todas las localidades' : 'Marcar todas las localidades'}
              title={allSelected ? 'Desmarcar todas las localidades' : 'Marcar todas las localidades'}
            >
              <CheckSquare size={12} className="sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">{allSelected ? `Desmarcar todas (${totalCount})` : `Marcar todas (${totalCount})`}</span>
              <span className="sm:hidden">{allSelected ? `Desmarcar` : `Marcar todas`}</span>
            </button>
            <button
              className="inline-flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs px-2 sm:px-3 py-1.5 sm:py-2 rounded-[4px] border hover:bg-slate-50 disabled:opacity-60"
              onClick={clearAllSelections}
              disabled={selectedLocCount === 0}
              aria-label="Quitar todas las selecciones"
              title="Quitar todas las selecciones"
            >
              <XCircle size={12} className="sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Quitar todas</span>
              <span className="sm:hidden">Quitar</span>
            </button>
          </div>
        </div>

        {/* Barra compacta de edición por lote */}
        <div className="mb-2 sm:mb-3 space-y-2 sm:space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[minmax(0,220px)_minmax(0,220px)_minmax(0,220px)_minmax(0,220px)_auto] gap-2 sm:gap-3 items-end">
            <div>
              <label className="block text-[10px] sm:text-xs text-slate-600 mb-1">Tipo de uso</label>
              <select
                value={bulkLocUsage}
                onChange={(e) => setBulkLocUsage(e.target.value as any)}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              >
                <option value="ALL">Todos</option>
                {USAGE_TYPES.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs text-slate-600 mb-1">Hasta 36 meses</label>
              <input
                type="number"
                min={0}
                max={120}
                value={bulkLoc.up_to_36 as any}
                onChange={(e) => setBulkLoc(b => ({ ...b, up_to_36: e.target.value === "" ? "" : Number(e.target.value) }))}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs text-slate-600 mb-1">De 3 a 7 años</label>
              <input
                type="number"
                min={0}
                max={120}
                value={bulkLoc.from_3_to_7 as any}
                onChange={(e) => setBulkLoc(b => ({ ...b, from_3_to_7: e.target.value === "" ? "" : Number(e.target.value) }))}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-xs text-slate-600 mb-1">Más de 7 años</label>
              <input
                type="number"
                min={0}
                max={120}
                value={bulkLoc.over_7 as any}
                onChange={(e) => setBulkLoc(b => ({ ...b, over_7: e.target.value === "" ? "" : Number(e.target.value) }))}
                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 md:justify-end sm:col-span-2 md:col-span-1">
              <button
                onClick={applyAndSaveBulkToSelectedLocalidades}
                disabled={selectedLocCount === 0 || saving}
                className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-[4px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 text-xs sm:text-sm"
              >
                {saving ? "Guardando..." : `Aplicar y guardar (${selectedLocCount})`}
              </button>
              <button
                onClick={() => setBulkLoc({ up_to_36: "", from_3_to_7: "", over_7: "" })}
                className="w-full sm:w-auto px-3 py-1.5 sm:py-2 rounded-[4px] border text-xs sm:text-sm"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
        {savedMsg && (
          <div className="mb-2 sm:mb-3 text-xs sm:text-sm text-green-600">{savedMsg}</div>
        )}

        {/* Lista de localidades */}
        <div className="max-h-[50vh] sm:max-h-[60vh] overflow-auto divide-y">
          {filteredLocalidades.map((l) => (
            <LocalidadRow
              key={l.key}
              option={l}
              selected={!!selectedLocalidades[l.key]}
              onToggle={handleToggleRow}
              onEdit={handleEditRow}
            />
          ))}
        </div>
      </div>
        </section>
      )}

      {selectedProvince && selectedLocalidad && (
        <section className="space-y-4 sm:space-y-5 md:space-y-6 px-1 sm:px-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
              <button
                className="text-xs sm:text-sm text-[#0040B8] hover:underline"
                onClick={() => setSelectedLocalidad(null)}
              >
                Volver a localidades
              </button>
              <span className="text-slate-400 text-xs sm:text-sm">/</span>
              <button
                className="text-xs sm:text-sm text-[#0040B8] hover:underline"
                onClick={() => setSelectedProvince(null)}
              >
                Provincias
              </button>
              <span className="text-slate-400 text-xs sm:text-sm">/</span>
              <span className="text-xs sm:text-sm text-slate-700 truncate">{selectedProvince.label} / {selectedLocalidad.label}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 sm:gap-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl text-[#0040B8] text-center">Validez por tipo de uso</h2>
            <p className="text-xs sm:text-sm text-gray-500 text-center px-2 sm:px-4">Definí la cantidad de meses aptos por franja etaria del vehículo.</p>
          </div>

          <div className="rounded-lg sm:rounded-[14px] border border-slate-200 p-3 sm:p-4 bg-white">
            <div className="mb-3 sm:mb-4 flex flex-col gap-2 sm:gap-3">
              <p className="text-xs sm:text-sm font-medium">Edición por lote</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 items-end">
                <div>
                  <label className="block text-[10px] sm:text-xs text-slate-600 mb-1">Hasta 36 meses</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={bulk.up_to_36 as any}
                    onChange={(e) => setBulk(b => ({ ...b, up_to_36: e.target.value === "" ? "" : Number(e.target.value) }))}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs text-slate-600 mb-1">De 3 a 7 años</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={bulk.from_3_to_7 as any}
                    onChange={(e) => setBulk(b => ({ ...b, from_3_to_7: e.target.value === "" ? "" : Number(e.target.value) }))}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-xs text-slate-600 mb-1">Más de 7 años</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={bulk.over_7 as any}
                    onChange={(e) => setBulk(b => ({ ...b, over_7: e.target.value === "" ? "" : Number(e.target.value) }))}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:col-span-2 md:col-span-1">
                  <button
                    onClick={applyBulkToAll}
                    className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-[4px] bg-blue-600 text-white hover:bg-blue-700 text-xs sm:text-sm"
                  >
                    Aplicar a todos
                  </button>
                  <button
                    onClick={() => setBulk({ up_to_36: "", from_3_to_7: "", over_7: "" })}
                    className="w-full sm:w-auto px-3 py-1.5 sm:py-2 rounded-[4px] border text-xs sm:text-sm"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-auto">
              {/* Tabla desktop */}
              <div className="hidden md:block">
                <table className="min-w-full border border-slate-200 rounded-[4px] overflow-hidden">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left text-xs sm:text-sm font-medium text-slate-700 px-2 sm:px-3 py-1.5 sm:py-2 border-b">Tipo de uso</th>
                      <th className="text-left text-xs sm:text-sm font-medium text-slate-700 px-2 sm:px-3 py-1.5 sm:py-2 border-b">Hasta 36 meses</th>
                      <th className="text-left text-xs sm:text-sm font-medium text-slate-700 px-2 sm:px-3 py-1.5 sm:py-2 border-b">De 3 a 7 años</th>
                      <th className="text-left text-xs sm:text-sm font-medium text-slate-700 px-2 sm:px-3 py-1.5 sm:py-2 border-b">Más de 7 años</th>
                    </tr>
                  </thead>
                  <tbody>
                    {USAGE_TYPES.map(({ value, label }) => {
                      const row = validity[value] ?? { up_to_36: "", from_3_to_7: "", over_7: "" };
                      return (
                        <tr key={value} className="odd:bg-white even:bg-slate-50/50">
                          <td className="px-2 sm:px-3 py-1.5 sm:py-2 border-b align-middle">
                            <span className="text-xs sm:text-sm">{label}</span>
                          </td>
                          <td className="px-2 sm:px-3 py-1.5 sm:py-2 border-b">
                            <input
                              type="number"
                              min={0}
                              max={120}
                              value={row.up_to_36 as any}
                              onChange={(e) => handleChange(value, "up_to_36", e.target.value)}
                              className="w-24 sm:w-28 px-2 py-1 sm:py-1.5 border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            />
                          </td>
                          <td className="px-2 sm:px-3 py-1.5 sm:py-2 border-b">
                            <input
                              type="number"
                              min={0}
                              max={120}
                              value={row.from_3_to_7 as any}
                              onChange={(e) => handleChange(value, "from_3_to_7", e.target.value)}
                              className="w-24 sm:w-28 px-2 py-1 sm:py-1.5 border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            />
                          </td>
                          <td className="px-2 sm:px-3 py-1.5 sm:py-2 border-b">
                            <input
                              type="number"
                              min={0}
                              max={120}
                              value={row.over_7 as any}
                              onChange={(e) => handleChange(value, "over_7", e.target.value)}
                              className="w-24 sm:w-28 px-2 py-1 sm:py-1.5 border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards mobile/tablet */}
              <div className="md:hidden space-y-3">
                {USAGE_TYPES.map(({ value, label }) => {
                  const row = validity[value] ?? { up_to_36: "", from_3_to_7: "", over_7: "" };
                  return (
                    <div key={value} className="border border-slate-200 rounded-lg p-3 space-y-3">
                      <div className="font-medium text-xs sm:text-sm text-slate-700 pb-2 border-b border-slate-200">
                        {label}
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="block text-[10px] sm:text-xs text-slate-600 mb-1">Hasta 36 meses</label>
                          <input
                            type="number"
                            min={0}
                            max={120}
                            value={row.up_to_36 as any}
                            onChange={(e) => handleChange(value, "up_to_36", e.target.value)}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs text-slate-600 mb-1">De 3 a 7 años</label>
                          <input
                            type="number"
                            min={0}
                            max={120}
                            value={row.from_3_to_7 as any}
                            onChange={(e) => handleChange(value, "from_3_to_7", e.target.value)}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] sm:text-xs text-slate-600 mb-1">Más de 7 años</label>
                          <input
                            type="number"
                            min={0}
                            max={120}
                            value={row.over_7 as any}
                            onChange={(e) => handleChange(value, "over_7", e.target.value)}
                            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-slate-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <button
                disabled={!canSave || saving}
                onClick={handleSave}
                className="w-full sm:w-auto px-4 sm:px-5 py-2 rounded-[4px] bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 text-xs sm:text-sm"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
              {savedMsg && <span className="text-xs sm:text-sm text-green-600">{savedMsg}</span>}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

type LocalidadRowProps = {
  option: Option;
  selected: boolean;
  onToggle: (key: string, checked: boolean) => void;
  onEdit: (opt: Option) => void;
};

const LocalidadRow = React.memo(function LocalidadRow({ option, selected, onToggle, onEdit }: LocalidadRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3 px-1 py-1.5 sm:py-2">
      <label className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onToggle(option.key, e.target.checked)}
          className="w-4 h-4 sm:w-5 sm:h-5"
        />
        <span className="text-xs sm:text-sm truncate">{option.label}</span>
      </label>
      <button
        className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs md:text-sm rounded-[4px] border border-slate-300 hover:bg-slate-50 flex-shrink-0"
        onClick={() => onEdit(option)}
        aria-label={`Editar esta localidad: ${option.label}`}
        title={`Editar esta localidad`}
      >
        <Pencil size={12} className="sm:w-3.5 sm:h-3.5 text-slate-600" />
        <span className="hidden sm:inline">Editar esta localidad</span>
        <span className="sm:hidden">Editar</span>
      </button>
    </div>
  );
}, (prev, next) => prev.selected === next.selected && prev.option.key === next.option.key && prev.option.label === next.option.label);


