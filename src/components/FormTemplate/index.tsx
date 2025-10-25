// components/FormTemplate.tsx
'use client';

import React, { useEffect, useRef, useState } from "react";
import Dropzone,  { type ExistingDoc } from "../Dropzone";
import { useApplication } from "@/context/ApplicationContext";

type Mode = "idle" | "view" | "edit";

type Option = { value: string; label: string };

type Field = {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;              // "text" | "email" | "date" | etc.
  options?: Option[];         // si existe => renderiza <select>
  disabled?: boolean;         // deshabilitado por campo
  className?: string;
};

type SearchConfig = {
  enabled: boolean;
  /** campo clave en 'data' (p.ej. "dni") para detectar si ya hay dato cargado */
  dataKey: string;
  /** etiqueta e input del buscador */
  fieldLabel: string;         // "DNI"
  placeholder?: string;       // "Ej: 39959950"
  inputType?: string;         // "text"
  /** sanitiza el input antes de validar/buscar */
  sanitize?: (raw: string) => string;
  /** devuelve string de error o null si es válido */
  validate?: (q: string) => string | null;
  /** construye la URL GET a consultar */
  buildUrl: (q: string) => string;
  /** parsea el payload -> data del formulario cuando EXISTE */
  mapFound: (payload: any, query: string) => Record<string, any>;
  /** data inicial cuando NO existe (p.ej. setear el DNI) */
  mapNotFound: (query: string) => Record<string, any>;
  /** HTTP status que indica "no encontrado" (default 404) */
  notFoundStatus?: number;
  /** textos */
  titleIdle?: string;         // Título en la vista de búsqueda
  descIdle?: string;          // Descripción en la vista de búsqueda
  searchButtonLabel?: string; // "Buscar"
  resetButtonLabel?: string;  // "Buscar otro DNI"
  /** Al resetear búsqueda (volver a idle), el FormTemplate llama esto */
  onReset?: () => void;
  /** Al cambiar de modo (view/edit), por si querés enterarte desde afuera */
  onModeChange?: (mode: Mode) => void;
};

type Props = {
  formData: Field[];
  applicationId: number;
  title?: string;
  description?: string;
  data: any;
  setData: (value: any) => void;
  showDropzone?: boolean;
  onPendingDocsChange?: (files: File[]) => void;
  existingDocuments?: ExistingDoc[];
  onDeleteExisting?: (docId: number) => Promise<void> | void;
  onChangeField?: (name: string, value: string) => void;
  onBlurField?: (name: string) => void;
  fieldErrors?: Record<string, string | undefined>;

  /** 🆕: configuración para habilitar la vista de búsqueda reutilizable */
  searchConfig?: SearchConfig;

  /** 🆕: modo inicial (si no hay búsqueda): por defecto 'edit' */
  defaultMode?: Mode;
};

// Helper para inputs type="date" (evita saltos por timezone)
const dateForInput = (v?: string) => {
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
};

