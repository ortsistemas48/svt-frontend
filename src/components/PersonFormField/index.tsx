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

  // ⬇️ NUEVOS
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
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
  onBlur,
  error,
  disabled = false,
}: FormFieldProps) {
  const id = isOwner ? `owner-${label}` : `driver-${label}`;
  const base =
    "w-full px-3 py-3 border rounded-[4px] focus:outline-none focus:ring-2 focus:border-transparent text-sm";
  const cls = error
    ? `${base} border-red-500 focus:ring-red-500`
    : `${base} border-gray-300 focus:ring-blue-500`;

  return (
    <div className={`flex flex-col justify-center w-full ${className}`}>
      <label htmlFor={id} className="block text-base font-regular text-[#000000] mb-1">
        {label}
      </label>

      {options ? (
        <select
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
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
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={`${cls} disabled:opacity-60`}
        />
      )}

    </div>
  );
}
