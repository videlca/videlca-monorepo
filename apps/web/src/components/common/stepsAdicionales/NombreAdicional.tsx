import type { UseFormRegister } from "react-hook-form";
import { InputForm } from "../InputForm";

export const NombreAdicional = ({
  register,
  showHeader = true,
}: {
  register: UseFormRegister<any>;
  showHeader?: boolean;
}) => {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {showHeader && (
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Nombre del Adicional
          </h3>
          <p className="text-sm text-gray-600">
            Ingrese el nombre con el que se identificará este adicional
          </p>
        </div>
      )}

      <InputForm
        label="Nombre"
        placeholder="Ej. Gasolina"
        type="text"
        required
        maxLength={150}
        {...register("nombre", { required: true, maxLength: 150 })}
      />
    </div>
  );
};
