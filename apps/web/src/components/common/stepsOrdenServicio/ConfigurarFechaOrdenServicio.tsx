import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { muiRegister } from "../../../utils/muiRegister";
import { StepHeader } from "../../ui/common/StepHeader";
import type { UseFormRegister, UseFormSetValue } from "react-hook-form";
import {
  COBRO_PARCIAL_INICIAL,
  type CobroParcial,
} from "../../../utils/cobroParcial";

const DIAS_MES = Array.from({ length: 31 }, (_, i) => i + 1);

export const ConfigurarFechaOrdenServicio = ({
  register,
  setValue,
  isIndefinite,
  setIsIndefinite,
  cobroParcial,
  setCobroParcial,
}: {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  isIndefinite: boolean;
  setIsIndefinite: (isIndefinite: boolean) => void;
  // Solo el flujo de crear lo envia: la actualizacion de ordenes no maneja cobro parcial
  cobroParcial?: CobroParcial;
  setCobroParcial?: (cobroParcial: CobroParcial) => void;
}) => {
  const renderSelectDia = (
    value: number | null,
    onChange: (dia: number | null) => void,
    ariaLabel: string,
  ) => (
    <TextField
      select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      fullWidth={false}
      sx={{ width: 88 }}
      slotProps={{ select: { native: true }, htmlInput: { "aria-label": ariaLabel } }}
    >
      <option value="">--</option>
      {DIAS_MES.map((dia) => (
        <option key={dia} value={dia}>
          {dia}
        </option>
      ))}
    </TextField>
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <StepHeader
        title="Configuración de Fechas"
        description="Configure las fechas de inicio y fin de la orden de servicio"
      />

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <TextField
            type="date"
            label="Fecha de Inicio"
            {...muiRegister(register("fechaInicio"))}
            slotProps={{ inputLabel: { shrink: true, required: true } }}
          />
          <TextField
            type="date"
            label="Fecha de Fin"
            {...muiRegister(register("fechaFin"))}
            disabled={isIndefinite}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </div>

        <FormControlLabel
          control={
            <Checkbox
              id="indefinite"
              size="small"
              checked={isIndefinite}
              onChange={(e) => {
                setIsIndefinite(e.target.checked);
                if (e.target.checked) {
                  setValue("fechaFin", null);
                } else {
                  setCobroParcial?.(COBRO_PARCIAL_INICIAL);
                }
              }}
            />
          }
          label="Orden de servicio indefinida (sin fecha de finalización)"
        />

        {cobroParcial && setCobroParcial && (
          <Paper variant="outlined" className="flex flex-col gap-2 p-4">
            <FormControlLabel
              disabled={!isIndefinite}
              control={
                <Checkbox
                  id="cobroParcial"
                  size="small"
                  checked={cobroParcial.activo}
                  onChange={(e) =>
                    setCobroParcial(
                      e.target.checked
                        ? { ...cobroParcial, activo: true }
                        : COBRO_PARCIAL_INICIAL,
                    )
                  }
                />
              }
              label="Cobro parcial mensual"
            />
            <Typography variant="caption" color="text.secondary">
              Solo para órdenes indefinidas de catálogo: cada mes se cobra
              únicamente el rango de días elegido.
            </Typography>

            {cobroParcial.activo && (
              <Typography variant="body2" component="div" className="flex flex-wrap items-center gap-2">
                <span>Cobrar del día</span>
                {renderSelectDia(
                  cobroParcial.diaInicio,
                  (dia) => setCobroParcial({ ...cobroParcial, diaInicio: dia }),
                  "Día de inicio de cobro",
                )}
                <span>al día</span>
                {renderSelectDia(
                  cobroParcial.diaFin,
                  (dia) => setCobroParcial({ ...cobroParcial, diaFin: dia }),
                  "Día de fin de cobro",
                )}
                <span>de cada mes</span>
              </Typography>
            )}
          </Paper>
        )}
      </div>
    </div>
  );
};
