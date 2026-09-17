import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import type {
  CreateOrdenServicioTarifaDto,
  PatronDiasSemanaDto,
} from "../../../api/dtos";
import type { Servicio } from "../../../api/types/servicio";
import { timeFormat } from "../../../utils/TimeFormat";
import { InputTime24H } from "../InputTime24H";
import { CheckboxForm } from "../CheckboxForm";
import { TIPO_SERVICIO_MONITOREO_ALARMAS } from "./tipoServicioConstantes";

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
//
// "indices" son las posiciones en configuracionServicioTarifa que este selector controla: normalmente una sola
// (una unidad = una fila con su propio horario/patron de dias), salvo para un servicio de tipo Monitoreo de
// Alarmas, donde todas sus unidades se configuran juntas desde una unica tarjeta (ver renderTarjetaHorario)
const SelectorDiasSemana = ({
  indices,
  configuracionServicioTarifa,
  setConfiguracionServicioTarifa,
}: {
  indices: number[];
  configuracionServicioTarifa: CreateOrdenServicioTarifaDto[];
  setConfiguracionServicioTarifa: (
    configuracionServicioTarifa:
      | CreateOrdenServicioTarifaDto[]
      | ((
          prev: CreateOrdenServicioTarifaDto[],
        ) => CreateOrdenServicioTarifaDto[]),
  ) => void;
}) => {
  // Todas las filas del grupo comparten siempre el mismo patron de dias (se escriben siempre juntas, ver
  // toggleDia/toggleIncluyeFestivos), asi que alcanza con leer la primera para reflejar el estado actual
  const fila = configuracionServicioTarifa[indices[0]];

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
      indices.forEach((index) => {
        if (!newArray[index]) return;
        newArray[index] = {
          ...newArray[index],
          [dia]: !(newArray[index][dia] ?? true),
        };
      });
      return newArray;
    });
  };

  const toggleIncluyeFestivos = () => {
    setConfiguracionServicioTarifa((prev: CreateOrdenServicioTarifaDto[]) => {
      const newArray = [...prev];
      indices.forEach((index) => {
        if (!newArray[index]) return;
        newArray[index] = {
          ...newArray[index],
          incluyeFestivos: !(newArray[index].incluyeFestivos ?? true),
        };
      });
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
        id={`incluyeFestivos-${indices.join("-")}`}
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
  // indique que este cliente en particular necesita un patron distinto. Cada servicio de este tipo se configura
  // desde su propia tarjeta unica (ver mas abajo), asi que se indexa por idServicio y no por un solo booleano
  const [personalizarDiasMonitoreo, setPersonalizarDiasMonitoreo] = useState<
    Record<number, boolean>
  >({});

  // Puede haber varios servicios distintos de tipo "Monitoreo de alarmas" seleccionados a la vez (cada uno con
  // su propia tarifa/precio y su propia cantidad de unidades, ver SeleccionarServicio), por eso se agrupan por
  // idServicio y no todos juntos: cada servicio de este tipo obtiene su propia tarjeta unica que cubre todas
  // sus unidades, mientras que el resto de servicios sigue mostrando una tarjeta por unidad (indicesOtros).
  // Se conserva el orden y el emparejamiento por posicion con selectedServices
  const gruposMonitoreoPorServicio = new Map<number, number[]>();
  const indicesOtros: number[] = [];
  configuracionServicioTarifa.forEach((_, index) => {
    const service = selectedServices[index];
    if (!service) return;
    if (service.idTipoServicio?.nombre === TIPO_SERVICIO_MONITOREO_ALARMAS) {
      const grupo = gruposMonitoreoPorServicio.get(service.idServicio) ?? [];
      grupo.push(index);
      gruposMonitoreoPorServicio.set(service.idServicio, grupo);
    } else {
      indicesOtros.push(index);
    }
  });

  // Cuenta cuantas unidades trae cada idServicio entre las que se muestran una por una (no aplica al grupo de
  // Monitoreo de Alarmas, que ya se resume en una sola tarjeta), para poder mostrar "Unidad 2 de 3" cuando el
  // usuario selecciono varias unidades del mismo servicio (ver SeleccionarServicio)
  const cantidadPorServicio = indicesOtros.reduce<Record<number, number>>(
    (acc, index) => {
      const fila = configuracionServicioTarifa[index];
      if (fila.idServicio != null) {
        acc[fila.idServicio] = (acc[fila.idServicio] || 0) + 1;
      }
      return acc;
    },
    {},
  );
  const contadorUnidadPorServicio: Record<number, number> = {};

  // Renderiza una tarjeta de configuracion de horario para el grupo de filas en "indices": una sola fila para
  // el caso comun (una unidad), o todas las unidades de un mismo servicio cuando es de tipo Monitoreo de
  // Alarmas. El valor que el usuario ingresa se lee/escribe siempre a traves de todas las filas del grupo por
  // igual, de forma que en ese caso el dato cargado en la tarjeta se replique a todas las unidades de ese servicio
  const renderTarjetaHorario = (indices: number[], titulo: ReactNode) => {
    const primerIndice = indices[0];
    const service = selectedServices[primerIndice];
    const fila = configuracionServicioTarifa[primerIndice];
    if (!service || !fila) return null;

    const actualizarFilas = (patch: Partial<CreateOrdenServicioTarifaDto>) => {
      setConfiguracionServicioTarifa((prev: CreateOrdenServicioTarifaDto[]) => {
        const newArray = [...prev];
        indices.forEach((index) => {
          if (!newArray[index]) return;
          newArray[index] = { ...newArray[index], ...patch };
        });
        return newArray;
      });
    };

    const esMonitoreoAlarmas =
      service.idTipoServicio?.nombre === TIPO_SERVICIO_MONITOREO_ALARMAS;
    const mostrarSelectorDias =
      !esMonitoreoAlarmas || !!personalizarDiasMonitoreo[service.idServicio];

    return (
      <div
        key={indices.join("-")}
        className="rounded-lg border border-gray-200 p-4"
      >
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-gray-900">{titulo}</h4>
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
                value={fila.horaInicio || ""}
                onChange={(e) =>
                  // Al ser servicio de 24 horas, se debe setear la hora de fin a 00:00:00
                  actualizarFilas({
                    horaInicio: timeFormat(e.target.value),
                    horaFin: timeFormat(e.target.value),
                  })
                }
              />
            </>
          ) : (
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
                  value={fila.horaInicio || ""}
                  onChange={(e) =>
                    actualizarFilas({ horaInicio: timeFormat(e.target.value) })
                  }
                />
                <InputTime24H
                  label="Hora de Fin"
                  id="horaFin"
                  name="horaFin"
                  value={fila.horaFin || ""}
                  onChange={(e) =>
                    actualizarFilas({ horaFin: timeFormat(e.target.value) })
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Dias de la semana en que se presta el servicio (no aplica a servicios "a la medida", este
            componente solo se usa en el flujo de catalogo). Monitoreo de alarmas queda oculto por defecto
            (ver mostrarSelectorDias) para no cambiar el comportamiento actual de "todos los dias" */}
        <div className="mt-4">
          {mostrarSelectorDias ? (
            <SelectorDiasSemana
              indices={indices}
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
              ¿Este cliente necesita un patrón de días distinto a "todos los
              días"? Personalizar días
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
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Configuración de Horarios para{" "}
          {configuracionServicioTarifa.length > 1
            ? `${configuracionServicioTarifa.length} servicios`
            : "servicio"}
        </h3>
        <p className="text-sm text-gray-600">
          Seleccionar las horas necesarias para cumplir con el horario del
          servicio.
        </p>
      </div>
      <div className="space-y-4">
        {Array.from(gruposMonitoreoPorServicio.values()).map((indices) =>
          renderTarjetaHorario(
            indices,
            <>
              {selectedServices[indices[0]].descripcion}
              <span className="ml-2 text-xs font-normal text-gray-500">
                ({indices.length} {indices.length > 1 ? "unidades" : "unidad"})
              </span>
            </>,
          ),
        )}

        {indicesOtros.map((index) => {
          const service = selectedServices[index];
          const totalUnidadesServicio =
            cantidadPorServicio[service.idServicio] || 1;
          contadorUnidadPorServicio[service.idServicio] =
            (contadorUnidadPorServicio[service.idServicio] || 0) + 1;
          const numeroUnidad = contadorUnidadPorServicio[service.idServicio];

          return renderTarjetaHorario(
            [index],
            <>
              {service.codigo} - {service.descripcion}
              {totalUnidadesServicio > 1 && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  (Unidad {numeroUnidad} de {totalUnidadesServicio})
                </span>
              )}
            </>,
          );
        })}
      </div>
    </div>
  );
};
