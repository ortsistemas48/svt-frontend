'use client';

import React from "react";

type FormFieldProps = {
  label: string;
  type?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  className?: string;
  name: string;
  isOwner?: boolean;
  value: string;
  onChange: (value: string) => void;
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
  onChange
}: FormFieldProps) {
  const id = isOwner ? `owner-${label}` : `driver-${label}`;

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
          className="w-full px-3 py-3 border border-gray-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="">Seleccionar {label.toLowerCase()}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
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
          className="w-full px-3 py-3 border border-gray-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      )}
    </div>
  );
}
