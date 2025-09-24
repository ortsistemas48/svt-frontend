
'use client'

import React from "react";

type FormFieldProps = {
    label: string;
    type?: string;
    placeholder?: string;
    options?: { value: string; label: string }[];
    className?: string;
    name?: any; // Optional, used for form submission
    isOwner?: boolean; // Optional prop to indicate if the field is for owner data
};

export default function PersonFormField({
    label,
    type = "text",
    placeholder = "",
    options,
    className = "",
    name,
    isOwner
}: FormFieldProps) {

    const id = isOwner ? `owner-${label}` : `driver-${label}`; // Unique ID for the field based on context
    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        // Handle change logic here - this component appears to be for person data, not car data
        // The actual state management should be handled by the parent component
        console.log(`Field ${name} changed to:`, event.target.value);
    }
    return (
        <div className={`flex flex-col justify-center w-full ${className}`}>
            <label htmlFor={id} className="block text-base font-regular text-[#000000] mb-1">
                {label}
            </label>
            {options ? (
                <select
                    id={id}
                    className="w-full px-3 py-3 border border-gray-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    onChange={handleChange}
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
                    type={type}
                    placeholder={placeholder}
                    onChange={handleChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
            )}
        </div>
    );
}
