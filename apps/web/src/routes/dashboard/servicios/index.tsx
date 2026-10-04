import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  PlusIcon,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";
import Table from "../../../components/common/Table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { Section } from "../../../components/ui/dashboard/Section";
import {
  useCreateServicio,
  useDeleteServicio,
  useServicioById,
  useServicios,
  useTipoDuracion,
  useTipoHorarioDescripcion,
  useTipoServicios,
  useUpdateServicio,
} from "../../../api/queryFunctions/servicios";
import { useTipoTarifa } from "../../../api/queryFunctions/tarifas";
import type { Servicio } from "../../../api/types/servicio";
import type { TipoTarifa } from "../../../api/types/periodo";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { useMemo, useState } from "react";
import { SimpleModal } from "../../../components/common/SimpleModal";
import Button from "../../../components/common/Button";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";

import type { CreateServicioDto, UpdateServicioDto } from "../../../api/dtos";
import { InputForm } from "../../../components/common/InputForm";
import { InputSelect } from "../../../components/common/InputSelect";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";
import { CheckboxForm } from "../../../components/common/CheckboxForm";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { FormSection } from "../../../components/common/FormSection";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";
import { useForm } from "react-hook-form";

export const Route = createFileRoute("/dashboard/servicios/")({
  component: RouteComponent,
});

// Nombres de tipo horario que tienen un rango de horas configurado (diurno/nocturno) y por lo tanto
// permiten el checkbox "dominical" (solo ellos tienen tarifa hora diferenciada dominical/festiva)
const HORARIOS_CON_DOMINICAL = ["diurno", "nocturno"];

// Determina, según el tipo de horario y (si aplica) el tipo de duración, qué tipos de tarifa
// puede elegir el usuario. Refleja las mismas reglas que valida el backend, solo para guiar la UI.
const filtrarTiposTarifaPermitidos = (
  tiposTarifa: TipoTarifa[],
  tipoHorarioNombre: string | null,
  tipoDuracion: string | null,
): TipoTarifa[] => {
  if (!tipoHorarioNombre) return [];

  if (tipoHorarioNombre.includes("dia completo")) {
    return tiposTarifa.filter(
      (tipo) => tipo.nombre === "mensual" || tipo.nombre === "por turno",
    );
  }

  if (tipoHorarioNombre === "mixto") {
    return tiposTarifa.filter(
      (tipo) => tipo.nombre === "por hora" || tipo.nombre === "por servicio",
    );
  }

  // Diurno / Nocturno: el tipo de tarifa permitido depende de la duración
  if (tipoDuracion === "flexible") {
    return tiposTarifa.filter((tipo) => tipo.nombre === "por hora");
  }

  if (tipoDuracion === "fija") {
    return tiposTarifa.filter(
      (tipo) => tipo.nombre === "mensual" || tipo.nombre === "por turno",
    );
  }

  return [];
};

