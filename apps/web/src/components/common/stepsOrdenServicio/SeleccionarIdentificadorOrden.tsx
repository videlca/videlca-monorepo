import FormLabel from "@mui/material/FormLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { StepHeader } from "../../ui/common/StepHeader";
import { useEffect } from "react";
import { usePrefijosTipoServicio } from "../../../api/queryFunctions/servicios";

export const SeleccionarIdentificadorOrden = ({
  identificador,
  setIdentificador,
  nextIdOrdenServicio,
}: {
  identificador: {
    codigoTipoServicio: number;
    prefijo: string;
    codigo: number;
  };
  setIdentificador: (identificador: {
    codigoTipoServicio: number;
    prefijo: string;
    codigo: number;
  }) => void;
  nextIdOrdenServicio: number;
}) => {
  const { data: prefijosQuery } = usePrefijosTipoServicio();

  useEffect(() => {
    setIdentificador({
      ...identificador,
      codigo: nextIdOrdenServicio === 0 ? 1 : nextIdOrdenServicio,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextIdOrdenServicio]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <StepHeader
        title="Seleccionar Identificador de Orden de Servicio"
        description="Ingrese el código de la orden de servicio para identificarla de forma única"
      />
      <div className="flex flex-col gap-1">
        <FormLabel htmlFor="prefijo" sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
          Código de Orden de Servicio
        </FormLabel>
        <div className="flex flex-row items-center gap-2">
          <TextField
            select
            name="prefijo"
            id="prefijo"
            value={identificador.codigoTipoServicio || 0}
            onChange={(e) => {
              const select = e.target as unknown as HTMLSelectElement;
              setIdentificador({
                ...identificador,
                codigoTipoServicio: Number(select.value),
                prefijo: select.options[select.selectedIndex].text,
              });
            }}
            slotProps={{ select: { native: true } }}
          >
            <option value="">Seleccione un prefijo</option>
            {prefijosQuery?.data?.data?.map((prefijo) => (
              <option key={prefijo.idTipoServicio} value={prefijo.idTipoServicio}>
                {prefijo.prefijo}
              </option>
            )) || []}
          </TextField>
          <Typography color="text.secondary">-</Typography>
          <TextField
            type="number"
            name="codigoOrdenServicio"
            id="codigoOrdenServicio"
            value={identificador.codigo}
            disabled={true}
          />
        </div>
      </div>
    </div>
  );
};
