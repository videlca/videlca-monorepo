import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Typography from "@mui/material/Typography";
import { SelectableCard } from "../../ui/common/SelectableCard";
import { StepHeader } from "../../ui/common/StepHeader";
import { useEffect } from "react";
import { useGetOrigenServicio } from "../../../api/queryFunctions/orden-servicio/origen-servicio";
import { OrigenServicioEnum } from "../../../api/dtos";

// "Monitoreo de alarmas" siempre se crea desde catalogo (no se pregunta). Cualquier otro tipo de servicio
// ("Vigilancia y escolta") si deja elegir entre catalogo y a la medida
const TIPO_SERVICIO_MONITOREO_ALARMAS = "Monitoreo de alarmas";

export const SeleccionarOrigenServicio = ({
  tipoServicioNombre,
  origenServicio,
  setOrigenServicio,
}: {
  tipoServicioNombre?: string;
  origenServicio: OrigenServicioEnum | null;
  setOrigenServicio: (origenServicio: OrigenServicioEnum) => void;
}) => {
  const { data: origenServicioQuery } = useGetOrigenServicio();
  const esMonitoreoAlarmas = tipoServicioNombre === TIPO_SERVICIO_MONITOREO_ALARMAS;

  // Monitoreo de alarmas siempre es "catalogo", se fija automaticamente sin pedirle nada al usuario
  useEffect(() => {
    if (esMonitoreoAlarmas) {
      setOrigenServicio(OrigenServicioEnum.CATALOGO);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esMonitoreoAlarmas]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <StepHeader
        title="Origen de la Orden de Servicio"
        description="Seleccione cómo desea crear esta orden de servicio"
      />

      {esMonitoreoAlarmas ? (
        <Alert severity="warning">
          <AlertTitle>Nota:</AlertTitle>
          Las órdenes de <b>Monitoreo de alarmas</b> siempre se crean desde
          el catálogo, no es necesario seleccionar el origen.
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(origenServicioQuery?.data || []).map((origen) => (
            <SelectableCard
              key={origen.idOrigenServicio}
              selected={origenServicio === origen.code}
              onClick={() =>
                setOrigenServicio(origen.code as OrigenServicioEnum)
              }
            >
              <Typography variant="body2" component="h4" sx={{ fontWeight: 600, mb: 1, pr: 4 }}>
                {origen.nombre}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {origen.descripcion}
              </Typography>
            </SelectableCard>
          ))}

          {(origenServicioQuery?.data || []).length === 0 && (
            <Typography color="text.secondary" align="center" className="col-span-2" sx={{ py: 4 }}>
              No hay orígenes de servicio disponibles
            </Typography>
          )}
        </div>
      )}
    </div>
  );
};