function RouteComponent() {
  // Estados
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [isOpenEditModal, setIsOpenEditModal] = useState(false);
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
  const [isOpenViewModal, setIsOpenViewModal] = useState(false);
  const [servicioId, setServicioId] = useState<number | null>(null);
  const [tipoDuracion, setTipoDuracion] = useState<string | null>(null);
  // Nombre del tipo de horario seleccionado (diurno / nocturno / mixto / dia completo (24 horas))
  const [tipoHorarioNombre, setTipoHorarioNombre] = useState<string | null>(
    null,
  );

  const [codigoServicio, setCodigoServicio] = useState<{
    parte1: string;
    parte2: string;
    parte3: string;
  }>({
    parte1: "",
    parte2: "",
    parte3: "",
  });

  // Queries y Mutaciones
  const { data: servicios } = useServicios();
  const { data: tiposServicios } = useTipoServicios();
  const { data: tiposDuraciones } = useTipoDuracion();
  const { data: tiposHorarios } = useTipoHorarioDescripcion();
  const { data: tiposTarifas } = useTipoTarifa();

  const { mutate: agregarServicio, isPending: isLoadingAgregarServicio } =
    useCreateServicio();
  const { mutate: actualizarServicio, isPending: isLoadingActualizarServicio } =
    useUpdateServicio();
  const { mutate: eliminarServicio } = useDeleteServicio();
  const { data: servicio, mutate: obtenerServicioById } = useServicioById();

  // Reglas derivadas del tipo de horario seleccionado
  const esDiaCompleto = tipoHorarioNombre?.includes("dia completo") ?? false;
  const esMixto = tipoHorarioNombre === "mixto";
  // Para "mixto" y "dia completo" el backend calcula/sobreescribe la duración y las horas, por eso se ocultan
  const ocultarDuracionYHoras = esDiaCompleto || esMixto;
  const permiteDominical = tipoHorarioNombre
    ? HORARIOS_CON_DOMINICAL.includes(tipoHorarioNombre)
    : false;

  // Id del tipo de duración "flexible": para horario mixto el backend exige que la duración enviada
  // ya sea flexible (la valida, no la infiere), así que se envía automáticamente sin mostrarla en el form
  const idTipoDuracionFlexible = useMemo(
    () =>
      tiposDuraciones?.data?.data?.find(
        (tipo) => tipo.descripcion === "flexible",
      )?.idTipoDuracion,
    [tiposDuraciones?.data?.data],
  );

  const tipoTarifaOptions = useMemo(
    () =>
      filtrarTiposTarifaPermitidos(
        tiposTarifas?.data?.data || [],
        tipoHorarioNombre,
        tipoDuracion,
      ),
    [tiposTarifas?.data?.data, tipoHorarioNombre, tipoDuracion],
  );

  // Formularios con react-hook-form
  const {
    register: registerAgregar,
    handleSubmit: handleSubmitAgregar,
    reset: resetAgregar,
    setValue: setValueAgregar,
  } = useForm<CreateServicioDto>({
    defaultValues: {
      codigo: "",
      descripcion: "",
      idTipoServicio: 0,
      idTipoDuracion: 0,
      idTipoHorarioDescripcion: 0,
      idTipoTarifa: 0,
      horasFijas: 0,
      horasMinimas: 0,
      horasMaximas: 0,
      dominical: false,
    },
  });

  const {
    register: registerEditar,
    handleSubmit: handleSubmitEditar,
    reset: resetEditar,
    setValue: setValueEditar,
  } = useForm<UpdateServicioDto>({
    defaultValues: {
      codigo: "",
      descripcion: "",
      idTipoServicio: 0,
      idTipoDuracion: 0,
      idTipoHorarioDescripcion: 0,
      idTipoTarifa: 0,
      horasFijas: 0,
      horasMinimas: 0,
      horasMaximas: 0,
      dominical: false,
      estado: true,
    },
  });

  const columns: ColumnDef<Servicio>[] = [
    {
      header: "Código",
      accessorKey: "codigo",
    },
    {
      header: "Descripción",
      accessorKey: "descripcion",
      cell: ({ row }) => {
        return (
          <span className="whitespace-nowrap">{row.original.descripcion}</span>
        );
      },
    },
    // {
    //   header: "Duración",
    //   accessorKey: "idTipoDuracion.descripcion",
    //   cell: ({ row }) => {
    //     return (
    //       <span className="whitespace-nowrap">
    //         {row.original.idTipoDuracion.descripcion}
    //       </span>
    //     );
    //   },
    // },
    // {
    //   header: "Horario",
    //   accessorKey: "idTipoHorarioDescripcion.nombre",
    //   cell: ({ row }) => {
    //     return (
    //       <span className="whitespace-nowrap">
    //         {row.original.idTipoHorarioDescripcion.nombre}
    //       </span>
    //     );
    //   },
    // },
    // {
    //   header: "Tarifa",
    //   cell: ({ row }) => {
    //     return (
    //       <div className="flex flex-col gap-1 whitespace-nowrap">
    //         <span>{row.original.idTipoTarifa?.nombre}</span>
    //         {row.original.dominical && (
    //           <span className="text-xs text-blue-600">Dominical</span>
    //         )}
    //       </div>
    //     );
    //   },
    // },
    // {
    //   header: "Horas",
    //   cell: ({ row }) => {
    //     if (row.original.idTipoDuracion?.descripcion === "fija") {
    //       return (
    //         <div className="flex flex-col gap-2">
    //           <p>Fijas: {row.original.horasFijas}</p>
    //         </div>
    //       );
    //     }
    //     if (row.original.idTipoDuracion?.descripcion === "flexible") {
    //       return (
    //         <div className="flex flex-col gap-2 whitespace-nowrap">
    //           <span>Mínimas: {row.original.horasMinimas}</span>
    //           <span>Máximas: {row.original.horasMaximas}</span>
    //         </div>
    //       );
    //     }
    //   },
    // },
    // {
    //   header: "Estado",
    //   cell: ({ row }) => {
    //     return <StateLabel state={row.original.estado} />;
    //   },
    // },
    // {
    //   header: "Acciones",
    //   cell: ({ row }) => (
    //     <MoreActionsButton
    //       menuId={`actions-${row.original.idServicio}`}
    //       actions={[
    //         {
    //           label: "Editar",
    //           onClick: () => {
    //             setServicioId(row.original.idServicio);
    //             resetEditar({
    //               codigo: row.original.codigo,
    //               descripcion: row.original.descripcion,
    //               idTipoServicio: row.original.idTipoServicio.idTipoServicio,
    //               idTipoDuracion: row.original.idTipoDuracion.idTipoDuracion,
    //               idTipoHorarioDescripcion:
    //                 row.original.idTipoHorarioDescripcion
    //                   .idTipoHorarioDescripcion,
    //               idTipoTarifa: row.original.idTipoTarifa?.idTipoTarifa,
    //               horasFijas: row.original.horasFijas,
    //               horasMinimas: row.original.horasMinimas,
    //               horasMaximas: row.original.horasMaximas,
    //               dominical: row.original.dominical,
    //               estado: row.original.estado,
    //             });
    //             setCodigoServicio({
    //               parte1: row.original.codigo.split("-")[0],
    //               parte2: row.original.codigo.split("-")[1],
    //               parte3: row.original.codigo.split("-")[2],
    //             });
    //             setIsOpenEditModal(true);
    //             setTipoDuracion(row.original.idTipoDuracion.descripcion);
    //             setTipoHorarioNombre(
    //               row.original.idTipoHorarioDescripcion.nombre,
    //             );
    //           },
    //         },
    //         {
    //           label: "Ver",
    //           onClick: () => {
    //             obtenerServicioById(row.original.idServicio, {
    //               onSuccess: () => {
    //                 setIsOpenViewModal(true);
    //               },
    //             });
    //           },
    //         },
    //         {
    //           label: "Eliminar",
    //           onClick: () => {
    //             setServicioId(row.original.idServicio);
    //             setIsOpenDeleteModal(true);
    //           },
    //           color: "red" as const,
    //         },
    //       ]}
    //     />
    //   ),
    // },
  ];

  const serviciosData = useMemo(
    () => Object.entries(servicios?.data || []),
    [servicios?.data],
  );
  return (
    <Section>
      {/* <div className="flex justify-end">
        <ButtonAction
          Icon={PlusIcon}
          label="Agregar Servicio"
          onClick={() => setIsOpenAddModal(true)}
        />
      </div> */}

      <div className="flex flex-col gap-6">
        {serviciosData.map(([key, value]: [string, any]) => {
          return (
            <div
              key={key}
              className="rounded-lg border border-blue-200 bg-blue-100/70 pt-2"
            >
              <h2 className="mb-2 w-fit rounded-lg p-2 px-4 text-xl font-medium text-blue-600">
                {key}
              </h2>
              <Table
                columns={columns}
                data={value || []}
                enablePagination={false}
              />
            </div>
          );
        })}
      </div>

      <SimpleModal
        isOpen={isOpenAddModal}
        onClose={() => {
          setIsOpenAddModal(false);
          resetAgregar();
          setTipoDuracion(null);
          setTipoHorarioNombre(null);
          setCodigoServicio({
            parte1: "",
            parte2: "",
            parte3: "",
          });
        }}
        title="Agregar Servicio"
        size="xl"
      >
        <FormsModal
          onSubmit={handleSubmitAgregar((data) => {
            agregarServicio(
              {
                ...data,
                idTipoServicio: Number(data.idTipoServicio),
                idTipoDuracion: esMixto
                  ? (idTipoDuracionFlexible ?? 0)
                  : esDiaCompleto
                    ? 0
                    : Number(data.idTipoDuracion),
                idTipoHorarioDescripcion: Number(
                  data.idTipoHorarioDescripcion,
                ),
                idTipoTarifa: Number(data.idTipoTarifa),
                horasFijas: ocultarDuracionYHoras
                  ? 0
                  : Number(data.horasFijas),
                horasMinimas: ocultarDuracionYHoras
                  ? 0
                  : Number(data.horasMinimas),
                horasMaximas: ocultarDuracionYHoras
                  ? 0
                  : Number(data.horasMaximas),
                dominical: permiteDominical
                  ? Boolean(data.dominical)
                  : false,
                codigo: `${codigoServicio.parte1}-${codigoServicio.parte2}-${codigoServicio.parte3}`,
              },
              {
                onSuccess: () => {
                  setIsOpenAddModal(false);
                  resetAgregar();
                  setTipoDuracion(null);
                  setTipoHorarioNombre(null);
                  setCodigoServicio({
                    parte1: "",
                    parte2: "",
                    parte3: "",
                  });
                },
              },
            );
          })}
          isLoading={isLoadingAgregarServicio}
          onCancel={() => {
            setIsOpenAddModal(false);
            resetAgregar();
            setTipoDuracion(null);
            setTipoHorarioNombre(null);
            setCodigoServicio({
              parte1: "",
              parte2: "",
              parte3: "",
            });
          }}
          updating={false}
        >
          <div className="flex flex-col gap-4">
            <FormSection
              title="Datos del servicio"
              description="Datos del servicio"
              Icon={FileText}
            >
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="codigo"
                  className="text-sm font-medium text-gray-700"
                >
                  Código servicio (código referencia SIGO)*
                </label>

                <div className="flex flex-row items-center justify-center gap-2">
                  <InputForm
                    showLabel={false}
                    placeholder="00"
                    type="number"
                    id="parte1"
                    value={codigoServicio.parte1}
                    onChange={(e) =>
                      setCodigoServicio({
                        ...codigoServicio,
                        parte1: e.target.value,
                      })
                    }
                    required={true}
                  />
                  <InputForm
                    showLabel={false}
                    placeholder="00"
                    type="number"
                    id="parte2"
                    value={codigoServicio.parte2}
                    onChange={(e) =>
                      setCodigoServicio({
                        ...codigoServicio,
                        parte2: e.target.value,
                      })
                    }
                    required={true}
                  />
                  <InputForm
                    showLabel={false}
                    placeholder="00"
                    type="number"
                    id="parte3"
                    value={codigoServicio.parte3}
                    onChange={(e) =>
                      setCodigoServicio({
                        ...codigoServicio,
                        parte3: e.target.value,
                      })
                    }
                    required={true}
                  />
                </div>
              </div>
              <InputForm
                label="Descripción (máximo 50 caracteres) *"
                placeholder="Descripción"
                type="text"
                id="descripcion"
                required={true}
                {...registerAgregar("descripcion")}
              />
              <InputSelect
                label="Tipo de servicio *"
                placeholder="Tipo de servicio"
                options={
                  tiposServicios?.data?.data?.map((tipo) => ({
                    id: tipo.idTipoServicio,
                    descripcion: tipo.descripcion,
                  })) || []
                }
                id="idTipoServicio"
                required={true}
                {...registerAgregar("idTipoServicio")}
              />
              <InputSelect
                label="Tipo de horario *"
                placeholder="Tipo de horario"
                options={
                  tiposHorarios?.data?.data.map((tipo) => ({
                    id: tipo.idTipoHorarioDescripcion,
                    descripcion: tipo.nombre,
                  })) || []
                }
                id="idTipoHorarioDescripcion"
                required={true}
                {...registerAgregar("idTipoHorarioDescripcion", {
                  onChange: (e) => {
                    const nombreSeleccionado =
                      e.target.selectedOptions[0]?.text || null;
                    setTipoHorarioNombre(nombreSeleccionado);
                    setTipoDuracion(null);
                    setValueAgregar("idTipoTarifa", 0);
                    if (
                      nombreSeleccionado &&
                      !HORARIOS_CON_DOMINICAL.includes(nombreSeleccionado)
                    ) {
                      setValueAgregar("dominical", false);
                    }
                  },
                })}
              />
              {!ocultarDuracionYHoras && (
                <InputSelect
                  label="Tipo de duración *"
                  placeholder="Tipo de duración"
                  options={
                    tiposDuraciones?.data?.data?.map((tipo) => ({
                      id: tipo.idTipoDuracion,
                      descripcion: tipo.descripcion,
                    })) || []
                  }
                  id="idTipoDuracion"
                  required={true}
                  {...registerAgregar("idTipoDuracion", {
                    onChange: (e) => {
                      const nuevaDuracion =
                        tiposDuraciones?.data?.data?.find(
                          (tipo) =>
                            tipo.idTipoDuracion === Number(e.target.value),
                        )?.descripcion === "flexible"
                          ? "flexible"
                          : "fija";
                      setTipoDuracion(nuevaDuracion);
                      setValueAgregar("idTipoTarifa", 0);
                    },
                  })}
                />
              )}
              <InputSelect
                label="Tipo de tarifa *"
                placeholder={
                  tipoTarifaOptions.length > 0
                    ? "Tipo de tarifa"
                    : "Seleccione primero el tipo de horario y duración"
                }
                options={tipoTarifaOptions.map((tipo) => ({
                  id: tipo.idTipoTarifa,
                  descripcion: tipo.nombre,
                }))}
                id="idTipoTarifa"
                required={true}
                disabled={tipoTarifaOptions.length === 0}
                {...registerAgregar("idTipoTarifa")}
              />
              <CheckboxForm
                label="Dominical"
                id="dominical"
                disabled={!permiteDominical}
                {...registerAgregar("dominical")}
              />
            </FormSection>
            <FormSection
              title="Configuración de horas"
              description="Configuración de horas"
              Icon={Clock}
            >
              {ocultarDuracionYHoras && (
                <span className="text-sm text-gray-500">
                  {esMixto
                    ? "El servicio es de horario mixto. La duración y las horas las calcula el sistema automáticamente."
                    : "El servicio cubre todo el día. No es necesario configurar horas."}
                </span>
              )}
              {!ocultarDuracionYHoras && tipoDuracion === "fija" && (
                <InputForm
                  label="Horas fijas *"
                  placeholder="Horas fijas"
                  type="number"
                  id="horasFijas"
                  required={true}
                  {...registerAgregar("horasFijas")}
                />
              )}
              {!ocultarDuracionYHoras && tipoDuracion === "flexible" && (
                <>
                  <InputForm
                    label="Horas mínimas *"
                    placeholder="Horas mínimas"
                    type="number"
                    id="horasMinimas"
                    required={true}
                    {...registerAgregar("horasMinimas")}
                  />
                  <InputForm
                    label="Horas máximas *"
                    placeholder="Horas máximas"
                    type="number"
                    id="horasMaximas"
                    required={true}
                    {...registerAgregar("horasMaximas")}
                  />
                </>
              )}
            </FormSection>
          </div>
        </FormsModal>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenEditModal}
        onClose={() => {
          setIsOpenEditModal(false);
          resetEditar();
          setTipoDuracion(null);
          setTipoHorarioNombre(null);
          setCodigoServicio({
            parte1: "",
            parte2: "",
            parte3: "",
          });
        }}
        title="Editar Servicio"
        size="xl"
      >
        <FormsModal
          onSubmit={handleSubmitEditar((data) => {
            const horasFijas =
              tipoDuracion === "fija" ? Number(data.horasFijas) : 0;
            const horasMinimas =
              tipoDuracion === "flexible" ? Number(data.horasMinimas) : 0;
            const horasMaximas =
              tipoDuracion === "flexible" ? Number(data.horasMaximas) : 0;

            actualizarServicio(
              {
                id: servicioId || 0,
                data: {
                  ...data,
                  idTipoServicio: Number(data.idTipoServicio),
                  idTipoDuracion: esMixto
                    ? (idTipoDuracionFlexible ?? 0)
                    : esDiaCompleto
                      ? 0
                      : Number(data.idTipoDuracion),
                  idTipoHorarioDescripcion: Number(
                    data.idTipoHorarioDescripcion,
                  ),
                  idTipoTarifa: Number(data.idTipoTarifa),
                  estado: String(data.estado) === "true",
                  codigo: `${codigoServicio.parte1}-${codigoServicio.parte2}-${codigoServicio.parte3}`,
                  horasFijas: ocultarDuracionYHoras ? 0 : horasFijas,
                  horasMinimas: ocultarDuracionYHoras ? 0 : horasMinimas,
                  horasMaximas: ocultarDuracionYHoras ? 0 : horasMaximas,
                  dominical: permiteDominical
                    ? Boolean(data.dominical)
                    : false,
                },
              },
              {
                onSuccess: () => {
                  setIsOpenEditModal(false);
                  resetEditar();
                  setTipoDuracion(null);
                  setTipoHorarioNombre(null);
                  setCodigoServicio({
                    parte1: "",
                    parte2: "",
                    parte3: "",
                  });
                },
              },
            );
          })}
          isLoading={isLoadingActualizarServicio}
          onCancel={() => {
            setIsOpenEditModal(false);
            resetEditar();
            setTipoDuracion(null);
            setTipoHorarioNombre(null);
            setCodigoServicio({
              parte1: "",
              parte2: "",
              parte3: "",
            });
          }}
          updating={true}
        >
          <div className="flex flex-col gap-4">
            <FormSection
              title="Datos del servicio"
              description="Datos del servicio"
              Icon={FileText}
            >
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="codigo"
                  className="text-sm font-medium text-gray-700"
                >
                  Código servicio (código referencia SIGO)*
                </label>

                <div className="flex flex-row items-center justify-center gap-2">
                  <InputForm
                    showLabel={false}
                    placeholder="00"
                    type="number"
                    id="parte1"
                    value={codigoServicio.parte1}
                    onChange={(e) =>
                      setCodigoServicio({
                        ...codigoServicio,
                        parte1: e.target.value,
                      })
                    }
                  />
                  <InputForm
                    showLabel={false}
                    placeholder="00"
                    type="number"
                    id="parte2"
                    value={codigoServicio.parte2}
                    onChange={(e) =>
                      setCodigoServicio({
                        ...codigoServicio,
                        parte2: e.target.value,
                      })
                    }
                  />
                  <InputForm
                    showLabel={false}
                    placeholder="00"
                    type="number"
                    id="parte3"
                    value={codigoServicio.parte3}
                    onChange={(e) =>
                      setCodigoServicio({
                        ...codigoServicio,
                        parte3: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <InputForm
                label="Descripción (máximo 50 caracteres) *"
                placeholder="Descripción"
                type="text"
                id="descripcion"
                required={true}
                {...registerEditar("descripcion")}
              />
              <InputSelect
                label="Tipo de servicio *"
                placeholder="Tipo de servicio"
                options={
                  tiposServicios?.data?.data?.map((tipo) => ({
                    id: tipo.idTipoServicio,
                    descripcion: tipo.descripcion,
                  })) || []
                }
                id="idTipoServicio"
                required={true}
                {...registerEditar("idTipoServicio")}
              />
              <InputSelect
                label="Tipo de horario *"
                placeholder="Tipo de horario"
                options={
                  tiposHorarios?.data?.data?.map((tipo) => ({
                    id: tipo.idTipoHorarioDescripcion,
                    descripcion: tipo.nombre,
                  })) || []
                }
                id="idTipoHorarioDescripcion"
                required={true}
                {...registerEditar("idTipoHorarioDescripcion", {
                  onChange: (e) => {
                    const nombreSeleccionado =
                      e.target.selectedOptions[0]?.text || null;
                    setTipoHorarioNombre(nombreSeleccionado);
                    setTipoDuracion(null);
                    setValueEditar("idTipoTarifa", 0);
                    if (
                      nombreSeleccionado &&
                      !HORARIOS_CON_DOMINICAL.includes(nombreSeleccionado)
                    ) {
                      setValueEditar("dominical", false);
                    }
                  },
                })}
              />
              {!ocultarDuracionYHoras && (
                <InputSelect
                  label="Tipo de duración *"
                  placeholder="Tipo de duración"
                  options={
                    tiposDuraciones?.data?.data?.map((tipo) => ({
                      id: tipo.idTipoDuracion,
                      descripcion: tipo.descripcion,
                    })) || []
                  }
                  id="idTipoDuracion"
                  required={true}
                  {...registerEditar("idTipoDuracion", {
                    onChange: (e) => {
                      const nuevaDuracion =
                        tiposDuraciones?.data?.data?.find(
                          (tipo) =>
                            tipo.idTipoDuracion === Number(e.target.value),
                        )?.descripcion === "flexible"
                          ? "flexible"
                          : "fija";
                      setTipoDuracion(nuevaDuracion);
                      setValueEditar("idTipoTarifa", 0);
                    },
                  })}
                />
              )}
              <InputSelect
                label="Tipo de tarifa *"
                placeholder={
                  tipoTarifaOptions.length > 0
                    ? "Tipo de tarifa"
                    : "Seleccione primero el tipo de horario y duración"
                }
                options={tipoTarifaOptions.map((tipo) => ({
                  id: tipo.idTipoTarifa,
                  descripcion: tipo.nombre,
                }))}
                id="idTipoTarifa"
                required={true}
                disabled={tipoTarifaOptions.length === 0}
                {...registerEditar("idTipoTarifa")}
              />
              <CheckboxForm
                label="Dominical"
                id="dominical"
                disabled={!permiteDominical}
                {...registerEditar("dominical")}
              />
              <InputSelectStateBoolean
                label="Estado"
                placeholder="Estado"
                id="estado"
                {...registerEditar("estado")}
              />
            </FormSection>
            <FormSection
              title="Configuración de horas"
              description="Configuración de horas"
              Icon={Clock}
            >
              {ocultarDuracionYHoras && (
                <span className="text-sm text-gray-500">
                  {esMixto
                    ? "El servicio es de horario mixto. La duración y las horas las calcula el sistema automáticamente."
                    : "El servicio cubre todo el día. No es necesario configurar horas."}
                </span>
              )}
              {!ocultarDuracionYHoras && tipoDuracion === "fija" && (
                <InputForm
                  label="Horas fijas"
                  placeholder="Horas fijas"
                  type="number"
                  id="horasFijas"
                  required={true}
                  {...registerEditar("horasFijas")}
                />
              )}
              {!ocultarDuracionYHoras && tipoDuracion === "flexible" && (
                <>
                  <InputForm
                    label="Horas mínimas"
                    placeholder="Horas mínimas"
                    type="number"
                    id="horasMinimas"
                    required={true}
                    {...registerEditar("horasMinimas")}
                  />
                  <InputForm
                    label="Horas máximas"
                    placeholder="Horas máximas"
                    type="number"
                    id="horasMaximas"
                    required={true}
                    {...registerEditar("horasMaximas")}
                  />
                </>
              )}
            </FormSection>
          </div>
        </FormsModal>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenViewModal}
        onClose={() => setIsOpenViewModal(false)}
        title="Ver Servicio"
        size="xl"
      >
        <div className="space-y-4">
          <div className="relative flex items-start gap-3 rounded-lg bg-gray-50 p-3">
            <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-600" />
            <div className="flex-1">
              <div className="mb-1 text-sm font-medium text-gray-900">
                {servicio?.data?.codigo}
              </div>
              <div className="text-sm text-gray-700">
                {servicio?.data?.descripcion}
              </div>
            </div>

            <div className="absolute top-3 right-3 flex items-center gap-2">
              {servicio?.data?.idTipoServicio.requierePersonal ? (
                <UserCheck className="h-4 w-4 text-green-500" />
              ) : (
                <UserX className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm text-gray-700">
                {servicio?.data?.idTipoServicio.requierePersonal
                  ? "Requiere personal"
                  : "No requiere personal"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Shield className="h-5 w-5 flex-shrink-0 text-purple-600" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {servicio?.data?.idTipoServicio.nombre}
                </div>
                <div className="text-xs text-gray-500">Tipo de Servicio</div>
              </div>
              {servicio?.data?.idTipoServicio.requierePersonal && (
                <UserCheck className="h-4 w-4 text-blue-500" />
              )}
            </div>

            {/* Estado */}
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <div
                className={`h-5 w-5 flex-shrink-0 rounded-full ${servicio?.data?.estado ? "bg-green-500" : "bg-red-500"}`}
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {servicio?.data?.estado ? "Activo" : "Inactivo"}
                </div>
                <div className="text-xs text-gray-500">Estado</div>
              </div>
            </div>

            {/* Duración */}
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Calendar className="h-5 w-5 flex-shrink-0 text-orange-600" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {servicio?.data?.idTipoDuracion.descripcion}
                </div>
                <div className="text-xs text-gray-500">Tipo de Duración</div>
              </div>
            </div>

            {/* Horario */}
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Clock className="h-5 w-5 flex-shrink-0 text-indigo-600" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {servicio?.data?.idTipoHorarioDescripcion.descripcion}
                </div>
                <div className="text-xs text-gray-500">Tipo de Horario</div>
              </div>
            </div>

            {/* Tipo de tarifa */}
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <DollarSign className="h-5 w-5 flex-shrink-0 text-teal-600" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {servicio?.data?.idTipoTarifa?.nombre}
                </div>
                <div className="text-xs text-gray-500">Tipo de Tarifa</div>
              </div>
            </div>

            {/* Dominical */}
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <div
                className={`h-5 w-5 flex-shrink-0 rounded-full ${servicio?.data?.dominical ? "bg-green-500" : "bg-gray-300"}`}
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {servicio?.data?.dominical ? "Sí" : "No"}
                </div>
                <div className="text-xs text-gray-500">Dominical</div>
              </div>
            </div>
          </div>

          {/* Configuración de Horas */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Configuración de Horas
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {servicio?.data?.horasMinimas}
                </div>
                <div className="text-xs text-gray-600">Mínimas</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {servicio?.data?.horasFijas}
                </div>
                <div className="text-xs font-medium text-blue-600">Fijas</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {servicio?.data?.horasMaximas}
                </div>
                <div className="text-xs text-gray-600">Máximas</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          <Button
            onClick={() => {
              setIsOpenViewModal(false);
            }}
            className="w-auto bg-gray-500 hover:bg-gray-600"
          >
            Cerrar
          </Button>
        </div>
      </SimpleModal>

      <ConfirmarDelete
        isOpenDelete={isOpenDeleteModal}
        text="¿Estás seguro de querer eliminar este servicio?"
        onDelete={() => {
          eliminarServicio(servicioId || 0, {
            onSuccess: () => {
              setIsOpenDeleteModal(false);
            },
          });
        }}
        onClose={() => setIsOpenDeleteModal(false)}
      />
    </Section>
  );
}
