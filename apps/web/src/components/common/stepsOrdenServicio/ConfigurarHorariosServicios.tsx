import { useState } from "react";
import { toast } from "sonner";
import type {
  CreateOrdenServicioTarifaDto,
  PatronDiasSemanaDto,
} from "../../../api/dtos";
import type { Servicio } from "../../../api/types/servicio";
import { timeFormat } from "../../../utils/TimeFormat";
import { InputTime24H } from "../InputTime24H";
import { CheckboxForm } from "../CheckboxForm";

const TIPO_SERVICIO_MONITOREO_ALARMAS = "Monitoreo de alarmas";

// Dias de la semana en que se presta un servicio de catalogo (ver PatronDiasSemanaDto). El orden en el que se
// muestran los botones empieza en lunes, igual que el orden en que llegan los campos del backend
const DIAS_SEMANA: { key: keyof PatronDiasSemanaDto; label: string }[] = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

// Selector de dias de la semana + "incluye festivos" de un servicio de catalogo dentro de la orden. Todos
// empiezan seleccionados por defecto (ver SeleccionarServicio), asi el comportamiento por defecto sigue siendo
// "todos los dias". El backend rechaza (400) si se desmarcan los 7 dias, por eso se bloquea aca mismo antes de
// llegar a ese punto: si solo queda un dia marcado, no se deja desmarcar.
const SelectorDiasSemana = ({
  idServicio,
  configuracionServicioTarifa,
  setConfiguracionServicioTarifa,
}: {
  idServicio: number;
  configuracionServicioTarifa: CreateOrdenServicioTarifaDto[];
  setConfiguracionServicioTarifa: (
    configuracionServicioTarifa:
      | CreateOrdenServicioTarifaDto[]
      | ((
          prev: CreateOrdenServicioTarifaDto[],
        ) => CreateOrdenServicioTarifaDto[]),
  ) => void;
}) => {
  const fila = configuracionServicioTarifa.find(
    (s) => s.idServicio === idServicio,
  );

  const toggleDia = (dia: keyof PatronDiasSemanaDto) => {
    const diasMarcados = DIAS_SEMANA.filter(
      ({ key }) => fila?.[key] ?? true,
    ).length;

    if (diasMarcados <= 1 && (fila?.[dia] ?? true)) {
      toast.error(
        "Debe seleccionar al menos un dia de la semana en que se presta el servicio",
      );
      return;
    }

    setConfiguracionServicioTarifa((prev: CreateOrdenServicioTarifaDto[]) => {
      const newArray = [...prev];
      const index = newArray.findIndex((s) => s.idServicio === idServicio);
      if (index === -1) return prev;
      newArray[index] = {
        ...newArray[index],
        [dia]: !(newArray[index][dia] ?? true),
      };
      return newArray;
    });
  };

  const toggleIncluyeFestivos = () => {
    setConfiguracionServicioTarifa((prev: CreateOrdenServicioTarifaDto[]) => {
      const newArray = [...prev];
      const index = newArray.findIndex((s) => s.idServicio === idServicio);
      if (index === -1) return prev;
      newArray[index] = {
        ...newArray[index],
        incluyeFestivos: !(newArray[index].incluyeFestivos ?? true),
      };
      return newArray;
    });
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">
        Días en que se presta el servicio
      </label>
      <div className="flex flex-wrap gap-2">
        {DIAS_SEMANA.map(({ key, label }) => {
          const activo = fila?.[key] ?? true;
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleDia(key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                activo
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <CheckboxForm
        label="Incluye festivos"
        id={`incluyeFestivos-${idServicio}`}
        checked={fila?.incluyeFestivos ?? true}
        onChange={toggleIncluyeFestivos}
      />
    </div>
  );
};

export const ConfigurarHorariosServicios = ({
  selectedServices,
  configuracionServicioTarifa,
  setConfiguracionServicioTarifa,
}: {
  selectedServices: Servicio[];
  configuracionServicioTarifa: CreateOrdenServicioTarifaDto[];
  setConfiguracionServicioTarifa: (
    configuracionServicioTarifa:
      | CreateOrdenServicioTarifaDto[]
      | ((
          prev: CreateOrdenServicioTarifaDto[],
        ) => CreateOrdenServicioTarifaDto[]),
  ) => void;
}) => {
  // Monitoreo de alarmas ya envia por defecto los 7 dias + festivos en true (ver SeleccionarServicio), asi que
  // el selector de dias se mantiene oculto para no cambiar el comportamiento actual, a menos que el usuario
  // indique que este cliente en particular necesita un patron distinto. Para el resto de servicios de catalogo
  // el selector siempre se muestra
  const [personalizarDiasMonitoreo, setPersonalizarDiasMonitoreo] = useState<
    Record<number, boolean>
  >({});

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Configuración de Horarios para{" "}
          {selectedServices.length > 1
            ? `${selectedServices.length} servicios`
            : "servicio"}
        </h3>
        <p className="text-sm text-gray-600">
          Seleccionar las horas necesarias para cumplir con el horario del
          servicio.
        </p>
      </div>
      <div className="space-y-4">
        {selectedServices.map((service) => {
          const esMonitoreoAlarmas =
            service.idTipoServicio?.nombre === TIPO_SERVICIO_MONITOREO_ALARMAS;
          const mostrarSelectorDias =
            !esMonitoreoAlarmas || !!personalizarDiasMonitoreo[service.idServicio];

          return (
          <div
            key={service.idServicio}
            className="rounded-lg border border-gray-200 p-4"
          >
            <div className="flex flex-col gap-2">
              <h4 className="text-sm font-medium text-gray-900">
                {service.codigo} - {service.descripcion}
              </h4>
              {service.horasFijas === 24 ? (
                <>
                  <p className="text-sm font-medium text-gray-700">
                    Horario Fijo (Servicio de 24 horas) configurar la hora de
                    inicio de la orden.
                  </p>
                  <InputTime24H
                    label="Hora de Inicio"
                    placeholder="Selecciona una hora de inicio"
                    id="horaInicio"
                    name="horaInicio"
                    value={
                      configuracionServicioTarifa.find(
                        (s) => s.idServicio === service.idServicio,
                      )?.horaInicio || ""
                    }
                    onChange={(e) =>
                      setConfiguracionServicioTarifa(
                        (prev: CreateOrdenServicioTarifaDto[]) => {
                          const newArray = [...prev];
                          const index = newArray.findIndex(
                            (s) => s.idServicio === service.idServicio,
                          );
                          newArray[index] = {
                            ...newArray[index],
                            // Al ser servicio de 24 horas, se debe setear la hora de fin a 00:00:00
                            horaInicio: timeFormat(e.target.value),
                            horaFin: timeFormat(e.target.value),
                          };
                          return newArray;
                        },
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <div className="">
                    <div className="mb-3 flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Rango de Horario
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <InputTime24H
                        label="Hora de Inicio"
                        id="horaInicio"
                        name="horaInicio"
                        value={
                          configuracionServicioTarifa.find(
                            (s) => s.idServicio === service.idServicio,
                          )?.horaInicio || ""
                        }
                        onChange={(e) =>
                          setConfiguracionServicioTarifa(
                            (prev: CreateOrdenServicioTarifaDto[]) => {
                              const newArray = [...prev];
                              const index = newArray.findIndex(
                                (s) => s.idServicio === service.idServicio,
                              );
                              newArray[index] = {
                                ...newArray[index],
                                horaInicio: timeFormat(e.target.value),
                              };
                              return newArray;
                            },
                          )
                        }
                      />
                      <InputTime24H
                        label="Hora de Fin"
                        id="horaFin"
                        name="horaFin"
                        value={
                          configuracionServicioTarifa.find(
                            (s) => s.idServicio === service.idServicio,
                          )?.horaFin || ""
                        }
                        onChange={(e) =>
                          setConfiguracionServicioTarifa(
                            (prev: CreateOrdenServicioTarifaDto[]) => {
                              const newArray = [...prev];
                              const index = newArray.findIndex(
                                (s) => s.idServicio === service.idServicio,
                              );
                              newArray[index] = {
                                ...newArray[index],
                                horaFin: timeFormat(e.target.value),
                              };
                              return newArray;
                            },
                          )
                        }
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Dias de la semana en que se presta el servicio (no aplica a servicios "a la medida", este
                componente solo se usa en el flujo de catalogo). Monitoreo de alarmas queda oculto por defecto
                (ver mostrarSelectorDias) para no cambiar el comportamiento actual de "todos los dias" */}
            <div className="mt-4">
              {mostrarSelectorDias ? (
                <SelectorDiasSemana
                  idServicio={service.idServicio}
                  configuracionServicioTarifa={configuracionServicioTarifa}
                  setConfiguracionServicioTarifa={setConfiguracionServicioTarifa}
                />
              ) : (
                <button
                  type="button"
                  className="text-xs font-medium text-blue-600 underline underline-offset-2 hover:text-blue-700"
                  onClick={() =>
                    setPersonalizarDiasMonitoreo((prev) => ({
                      ...prev,
                      [service.idServicio]: true,
                    }))
                  }
                >
                  ¿Este cliente necesita un patrón de días distinto a "todos
                  los días"? Personalizar días
                </button>
              )}
            </div>

            <div className="mt-4 space-y-1 rounded-lg border border-yellow-500 bg-yellow-50 px-4 py-2 text-left">
              <h4 className="text-base font-medium text-yellow-600">Nota:</h4>{" "}
              <p className="text-xs text-yellow-600">
                {service.idTipoDuracion.descripcion.toLowerCase() === "fija" ? (
                  <>
                    Horas recomendadas: <b>{service.horasFijas} Horas fijas</b>
                  </>
                ) : (
                  <>
                    Horas recomendadas:{" "}
                    <b>
                      {service.horasMinimas} Horas mínimas -{" "}
                      {service.horasMaximas} Horas máximas.
                    </b>
                  </>
                )}
                <>
                  {". "}Segun el tipo de duracion del servicio{" "}
                  <b>{service.idTipoDuracion.descripcion}</b>
                </>
              </p>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};
