interface InputSelectProps {
  label: string;
  placeholder: string;
  id: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { id: number; descripcion: string }[];
  required?: boolean;
}

export const InputSelect = ({
  label,
  placeholder,
  id,
  value,
  onChange,
  options,
  required = false,
}: InputSelectProps) => {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={id}
        value={value.toString()}
        onChange={onChange}
        className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
        required={required}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.descripcion}
          </option>
        ))}
      </select>
    </div>
  );
};
