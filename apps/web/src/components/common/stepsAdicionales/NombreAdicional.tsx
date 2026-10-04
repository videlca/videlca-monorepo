import { StepHeader } from "../../ui/common/StepHeader";
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
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {showHeader && (
        <StepHeader
          title="Nombre del Adicional"
          description="Ingrese el nombre con el que se identificará este adicional"
        />
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
