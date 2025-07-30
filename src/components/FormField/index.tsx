
// components/FormField.tsx
type FormFieldProps = {
  label: string;
  type?: string;
  placeholder?: string;
  options?: { value: string; label: string }[]; // para selects
};

export default function FormField({
  label,
  type = "text",
  placeholder = "",
  options,
}: FormFieldProps) {
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col justify-center w-full">
      <label htmlFor={id} className="block text-base font-semibold text-[#000000] mb-1">
        {label}
      </label>
      {options ? (
        <select
          id={id}
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
          type={type}
          placeholder={placeholder}
          className="w-full px-3 py-3 border border-gray-300 rounded-[4px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      )}
    </div>
  );
}
