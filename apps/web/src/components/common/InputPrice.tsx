export const InputPrice = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) => {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
      {label}
      <div className="relative">
        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-gray-500">
          $
        </span>
        <input
          type="number"
          min="0"
          step="1000"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-32 rounded-md border border-gray-300 py-2 pr-3 pl-6 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="0"
        />
      </div>
    </label>
  );
};
