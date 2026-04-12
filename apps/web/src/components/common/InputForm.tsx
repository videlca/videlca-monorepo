interface InputFormProps {
  label?: string;
  placeholder: string;
  type: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  showLabel?: boolean;
  maxLength?: number;
  allowNegative?: boolean;
}

export const InputForm = ({
  label,
  placeholder,
  type,
  id,
  value,
  onChange,
  required = false,
  disabled = false,
  showLabel = true,
  maxLength = 255,
  allowNegative = false,
}: InputFormProps) => {
  return (
    <div className="mb-1 flex w-full flex-col gap-2">
      {showLabel && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <input
          type={type}
          id={id}
          value={value}
          max={type === "number" ? "99" : undefined}
          min={type === "number" && !allowNegative ? "0" : undefined}
          onChange={onChange}
          onInput={onChange}
          required={required}
          maxLength={maxLength}
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck="false"
        />
      </div>
    </div>
  );
};
