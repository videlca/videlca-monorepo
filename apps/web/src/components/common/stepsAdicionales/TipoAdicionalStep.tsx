import { StepHeader } from "../../ui/common/StepHeader";
import type { Control, FieldValues, Path } from "react-hook-form";
import { InputSelect } from "../InputSelect";
import { useTiposAdicional } from "../../../api/queryFunctions/adicionales";
import { useCiudadActiva } from "../../../api/queryFunctions/configuracion/ubicaciones";

// Sirve tanto para el form de crear como el de editar: ambos tienen los campos idTipoAdicional e idCiudad
export const TipoAdicionalStep = <T extends FieldValues>({
  control,
  showHeader = true,
}: {
  control: Control<T>;
  showHeader?: boolean;
}) => {
  const { data: tiposAdicionalQuery } = useTiposAdicional();
  const { data: ciudadesQuery } = useCiudadActiva();

  const opcionesTipo = (tiposAdicionalQuery?.data ?? []).map((tipo) => ({
    id: tipo.idTipoAdicional,
    descripcion: `${tipo.codigo} - ${tipo.descripcion}`,
  }));

  const opcionesCiudad = (ciudadesQuery?.data?.data ?? []).map((ciudad) => ({
    id: ciudad.idCiudad,
    descripcion: ciudad.descripcion,
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {showHeader && (
        <StepHeader
          title="Tipo y Ciudad del Adicional"
          description="Seleccione el tipo de adicional que se le cobrará al cliente y la ciudad a la que pertenece"
        />
      )}

      <InputSelect
        label="Tipo de adicional"
        placeholder="Seleccione un tipo de adicional"
        options={opcionesTipo}
        control={control}
        name={"idTipoAdicional" as Path<T>}
        valueAsNumber
        required
      />

      {/* De la ciudad sale el centro de costos del adicional en la interfase */}
      <InputSelect
        label="Ciudad"
        placeholder="Buscar ciudad"
        options={opcionesCiudad}
        control={control}
        name={"idCiudad" as Path<T>}
        valueAsNumber
        required
      />
    </div>
  );
};
