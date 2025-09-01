import { ChevronDown, Search } from "lucide-react";
import { ButtonAction } from "../ButtonAction";
import { InputForm } from "../InputForm";
import { InputTime } from "../InputTime";
import type { CreateOrdenServicioTarifaDto } from "../../../api/dtos";
import type { Servicio } from "../../../api/types/servicio";
import { timeFormat } from "../../../utils/TimeFormat";
import type { Personal } from "../../../api/types/personal";

export const AsignacionPersonalServicio = ({
  selectedServices,
  configuracionServicioTarifa,
  setConfiguracionServicioTarifa,
  handleValidarEmpleadosDisponibles,
  validarEmpleadosDisponiblesData,
  isValidarEmpleadosDisponiblesPending,
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
  handleValidarEmpleadosDisponibles: (
    idServicio: number,
    index: number,
  ) => void;
  validarEmpleadosDisponiblesData: Personal[];
  isValidarEmpleadosDisponiblesPending: boolean;
}) => {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Personal y Asignación de horarios
        </h3>
        <p className="text-sm text-gray-600">
          Define cuánto personal necesita y asígnelo inmediatamente para cada
          servicio.
        </p>
      </div>
      {/* TODO: Revisar asignación de personal y horarios */}
      {selectedServices.map((service, index) => (
        <div
          key={service.idServicio}
          className="space-y-2 rounded-lg border border-gray-200 p-4"
        >
          <h4 className="text-sm font-medium text-gray-900">
            {service.codigo} - {service.descripcion}
          </h4>
          {!service.idTipoServicio.requierePersonal && (
            <p className="text-sm text-gray-600">
              No es necesario asignar personal para este servicio. Ya que el
              tipo de servicio no requiere personal.
            </p>
          )}
          {service.idTipoServicio.requierePersonal && (
            <>
              <p className="text-sm text-gray-600">
                Seleccione la cantidad de personal requerido para este servicio.
              </p>
              <div className="space-y-4">
                <InputForm
                  label="Cantidad de Personal Requerido *"
                  placeholder="0"
                  type="number"
                  id="cantidadPersonal"
                  value={
                    configuracionServicioTarifa[
                      index
                    ]?.cantidadPersonal.toString() || "0"
                  }
                  onChange={(e) => {
                    setConfiguracionServicioTarifa(
                      (prev: CreateOrdenServicioTarifaDto[]) => {
                        const newArray = [...prev];
                        const index = newArray.findIndex(
                          (s) => s.idServicio === service.idServicio,
                        );
                        newArray[index] = {
                          ...newArray[index],
                          cantidadPersonal: Number(e.target.value),
                        };
                        return newArray;
                      },
                    );
                  }}
                />

                {Array.from(
                  {
                    length:
                      configuracionServicioTarifa.find(
                        (s) => s.idServicio === service.idServicio,
                      )?.cantidadPersonal || 0,
                  },
                  (_, index) => {
                    return (
                      <div
                        key={index}
                        className="mt-4 rounded-lg border border-gray-200 p-4 shadow-sm"
                      >
                        <div className="mb-4 border-b border-gray-200 pb-3">
                          <h3 className="text-base font-semibold text-gray-900">
                            Empleado #{index + 1}
                          </h3>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <InputTime
                                label="Hora de Inicio"
                                placeholder="00:00"
                                id={`horaInicio-${index}`}
                                value={
                                  configuracionServicioTarifa.find(
                                    (s) => s.idServicio === service.idServicio,
                                  )?.personal[index]?.horaInicio || ""
                                }
                                onChange={(e) =>
                                  setConfiguracionServicioTarifa(
                                    (prev: CreateOrdenServicioTarifaDto[]) => {
                                      const newArray = [...prev];
                                      const indexServicio = newArray.findIndex(
                                        (s) =>
                                          s.idServicio === service.idServicio,
                                      );

                                      // Ensure personal array exists and has enough elements
                                      if (!newArray[indexServicio].personal) {
                                        newArray[indexServicio].personal = [];
                                      }

                                      // Ensure the personal array has the correct length
                                      while (
                                        newArray[indexServicio].personal
                                          .length <= index
                                      ) {
                                        newArray[indexServicio].personal.push({
                                          idPersonal: 0,
                                          horaInicio: "",
                                          horaFin: "",
                                        });
                                      }

                                      // Update the personal array at the specific index
                                      const updatedPersonal = [
                                        ...newArray[indexServicio].personal,
                                      ];
                                      updatedPersonal[index] = {
                                        ...updatedPersonal[index],
                                        horaInicio: timeFormat(e.target.value),
                                      };

                                      newArray[indexServicio] = {
                                        ...newArray[indexServicio],
                                        personal: updatedPersonal,
                                      };
                                      return newArray;
                                    },
                                  )
                                }
                              />
                            </div>
                            <div className="flex-1">
                              <InputTime
                                label="Hora de Fin"
                                placeholder="00:00"
                                id={`horaFin-${index}`}
                                value={
                                  configuracionServicioTarifa.find(
                                    (s) => s.idServicio === service.idServicio,
                                  )?.personal[index]?.horaFin || ""
                                }
                                onChange={(e) =>
                                  setConfiguracionServicioTarifa(
                                    (prev: CreateOrdenServicioTarifaDto[]) => {
                                      const newArray = [...prev];
                                      const indexServicio = newArray.findIndex(
                                        (s) =>
                                          s.idServicio === service.idServicio,
                                      );

                                      // Ensure personal array exists and has enough elements
                                      if (!newArray[indexServicio].personal) {
                                        newArray[indexServicio].personal = [];
                                      }

                                      // Ensure the personal array has the correct length
                                      while (
                                        newArray[indexServicio].personal
                                          .length <= index
                                      ) {
                                        newArray[indexServicio].personal.push({
                                          idPersonal: 0,
                                          horaInicio: "",
                                          horaFin: "",
                                        });
                                      }

                                      // Update the personal array at the specific index
                                      const updatedPersonal = [
                                        ...newArray[indexServicio].personal,
                                      ];
                                      updatedPersonal[index] = {
                                        ...updatedPersonal[index],
                                        horaFin: timeFormat(e.target.value),
                                      };

                                      newArray[indexServicio] = {
                                        ...newArray[indexServicio],
                                        personal: updatedPersonal,
                                      };
                                      return newArray;
                                    },
                                  )
                                }
                              />
                            </div>
                            <div className="mb-1 flex flex-col gap-2">
                              <label className="text-sm font-medium text-gray-700">
                                Buscar Empleado
                              </label>
                              <ButtonAction
                                Icon={Search}
                                label=""
                                color="blue"
                                disabled={
                                  configuracionServicioTarifa.find(
                                    (s) => s.idServicio === service.idServicio,
                                  )?.personal[index]?.horaInicio === "" ||
                                  isValidarEmpleadosDisponiblesPending
                                }
                                onClick={() => {
                                  handleValidarEmpleadosDisponibles(
                                    service.idServicio,
                                    index,
                                  );
                                }}
                              />
                            </div>
                          </div>
                          <label
                            htmlFor={`empleado-${index}`}
                            className="text-sm text-gray-700"
                          >
                            Seleccionar Empleado *
                            <div className="relative mt-1">
                              <select
                                value={
                                  configuracionServicioTarifa
                                    .find(
                                      (s) =>
                                        s.idServicio === service.idServicio,
                                    )
                                    ?.personal[index]?.idPersonal.toString() ||
                                  ""
                                }
                                onChange={(e) => {
                                  setConfiguracionServicioTarifa(
                                    (prev: CreateOrdenServicioTarifaDto[]) => {
                                      const newArray = [...prev];
                                      const indexServicio = newArray.findIndex(
                                        (s) =>
                                          s.idServicio === service.idServicio,
                                      );
                                      newArray[indexServicio].personal[index] =
                                        {
                                          ...newArray[indexServicio].personal[
                                            index
                                          ],
                                          idPersonal: Number.parseInt(
                                            e.target.value,
                                          ),
                                        };
                                      return newArray;
                                    },
                                  );
                                }}
                                className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              >
                                <option value="">
                                  Seleccionar empleado...
                                </option>
                                {validarEmpleadosDisponiblesData?.map(
                                  (employee) => (
                                    <option
                                      key={employee.idPersonal}
                                      value={employee.idPersonal.toString()}
                                    >
                                      {employee.primerNombre}{" "}
                                      {employee.primerApellido} -{" "}
                                      {employee.telefono}
                                    </option>
                                  ),
                                )}
                              </select>
                              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            </div>
                          </label>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};
