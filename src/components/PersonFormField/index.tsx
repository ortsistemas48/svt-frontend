// components/PersonFormField.tsx
'use client';

import React from "react";

type FormFieldProps = {
  label: string;
  type?: string;
  placeholder?: string;
  options?: { value: string; label: string; key?: string }[];
  className?: string;
  name: string;
  isOwner?: boolean;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  isRequired?: boolean;
  lang?: string;
  displayValue?: string;

  innerCheckboxLabel?: string;
  innerCheckboxChecked?: boolean;
  onInnerCheckboxChange?: (checked: boolean) => void;
  innerCheckboxDisabled?: boolean;
};

export default function PersonFormField({
  label,
  type = "text",
  placeholder = "",
  options,
  className = "",
  name,
  isOwner,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  disabled = false,
  isRequired = false,
  lang,
  displayValue,
  innerCheckboxLabel,
  innerCheckboxChecked,
  onInnerCheckboxChange,
  innerCheckboxDisabled = false,
  
}: FormFieldProps) {
  const safe = (s: string) => s.toLowerCase().replace(/\s+/g, "-");
  const id = isOwner ? `owner-${safe(name || label)}` : `driver-${safe(name || label)}`;

  const base =
    "w-full px-3 py-3 border rounded-[4px] focus:outline-none focus:ring-2 focus:border-transparent text-sm";
  const cls = error
    ? `${base} border-red-500 focus:ring-red-500`
    : `${base} border-gray-300 focus:ring-blue-500`;

  const showInnerCheckbox = typeof innerCheckboxLabel === "string" && !!onInnerCheckboxChange;
  // Altura reservada para el renglón del checkbox, asegura alineación entre campos
  const checkboxRowClass = "flex items-center gap-3 text-sm min-h-[2rem]"; // Mínimo 2rem de altura
  return (
    <div className={`flex flex-col justify-center w-full ${className}`}>
      <label htmlFor={id} className="mb-1 block text-sm font-regular text-[#000000] leading-tight">
        {label}
        {isRequired && (
                    <span className="ml-1">
                      
                      <span className="text-red-500">*</span>
                      
                    </span>
                    )}
      </label>

      {options ? (
        <select
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={disabled}
          lang={lang}
          className={`${cls} disabled:opacity-60`}
        >
          <option value="">Seleccionar {label.toLowerCase()}</option>
          {options.map((opt, idx) => (
            <option key={opt.key ?? `${opt.value}::${idx}`} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <div className={displayValue && type === "month" ? "relative" : ""}>
          <input
            id={id}
            name={name}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            disabled={disabled}
            lang={lang}
            className={`${cls} disabled:opacity-60 ${displayValue && type === "month" ? "text-transparent [color:transparent]" : ""}`}
          />
          {displayValue && type === "month" && (
            <div className={`pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm ${disabled ? "opacity-60" : ""} ${error ? "text-red-600" : "text-black"}`}>
              {displayValue}
            </div>
          )}
        </div>
      )}

      {showInnerCheckbox ? (
        <label 
          htmlFor={`${id}-inner-checkbox`}
          className={`${checkboxRowClass} ${innerCheckboxDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} py-2 -mt-1`}
        >
          <input
            type="checkbox"
            id={`${id}-inner-checkbox`}
            checked={Boolean(innerCheckboxChecked)}
            onChange={(e) => onInnerCheckboxChange?.(e.target.checked)}
            disabled={innerCheckboxDisabled}
            className="w-5 h-5 rounded border-gray-300 text-[#0040B8] focus:ring-[#0040B8] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
          />
          <span className="text-gray-700 flex-1 select-none">
            {innerCheckboxLabel}
          </span>
        </label>
      ) : (
        // Spacer para mantener la misma altura aunque no haya checkbox
        <div className={`${checkboxRowClass} py-2 -mt-1`} aria-hidden />
      )}

      <div className="min-h-[20px]">
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
