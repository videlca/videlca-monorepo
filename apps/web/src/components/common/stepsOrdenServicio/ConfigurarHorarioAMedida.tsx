import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Paper from "@mui/material/Paper";
import { StepHeader } from "../../ui/common/StepHeader";
import { InputTime24H } from "../InputTime24H";

// Paso de horario para ordenes "a la medida": un unico rango horario continuo para toda la orden (aplica el
// primer y el ultimo dia del rango, los dias intermedios se calculan completos automaticamente por el backend)
export const ConfigurarHorarioAMedida = ({
  horarioAMedida,
  setHorarioAMedida,
}: {
  horarioAMedida: { horaInicio: string; horaFin: string };
  setHorarioAMedida: (horario: { horaInicio: string; horaFin: string }) => void;
}) => {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <StepHeader
        title="Configuración de Horario a la Medida"
        description="Seleccione el horario del servicio para el primer y el último día de la orden. Los días intermedios se calculan completos automáticamente."
      />

      <Paper variant="outlined" className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <InputTime24H
            label="Hora de Inicio"
            id="horaInicioAMedida"
            name="horaInicioAMedida"
            value={horarioAMedida.horaInicio}
            onChange={(e) =>
              setHorarioAMedida({
                ...horarioAMedida,
                horaInicio: e.target.value,
              })
            }
          />
          <InputTime24H
            label="Hora de Fin"
            id="horaFinAMedida"
            name="horaFinAMedida"
            value={horarioAMedida.horaFin}
            onChange={(e) =>
              setHorarioAMedida({
                ...horarioAMedida,
                horaFin: e.target.value,
              })
            }
          />
        </div>
      </Paper>

      <Alert severity="warning">
        <AlertTitle>Nota:</AlertTitle>
        El precio de este servicio se calcula día por día según el horario
        diurno/nocturno vigente y si el día es ordinario o dominical/festivo.
      </Alert>
    </div>
  );
};
