interface InputTime24HProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  disabled?: boolean;
  className?: string;
  id: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}
export const InputTime24H = ({
  value = "",
  onChange,
  disabled = false,
  className = "",
  id,
  name,
  required = false,
  placeholder = "Selecciona una hora",
  label = "",
  ...props
}: InputTime24HProps) => {
  // Generate hours array from 00 to 23
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0"),
  );
  const selectedHour = value.split(":")[0] || "";
  return (
    <div className="mb-1 flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        onChange={onChange}
        disabled={disabled}
        className={`w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none disabled:bg-gray-100`}
        id={id}
        name={name}
        required={required}
        value={selectedHour}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {hours.map((hour) => (
          <option key={hour} value={hour}>
            {hour}:00
          </option>
        ))}
      </select>
    </div>
  );
};
