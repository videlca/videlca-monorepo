import { StepHeader } from "../../ui/common/StepHeader";
import type { Control, FieldValues, Path } from "react-hook-form";
import { InputSelect } from "../InputSelect";
import { useTiposAdicional } from "../../../api/queryFunctions/adicionales";

// Sirve tanto para el form de crear como el de editar: ambos tienen el campo idTipoAdicional
export const TipoAdicionalStep = <T extends FieldValues>({
  control,
  showHeader = true,
}: {
  control: Control<T>;
  showHeader?: boolean;
}) => {
  const { data: tiposAdicionalQuery } = useTiposAdicional();

  const options = (tiposAdicionalQuery?.data ?? []).map((tipo) => ({
    id: tipo.idTipoAdicional,
    descripcion: `${tipo.codigo} - ${tipo.descripcion}`,
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {showHeader && (
        <StepHeader
          title="Tipo de Adicional"
          description="Seleccione el tipo de adicional que se le cobrará al cliente"
        />
      )}

      <InputSelect
        label="Tipo de adicional"
        placeholder="Seleccione un tipo de adicional"
        options={options}
        control={control}
        name={"idTipoAdicional" as Path<T>}
        valueAsNumber
        required
      />
    </div>
  );
};
