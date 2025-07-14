interface InputSelectProps {
  label: string;
  placeholder: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const InputSelectStateBoolean = ({
  label,
  placeholder,
  id,
  value,
  onChange,
}: InputSelectProps) => {
  const options = [
    { value: "true", label: "Activo" },
    { value: "false", label: "Inactivo" },
  ];
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};
