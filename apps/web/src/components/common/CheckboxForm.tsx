interface CheckboxFormProps {
  label: string;
  id: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
}

export const CheckboxForm = ({
  label,
  id,
  checked,
  onChange,
  required = false,
  disabled = false,
}: CheckboxFormProps) => {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-sm font-medium text-gray-700"
      >
        {label}
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          required={required}
          className="focus:ring-opacity-20 rounded border border-gray-300 text-blue-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
          disabled={disabled}
        />
      </label>
    </div>
  );
};
