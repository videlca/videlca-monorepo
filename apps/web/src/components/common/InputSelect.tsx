import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

interface InputSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  placeholder: string;
  options: { id: number; descripcion: string }[];
  error?: string;
}

export const InputSelect = React.forwardRef<HTMLSelectElement, InputSelectProps>(
  (
    {
      label,
      placeholder,
      id,
      options,
      required = false,
      disabled = false,
      error,
      ...rest
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedValue, setSelectedValue] = useState<number | string>("");

    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenSelectRef = useRef<HTMLSelectElement>(null);

    // Merge refs
    const setRefs = (element: HTMLSelectElement) => {
      hiddenSelectRef.current = element;
      if (typeof ref === "function") {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };

    // Listen to outside clicks
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Sync state with React Hook Form's imperative value updates without throwing TypeError
    useEffect(() => {
      const selectElement = hiddenSelectRef.current;
      if (!selectElement) return;

      // Initial sync
      setSelectedValue(selectElement.value);

      // We use a lightweight interval to detect programmatic changes (e.g. from react-hook-form reset or setValue)
      // because Object.defineProperty on 'value' fails in newer React versions due to non-configurable descriptors.
      const intervalId = setInterval(() => {
        setSelectedValue((prev) => {
          if (String(prev) !== selectElement.value) {
            return selectElement.value;
          }
          return prev;
        });
      }, 100);

      return () => {
        clearInterval(intervalId);
      };
    }, []);

    const handleSelect = (optionId: number) => {
      setSelectedValue(optionId);
      setIsOpen(false);
      setSearchTerm("");

      if (hiddenSelectRef.current) {
        hiddenSelectRef.current.value = String(optionId);
        // Dispatch change event for react-hook-form
        const event = new Event("change", { bubbles: true });
        hiddenSelectRef.current.dispatchEvent(event);
      }

      if (rest.onChange) {
        rest.onChange({
          target: { name: rest.name, value: String(optionId) },
        } as any);
      }
    };

    const filteredOptions = options.filter((opt) =>
      opt.descripcion.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const selectedOption = options.find(
      (opt) => String(opt.id) === String(selectedValue),
    );

    return (
      <div className="flex flex-col gap-1 relative" ref={containerRef}>
        <label htmlFor={id} className="text-sm font-medium text-gray-700">
          {label}
        </label>

        {/* Hidden native select for form integration */}
        <select
          ref={setRefs}
          id={id}
          className="hidden"
          required={required}
          disabled={disabled}
          {...rest}
        >
          {/* Include an empty string value for placeholder */}
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.descripcion}
            </option>
          ))}
        </select>

        {/* Custom UI */}
        <div
          className={`relative flex w-full cursor-pointer items-center justify-between rounded-md border ${
            error ? "border-red-500" : "border-gray-300"
          } ${
            disabled ? "cursor-not-allowed bg-gray-100 text-gray-400" : "bg-white"
          } px-4 py-2 text-sm text-gray-700 focus-within:border-blue-500 focus-within:outline-none`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className={!selectedOption ? "text-gray-400 truncate" : "truncate"}>
            {selectedOption ? selectedOption.descripcion : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-gray-500" />
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-md border border-gray-300 bg-white shadow-lg">
            <div className="flex items-center gap-2 border-b border-gray-200 p-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full text-sm outline-none placeholder:text-gray-400"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`cursor-pointer px-4 py-2 text-sm transition-colors hover:bg-gray-100 ${
                      String(option.id) === String(selectedValue)
                        ? "bg-blue-50 font-medium text-blue-600"
                        : "text-gray-700"
                    }`}
                    onClick={() => handleSelect(option.id)}
                  >
                    {option.descripcion}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  No se encontraron resultados.
                </div>
              )}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  },
);

InputSelect.displayName = "InputSelect";
