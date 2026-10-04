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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Configuración de Horario a la Medida
        </h3>
        <p className="text-sm text-gray-600">
          Seleccione el horario del servicio para el primer y el último día de
          la orden. Los días intermedios se calculan completos
          automáticamente.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
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
      </div>

      <div className="space-y-1 rounded-lg border border-yellow-500 bg-yellow-50 px-4 py-2 text-left">
        <h4 className="text-base font-medium text-yellow-600">Nota:</h4>{" "}
        <p className="text-xs text-yellow-600">
          El precio de este servicio se calcula día por día según el horario
          diurno/nocturno vigente y si el día es ordinario o dominical/festivo.
        </p>
      </div>
    </div>
  );
};
