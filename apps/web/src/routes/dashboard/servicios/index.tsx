import Chip from "@mui/material/Chip";
import FormLabel from "@mui/material/FormLabel";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { InfoTile } from "../../../components/ui/common/InfoTile";
import { createFileRoute } from "@tanstack/react-router";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import BarChartIcon from "@mui/icons-material/BarChart";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
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
    control: controlAgregar,
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
    control: controlEditar,
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
          Icon={AddIcon}
          label="Agregar Servicio"
          onClick={() => setIsOpenAddModal(true)}
        />
      </div> */}

      <div className="flex flex-col gap-6">
        {serviciosData.map(([key, value]: [string, any]) => {
          return (
            <div key={key} className="flex flex-col gap-2">
              <Typography variant="h4" component="h2" color="primary">
                {key}
              </Typography>
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
              Icon={DescriptionOutlinedIcon}
            >
              <div className="flex flex-col gap-2">
                <FormLabel htmlFor="codigo" required>
                  Código servicio (código referencia SIGO)
                </FormLabel>

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
                control={controlAgregar}
                name="idTipoServicio"
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
                control={controlAgregar}
                name="idTipoHorarioDescripcion"
                onOptionChange={(option) => {
                  const nombreSeleccionado = option.descripcion;
                  setTipoHorarioNombre(nombreSeleccionado);
                  setTipoDuracion(null);
                  setValueAgregar("idTipoTarifa", 0);
                  if (
                    nombreSeleccionado &&
                    !HORARIOS_CON_DOMINICAL.includes(nombreSeleccionado)
                  ) {
                    setValueAgregar("dominical", false);
                  }
                }}
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
                  control={controlAgregar}
                  name="idTipoDuracion"
                  onOptionChange={(option) => {
                    const nuevaDuracion =
                      tiposDuraciones?.data?.data?.find(
                        (tipo) =>
                          tipo.idTipoDuracion === option.id,
                      )?.descripcion === "flexible"
                        ? "flexible"
                        : "fija";
                    setTipoDuracion(nuevaDuracion);
                    setValueAgregar("idTipoTarifa", 0);
                  }}
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
                control={controlAgregar}
                name="idTipoTarifa"
              />
              <CheckboxForm
                label="Dominical"
                id="dominical"
                disabled={!permiteDominical}
                control={controlAgregar}
                name="dominical"
              />
            </FormSection>
            <FormSection
              title="Configuración de horas"
              description="Configuración de horas"
              Icon={ScheduleOutlinedIcon}
            >
              {ocultarDuracionYHoras && (
                <Typography variant="body2" color="text.secondary">
                  {esMixto
                    ? "El servicio es de horario mixto. La duración y las horas las calcula el sistema automáticamente."
                    : "El servicio cubre todo el día. No es necesario configurar horas."}
                </Typography>
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
              Icon={DescriptionOutlinedIcon}
            >
              <div className="flex flex-col gap-2">
                <FormLabel htmlFor="codigo" required>
                  Código servicio (código referencia SIGO)
                </FormLabel>

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
                control={controlEditar}
                name="idTipoServicio"
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
                control={controlEditar}
                name="idTipoHorarioDescripcion"
                onOptionChange={(option) => {
                  const nombreSeleccionado = option.descripcion;
                  setTipoHorarioNombre(nombreSeleccionado);
                  setTipoDuracion(null);
                  setValueEditar("idTipoTarifa", 0);
                  if (
                    nombreSeleccionado &&
                    !HORARIOS_CON_DOMINICAL.includes(nombreSeleccionado)
                  ) {
                    setValueEditar("dominical", false);
                  }
                }}
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
                  control={controlEditar}
                  name="idTipoDuracion"
                  onOptionChange={(option) => {
                    const nuevaDuracion =
                      tiposDuraciones?.data?.data?.find(
                        (tipo) =>
                          tipo.idTipoDuracion === option.id,
                      )?.descripcion === "flexible"
                        ? "flexible"
                        : "fija";
                    setTipoDuracion(nuevaDuracion);
                    setValueEditar("idTipoTarifa", 0);
                  }}
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
                control={controlEditar}
                name="idTipoTarifa"
              />
              <CheckboxForm
                label="Dominical"
                id="dominical"
                disabled={!permiteDominical}
                control={controlEditar}
                name="dominical"
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
              Icon={ScheduleOutlinedIcon}
            >
              {ocultarDuracionYHoras && (
                <Typography variant="body2" color="text.secondary">
                  {esMixto
                    ? "El servicio es de horario mixto. La duración y las horas las calcula el sistema automáticamente."
                    : "El servicio cubre todo el día. No es necesario configurar horas."}
                </Typography>
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
        <div className="flex flex-col gap-4">
          <InfoTile
            icon={<DescriptionOutlinedIcon />}
            value={servicio?.data?.codigo}
            label={servicio?.data?.descripcion}
            action={
              <Chip
                size="small"
                variant="outlined"
                icon={
                  servicio?.data?.idTipoServicio.requierePersonal ? (
                    <HowToRegOutlinedIcon />
                  ) : (
                    <PersonOffOutlinedIcon />
                  )
                }
                color={servicio?.data?.idTipoServicio.requierePersonal ? "success" : "error"}
                label={
                  servicio?.data?.idTipoServicio.requierePersonal
                    ? "Requiere personal"
                    : "No requiere personal"
                }
              />
            }
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoTile
              icon={<ShieldOutlinedIcon />}
              value={servicio?.data?.idTipoServicio.nombre}
              label="Tipo de Servicio"
            />
            <InfoTile
              value={<StateLabel state={!!servicio?.data?.estado} />}
              label="Estado"
            />
            <InfoTile
              icon={<CalendarMonthOutlinedIcon />}
              value={servicio?.data?.idTipoDuracion.descripcion}
              label="Tipo de Duración"
            />
            <InfoTile
              icon={<ScheduleOutlinedIcon />}
              value={servicio?.data?.idTipoHorarioDescripcion.descripcion}
              label="Tipo de Horario"
            />
            <InfoTile
              icon={<AttachMoneyIcon />}
              value={servicio?.data?.idTipoTarifa?.nombre}
              label="Tipo de Tarifa"
            />
            <InfoTile
              icon={<CalendarMonthOutlinedIcon />}
              value={servicio?.data?.dominical ? "Sí" : "No"}
              label="Dominical"
            />
          </div>

          {/* Configuración de Horas */}
          <Paper variant="outlined" className="p-4">
            <Typography variant="h6" className="flex items-center gap-2" sx={{ mb: 2 }}>
              <BarChartIcon fontSize="small" color="primary" />
              Configuración de Horas
            </Typography>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Mínimas", value: servicio?.data?.horasMinimas },
                { label: "Fijas", value: servicio?.data?.horasFijas },
                { label: "Máximas", value: servicio?.data?.horasMaximas },
              ].map((item) => (
                <div key={item.label}>
                  <Typography variant="h4" component="p">
                    {item.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                </div>
              ))}
            </div>
          </Paper>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => setIsOpenViewModal(false)}>
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
