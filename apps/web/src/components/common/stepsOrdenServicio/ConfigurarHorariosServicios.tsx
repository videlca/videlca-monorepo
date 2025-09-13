import type { CreateOrdenServicioTarifaDto } from "../../../api/dtos";
import type { Servicio } from "../../../api/types/servicio";
import { timeFormat } from "../../../utils/TimeFormat";
import { InputTime24H } from "../InputTime24H";

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
        {selectedServices.map((service) => (
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
                        placeholder="00:00"
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
                        placeholder="00:00"
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
        ))}
      </div>
    </div>
  );
};
