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
  const checkboxRowClass = "flex items-center gap-2 text-sm h-1"; // 1.5rem
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
        <label className={checkboxRowClass}>
          <input
            type="checkbox"
            checked={Boolean(innerCheckboxChecked)}
            onChange={(e) => onInnerCheckboxChange?.(e.target.checked)}
            className="mt-5 rounded border-gray-300 text-[#0040B8] focus:ring-[#0040B8]"
          />
          <span className="mt-5 text-gray-700">{innerCheckboxLabel}</span>
        </label>
      ) : (
        // Spacer para mantener la misma altura aunque no haya checkbox
        <div className={checkboxRowClass} aria-hidden />
      )}

      <div className="min-h-[20px]">
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