export default function FormTemplate({
  formData,
  title,
  description,
  data,
  setData,
  showDropzone = false,
  onPendingDocsChange,
  existingDocuments = [],
  onDeleteExisting,
  onChangeField,
  onBlurField,
  fieldErrors = {},
  searchConfig,
  defaultMode = "edit",
}: Props) {
  // ----- Estado interno (modo + búsqueda) -----
  const [mode, setMode] = useState<Mode>(() => {
    if (searchConfig?.enabled) return "idle";
    return defaultMode;
  });
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const fetchRef = useRef<{ id: number; ctrl?: AbortController }>({ id: 0 });
  const { setIsIdle } = useApplication() as any;

  // Avisar a quien lo pida cuando cambia el modo
  useEffect(() => {
    searchConfig?.onModeChange?.(mode);
  }, [mode, searchConfig]);

  // Si ya viene el dataKey cargado en data, saltamos a "edit" (cuando search está activo)
  useEffect(() => {
    if (!searchConfig?.enabled) return;
    const val = data?.[searchConfig.dataKey];
    if (val && mode === "idle") setMode("edit");
  }, [searchConfig, data, mode]);

  useEffect(() => {
      if (title === "Datos del Titular") setIsIdle(mode === "idle");
    }, [mode, setIsIdle]);
  // ----- Handlers de campos -----
  const handleChange = (name: string, value: string) => {
    if (onChangeField) {
      onChangeField(name, value);
    } else {
      setData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  const handleBlur = (name: string) => {
    if (onBlurField) onBlurField(name);
  };

  // Dropzone simple (podés reemplazarlo por tu componente)
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onPendingDocsChange) return;
    const files = e.target.files ? Array.from(e.target.files) : [];
    onPendingDocsChange(files);
  };

  // ----- Búsqueda reusable -----
  const doSearch = async () => {
    if (!searchConfig?.enabled) return;

    const nfStatus = searchConfig.notFoundStatus ?? 404;

    const raw = query;
    const sanitized = (searchConfig.sanitize ?? ((s) => s))(raw);
    const err = searchConfig.validate ? searchConfig.validate(sanitized) : null;
    if (err) {
      setSearchError(err);
      return;
    }

    // cancelar request anterior (si sigue viva)
    if (fetchRef.current.ctrl) fetchRef.current.ctrl.abort();

    const id = ++fetchRef.current.id;
    const ctrl = new AbortController();
    fetchRef.current.ctrl = ctrl;

    try {
      setIsSearching(true);
      setSearchError(null);

      const url = searchConfig.buildUrl(sanitized);
      const res = await fetch(url, { credentials: "include", signal: ctrl.signal });

      // si llegó una respuesta vieja, ignoramos
      if (id !== fetchRef.current.id) return;

      if (res.status === nfStatus) {
        // No existe → pasamos a edit con data parcial (por ejemplo setear DNI)
        const partial = searchConfig.mapNotFound(sanitized) || {};
        setData((prev: any) => ({ ...prev, ...partial }));
        setMode("edit");
        return;
      }

      if (!res.ok) {
        setSearchError("Ocurrió un error al buscar.");
        return;
      }

      const payload = await res.json();
      const mapped = searchConfig.mapFound(payload, sanitized) || {};
      setData((prev: any) => ({ ...prev, ...mapped }));
      setMode("edit");
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error(e);
        setSearchError("Ocurrió un error de red.");
      }
    } finally {
      if (id === fetchRef.current.id) setIsSearching(false);
    }
  };

  const resetSearch = () => {
    // limpiar datos y errores si el parent lo desea
    searchConfig?.onReset?.();
    setQuery("");
    setSearchError(null);
    setMode("idle");
  };

  // ----- VISTA IDLE (búsqueda) -----
  if (searchConfig?.enabled && mode === "idle") {
    const disableSearch = isSearching;

    return (
      <section className="space-y-6 mb-10 py-6 mt-6 w-full max-w-2xl bg-white rounded-lg">
        {(searchConfig.titleIdle || searchConfig.descIdle) && (
          <header className="mb-2">
            {searchConfig.titleIdle && (
              <h2 className="text-xl font-regular text-[#000000] mb-1">
                {searchConfig.titleIdle}
              </h2>
            )}
            {searchConfig.descIdle && (
              <p className="text-sm text-[#00000080]">{searchConfig.descIdle}</p>
            )}
          </header>
        )}

        <div className="w-full max-w-2xl">
          <label htmlFor="search-input" className="block text-sm text-gray-700 mb-1">
            {searchConfig.fieldLabel}
          </label>
          <div className="flex gap-3">
            <input
              id="search-input"
              type={searchConfig.inputType ?? "text"}
              placeholder={searchConfig.placeholder ?? ""}
              className={`flex-1 border rounded-[4px] px-4 py-3 text-base focus:outline-none focus:ring-2 border-[#DEDEDE] focus:ring-[#0040B8]`}
              value={query}
              onChange={(e) => {
                const raw = e.target.value;
                const sanitized = (searchConfig.sanitize ?? ((s) => s))(raw);
                setQuery(sanitized);
                // limpiar error mientras se escribe
                if (searchError) setSearchError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  doSearch();
                }
              }}
              disabled={isSearching}
            />
            <button
              type="button"
              onClick={doSearch}
              disabled={disableSearch}
              className={`px-6 rounded-[6px] text-white bg-[#0040B8] hover:bg-[#0038a6] transition ${
                disableSearch ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSearching ? "Buscando..." : (searchConfig.searchButtonLabel ?? "Buscar")}
            </button>
          </div>

          {searchError && <p className="text-sm text-red-600 mt-3">{searchError}</p>}

          <p className="text-xs text-gray-500 mt-2">
            Si no se encuentra, podrás cargar los datos manualmente.
          </p>
        </div>
      </section>
    );
  }

  // ----- FORMULARIO PRINCIPAL (view/edit) -----
  return (
    <section className="space-y-6 mb-10 px-4 mt-2">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          {title && <h2 className="text-xl font-regular text-[#000000] mb-1">{title}</h2>}
          {description && <p className="text-sm text-[#00000080]">{description}</p>}
        </div>

        {searchConfig?.enabled && (
          <div className="flex gap-2">
            
            <button
              type="button"
              className="text-[#0040B8] border border-[#0040B8] rounded-[4px] px-3 py-2 text-sm hover:bg-[#0040B8] hover:text-white transition shrink-0"
              onClick={resetSearch}
            >
              {searchConfig.resetButtonLabel ?? `Buscar otro ${searchConfig.fieldLabel}`}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 max-md:grid-cols-1 gap-x-6 gap-y-8">
        {formData.map((f) => {
          const valueRaw = data?.[f.name] ?? "";
          const value =
            f.type === "date" ? dateForInput(valueRaw) : String(valueRaw ?? "");
          const error = fieldErrors[f.name];
          const disabled = Boolean((mode === "view") || f.disabled);

          // SELECT
          if (f.options && Array.isArray(f.options)) {
            return (
              <div key={f.name} className={f.className ?? ""}>
                <label className="block text-sm text-gray-700 mb-1">{f.label}</label>
                <select
                  className={`w-full border rounded-[4px] px-4 py-3 text-base focus:outline-none focus:ring-2 ${
                    error ? "border-red-400 focus:ring-red-500" : "border-[#DEDEDE] focus:ring-[#0040B8]"
                  } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  name={f.name}
                  value={value}
                  onChange={(e) => handleChange(f.name, e.target.value)}
                  onBlur={() => handleBlur(f.name)}
                  disabled={disabled}
                >
                  {f.options.map((opt) => (
                    <option
                      key={`${f.name}-${String(opt.value)}`} // opciones deduplicadas en el parent
                      value={opt.value}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
                {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
              </div>
            );
          }

          // INPUT
          return (
            <div key={f.name} className={f.className ?? ""}>
              <label className="block text-sm text-gray-700 mb-1">{f.label}</label>
              <input
                type={f.type ?? "text"}
                placeholder={f.placeholder ?? ""}
                className={`w-full border rounded-[4px] px-4 py-3 text-base focus:outline-none focus:ring-2 ${
                  error ? "border-red-400 focus:ring-red-500" : "border-[#DEDEDE] focus:ring-[#0040B8]"
                } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
                name={f.name}
                value={value}
                onChange={(e) => handleChange(f.name, e.target.value)}
                onBlur={() => handleBlur(f.name)}
                disabled={disabled}
              />
              {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            </div>
          );
        })}
      </div>
      {/* Dropzone simple (opcional) */}
      {showDropzone && (
        <div className="pt-4">
          <Dropzone
            onPendingChange={onPendingDocsChange}
            existing={existingDocuments}
            onDeleteExisting={onDeleteExisting}
          />
        </div>
      )}
    </section>
  );
}
