import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { tones } from "../../../theme/tones";
import { StepHeader } from "../../ui/common/StepHeader";
import RemoveIcon from "@mui/icons-material/Remove";
import { priceFormat } from "../../../utils/PriceFormat";
import type { Servicio, TipoServicio } from "../../../api/types/servicio";
import type { Tarifa } from "../../../api/types/periodo";

// Distingue visualmente los servicios por turno de los mensuales, sin llamar demasiado la atención
const getServiceTone = (descripcion: string) => {
  if (descripcion.startsWith("Turno")) return tones.amber;
  if (descripcion.startsWith("Mes")) return tones.green;
  return null;
};

export const SeleccionarServicio = ({
  selectedServices,
  tarifasPeriodoActivoByIdTipoServicioData,
  tipoServiciosQuery,
  handleIncrementarServicio,
  handleDecrementarServicio,
  handleSetCantidadServicio,
}: {
  selectedServices: Servicio[];
  tarifasPeriodoActivoByIdTipoServicioData: Tarifa[];
  tipoServiciosQuery: TipoServicio[];
  handleIncrementarServicio: (tarifa: Tarifa) => void;
  handleDecrementarServicio: (tarifa: Tarifa) => void;
  handleSetCantidadServicio: (tarifa: Tarifa, cantidad: number) => void;
}) => {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <StepHeader
        title="Servicio a Prestar"
        description="Seleccione el tipo de servicio que se prestará, y la cantidad de unidades que necesita de cada uno"
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Servicios Disponibles.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Unidades seleccionadas: {selectedServices.length}
          </Typography>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {(tarifasPeriodoActivoByIdTipoServicioData || []).map((tarifa) => {
            // Cantidad de unidades ya elegidas de este servicio (selectedServices trae una entrada por
            // cada unidad seleccionada, no una por servicio distinto: ver handleIncrementarServicio)
            const cantidad = selectedServices.filter(
              (s) => s.idServicio === tarifa.idServicio.idServicio,
            ).length;
            const tone = getServiceTone(tarifa.idServicio.descripcion);

            return (
              <Paper
                key={tarifa.idServicio.idServicio}
                variant="outlined"
                className="relative flex flex-col p-4"
                sx={{
                  borderColor: cantidad > 0 ? "primary.main" : (tone?.main ?? "divider"),
                  bgcolor: cantidad > 0 ? "action.selected" : "background.paper",
                }}
              >
                {cantidad > 0 && (
                  <CheckCircleIcon
                    color="primary"
                    fontSize="small"
                    sx={{ position: "absolute", top: 12, right: 12 }}
                  />
                )}
                <Typography
                  variant="h5"
                  component="h4"
                  sx={{ fontWeight: 500, mb: 1, pr: 3, color: tone?.main ?? "text.primary" }}
                >
                  {tarifa.idServicio.descripcion}
                </Typography>
                <Box className="mt-auto pt-2 text-right" sx={{ borderTop: 1, borderColor: "divider" }}>
                  <Typography variant="caption" color="text.secondary" component="p">
                    Antes de IVA
                  </Typography>
                  <Typography sx={{ fontWeight: 600, color: "primary.main" }}>
                    {priceFormat(tarifa.precioAntesIva)}
                  </Typography>
                </Box>
                <Box
                  className="mt-3 flex items-center justify-center gap-2 pt-3"
                  sx={{ borderTop: 1, borderColor: "divider" }}
                >
                  <IconButton
                    disabled={cantidad === 0}
                    onClick={() => handleDecrementarServicio(tarifa)}
                    sx={{ border: 1, borderColor: "divider" }}
                    aria-label={`Quitar una unidad de ${tarifa.idServicio.descripcion}`}
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <TextField
                    type="number"
                    value={cantidad}
                    onChange={(e) =>
                      handleSetCantidadServicio(tarifa, Number(e.target.value))
                    }
                    fullWidth={false}
                    sx={{ width: 72 }}
                    slotProps={{
                      htmlInput: {
                        min: 0,
                        inputMode: "numeric",
                        style: { textAlign: "center", fontWeight: 600 },
                        "aria-label": `Cantidad de unidades de ${tarifa.idServicio.descripcion}`,
                      },
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={() => handleIncrementarServicio(tarifa)}
                    sx={{ border: 1, borderColor: "primary.main" }}
                    aria-label={`Agregar una unidad de ${tarifa.idServicio.descripcion}`}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            );
          })}
        </div>

        {(tarifasPeriodoActivoByIdTipoServicioData || []).length === 0 && (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            No hay servicios disponibles para esta categoría
          </Typography>
        )}
      </div>
    </div>
  );
};
