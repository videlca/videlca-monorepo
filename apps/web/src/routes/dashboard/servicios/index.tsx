import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Calendar,
  Clock,
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
import type { Servicio } from "../../../api/types/servicio";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { useMemo, useState } from "react";
import { SimpleModal } from "../../../components/common/SimpleModal";
import Button from "../../../components/common/Button";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { useForm } from "../../../hooks/useForm";
import type { CreateServicioDto, UpdateServicioDto } from "../../../api/dtos";
import { InputForm } from "../../../components/common/InputForm";
import { InputSelect } from "../../../components/common/InputSelect";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { FormSection } from "../../../components/common/FormSection";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";

export const Route = createFileRoute("/dashboard/servicios/")({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [isOpenEditModal, setIsOpenEditModal] = useState(false);
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
  const [isOpenViewModal, setIsOpenViewModal] = useState(false);
  const [servicioId, setServicioId] = useState<number | null>(null);
  const [tipoDuracion, setTipoDuracion] = useState<string | null>(null);
  const [tipoHorarioDescripcion, setTipoHorarioDescripcion] = useState<
    boolean | null
  >(null);

  // Queries y Mutaciones
  const { data: servicios } = useServicios();
  const { data: tiposServicios } = useTipoServicios();
  const { data: tiposDuraciones } = useTipoDuracion();
  const { data: tiposHorarios } = useTipoHorarioDescripcion();

  const { mutate: agregarServicio, isPending: isLoadingAgregarServicio } =
    useCreateServicio();
  const { mutate: actualizarServicio, isPending: isLoadingActualizarServicio } =
    useUpdateServicio();
  const { mutate: eliminarServicio } = useDeleteServicio();
  const { data: servicio, mutate: obtenerServicioById } = useServicioById();

  // Formularios
  const {
    form: formAgregarServicio,
    handleChange: handleChangeAgregarServicio,
    resetForm: resetFormAgregarServicio,
  } = useForm<CreateServicioDto>({
    codigo: "",
    descripcion: "",
    idTipoServicio: 0,
    idTipoDuracion: 0,
    idTipoHorarioDescripcion: 0,
    horasFijas: 0,
    horasMinimas: 0,
    horasMaximas: 0,
  });

  const {
    form: formEditarServicio,
    handleChange: handleChangeEditarServicio,
    setForm: setFormEditarServicio,
    resetForm: resetFormEditarServicio,
  } = useForm<UpdateServicioDto>({
    codigo: "",
    descripcion: "",
    idTipoServicio: 0,
    idTipoDuracion: 0,
    idTipoHorarioDescripcion: 0,
    horasFijas: 0,
    horasMinimas: 0,
    horasMaximas: 0,
    estado: true,
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
    {
      header: "Duración",
      accessorKey: "idTipoDuracion.descripcion",
      cell: ({ row }) => {
        return (
          <span className="whitespace-nowrap">
            {row.original.idTipoDuracion.descripcion}
          </span>
        );
      },
    },
    {
      header: "Horario",
      accessorKey: "idTipoHorarioDescripcion.nombre",
      cell: ({ row }) => {
        return (
          <span className="whitespace-nowrap">
            {row.original.idTipoHorarioDescripcion.nombre}
          </span>
        );
      },
    },
    {
      header: "Horas",
      cell: ({ row }) => {
        if (row.original.idTipoDuracion?.descripcion === "fija") {
          return (
            <div className="flex flex-col gap-2">
              <p>Fijas: {row.original.horasFijas}</p>
            </div>
          );
        }
        if (row.original.idTipoDuracion?.descripcion === "flexible") {
          return (
            <div className="flex flex-col gap-2 whitespace-nowrap">
              <span>Mínimas: {row.original.horasMinimas}</span>
              <span>Máximas: {row.original.horasMaximas}</span>
            </div>
          );
        }
      },
    },
    {
      header: "Estado",
      cell: ({ row }) => {
        return <StateLabel state={row.original.estado} />;
      },
    },
    {
      header: "Acciones",
      cell: ({ row }) => (
        <MoreActionsButton
          menuId={`actions-${row.original.idServicio}`}
          actions={[
            {
              label: "Editar",
              onClick: () => {
                setServicioId(row.original.idServicio);
                setFormEditarServicio({
                  codigo: row.original.codigo,
                  descripcion: row.original.descripcion,
                  idTipoServicio: row.original.idTipoServicio.idTipoServicio,
                  idTipoDuracion: row.original.idTipoDuracion.idTipoDuracion,
                  idTipoHorarioDescripcion:
                    row.original.idTipoHorarioDescripcion
                      .idTipoHorarioDescripcion,
                  horasFijas: row.original.horasFijas,
                  horasMinimas: row.original.horasMinimas,
                  horasMaximas: row.original.horasMaximas,
                  estado: row.original.estado,
                });
                setIsOpenEditModal(true);
                setTipoDuracion(row.original.idTipoDuracion.descripcion);
                setTipoHorarioDescripcion(
                  row.original.idTipoHorarioDescripcion.nombre.includes(
                    "dia completo",
                  ),
                );
              },
            },
            {
              label: "Ver",
              onClick: () => {
                obtenerServicioById(row.original.idServicio, {
                  onSuccess: () => {
                    setIsOpenViewModal(true);
                  },
                });
              },
            },
            {
              label: "Eliminar",
              onClick: () => {
                setServicioId(row.original.idServicio);
                setIsOpenDeleteModal(true);
              },
              color: "red" as const,
            },
          ]}
        />
      ),
    },
  ];

  const serviciosData = useMemo(
    () => Object.entries(servicios?.data || []),
    [servicios?.data],
  );
  return (
    <Section>
      <div className="flex justify-end">
        <ButtonAction
          Icon={PlusIcon}
          label="Agregar Servicio"
          onClick={() => setIsOpenAddModal(true)}
        />
      </div>

      <div className="flex flex-col gap-6">
        {serviciosData.map(([key, value]: [string, any]) => {
          console.log(value.length);

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
          resetFormAgregarServicio();
          setTipoDuracion(null);
          setTipoHorarioDescripcion(null);
        }}
        title="Agregar Servicio"
        size="xl"
      >
        <FormsModal
          onSubmit={(e) => {
            e.preventDefault();
            agregarServicio(
              {
                ...formAgregarServicio,
                idTipoServicio: Number(formAgregarServicio.idTipoServicio),
                idTipoDuracion: tipoHorarioDescripcion
                  ? 0
                  : Number(formAgregarServicio.idTipoDuracion),
                idTipoHorarioDescripcion: Number(
                  formAgregarServicio.idTipoHorarioDescripcion,
                ),
                horasFijas: tipoHorarioDescripcion
                  ? 0
                  : Number(formAgregarServicio.horasFijas),
                horasMinimas: tipoHorarioDescripcion
                  ? 0
                  : Number(formAgregarServicio.horasMinimas),
                horasMaximas: tipoHorarioDescripcion
                  ? 0
                  : Number(formAgregarServicio.horasMaximas),
              },
              {
                onSuccess: () => {
                  setIsOpenAddModal(false);
                  resetFormAgregarServicio();
                  setTipoDuracion(null);
                },
              },
            );
          }}
          isLoading={isLoadingAgregarServicio}
          onCancel={() => {
            setIsOpenAddModal(false);
            resetFormAgregarServicio();
            setTipoDuracion(null);
            setTipoHorarioDescripcion(null);
          }}
          updating={false}
        >
          <div className="flex flex-col gap-4">
            <FormSection
              title="Datos del servicio"
              description="Datos del servicio"
              Icon={FileText}
            >
              <InputForm
                label="Código"
                placeholder="Código"
                type="text"
                id="codigo"
                value={formAgregarServicio.codigo}
                onChange={handleChangeAgregarServicio}
                required={true}
              />
              <InputForm
                label="Descripción"
                placeholder="Descripción"
                type="text"
                id="descripcion"
                value={formAgregarServicio.descripcion}
                onChange={handleChangeAgregarServicio}
                required={true}
              />
              <InputSelect
                label="Tipo de servicio"
                placeholder="Tipo de servicio"
                options={
                  tiposServicios?.data?.map((tipo) => ({
                    id: tipo.idTipoServicio,
                    descripcion: tipo.descripcion,
                  })) || []
                }
                id="idTipoServicio"
                value={formAgregarServicio.idTipoServicio}
                onChange={handleChangeAgregarServicio}
                required={true}
              />
              <InputSelect
                label="Tipo de horario"
                placeholder="Tipo de horario"
                options={
                  tiposHorarios?.data?.map((tipo) => ({
                    id: tipo.idTipoHorarioDescripcion,
                    descripcion: tipo.nombre,
                  })) || []
                }
                id="idTipoHorarioDescripcion"
                value={formAgregarServicio.idTipoHorarioDescripcion}
                onChange={(e) => {
                  handleChangeAgregarServicio(e);
                  if (
                    e.target.selectedOptions[0].text.includes("dia completo")
                  ) {
                    setTipoHorarioDescripcion(true);
                  } else {
                    setTipoHorarioDescripcion(false);
                  }
                }}
                required={true}
              />
              {!tipoHorarioDescripcion && (
                <InputSelect
                  label="Tipo de duración"
                  placeholder="Tipo de duración"
                  options={
                    tiposDuraciones?.data?.map((tipo) => ({
                      id: tipo.idTipoDuracion,
                      descripcion: tipo.descripcion,
                    })) || []
                  }
                  id="idTipoDuracion"
                  value={formAgregarServicio.idTipoDuracion}
                  onChange={(e) => {
                    handleChangeAgregarServicio(e);
                    if (
                      tiposDuraciones?.data?.find(
                        (tipo) =>
                          tipo.idTipoDuracion === Number(e.target.value),
                      )?.descripcion === "flexible"
                    ) {
                      setTipoDuracion("flexible");
                    } else {
                      setTipoDuracion("fija");
                    }
                  }}
                  required={true}
                />
              )}
            </FormSection>
            <FormSection
              title="Configuración de horas"
              description="Configuración de horas"
              Icon={Clock}
            >
              {tipoHorarioDescripcion && (
                <span className="text-sm text-gray-500">
                  El servicio cubre todo el día. No es necesario configurar
                  horas.
                </span>
              )}
              {!tipoHorarioDescripcion && tipoDuracion === "fija" && (
                <InputForm
                  label="Horas fijas"
                  placeholder="Horas fijas"
                  type="number"
                  id="horasFijas"
                  value={formAgregarServicio.horasFijas?.toString() || ""}
                  onChange={handleChangeAgregarServicio}
                  required={true}
                />
              )}
              {!tipoHorarioDescripcion && tipoDuracion === "flexible" && (
                <>
                  <InputForm
                    label="Horas mínimas"
                    placeholder="Horas mínimas"
                    type="number"
                    id="horasMinimas"
                    value={formAgregarServicio.horasMinimas?.toString() || ""}
                    onChange={handleChangeAgregarServicio}
                    required={true}
                  />
                  <InputForm
                    label="Horas máximas"
                    placeholder="Horas máximas"
                    type="number"
                    id="horasMaximas"
                    value={formAgregarServicio.horasMaximas?.toString() || ""}
                    onChange={handleChangeAgregarServicio}
                    required={true}
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
          resetFormEditarServicio();
          setTipoDuracion(null);
          setTipoHorarioDescripcion(null);
        }}
        title="Editar Servicio"
        size="xl"
      >
        <FormsModal
          onSubmit={(e) => {
            e.preventDefault();
            if (tipoDuracion === "fija") {
              formEditarServicio.horasMinimas = 0;
              formEditarServicio.horasMaximas = 0;
            } else {
              formEditarServicio.horasFijas = 0;
            }
            if (tipoHorarioDescripcion) {
              formEditarServicio.horasFijas = 0;
              formEditarServicio.horasMinimas = 0;
              formEditarServicio.horasMaximas = 0;
            }
            actualizarServicio(
              {
                id: servicioId || 0,
                data: {
                  ...formEditarServicio,
                  idTipoServicio: Number(formEditarServicio.idTipoServicio),
                  idTipoDuracion: tipoHorarioDescripcion
                    ? 0
                    : Number(formEditarServicio.idTipoDuracion),
                  idTipoHorarioDescripcion: Number(
                    formEditarServicio.idTipoHorarioDescripcion,
                  ),
                  estado: String(formEditarServicio.estado) === "true",
                },
              },
              {
                onSuccess: () => {
                  setIsOpenEditModal(false);
                  resetFormEditarServicio();
                  setTipoDuracion(null);
                },
              },
            );
          }}
          isLoading={isLoadingActualizarServicio}
          onCancel={() => {
            setIsOpenEditModal(false);
            resetFormEditarServicio();
            setTipoDuracion(null);
            setTipoHorarioDescripcion(null);
          }}
          updating={true}
        >
          <div className="flex flex-col gap-4">
            <FormSection
              title="Datos del servicio"
              description="Datos del servicio"
              Icon={FileText}
            >
              <InputForm
                label="Código"
                placeholder="Código"
                type="text"
                id="codigo"
                value={formEditarServicio.codigo || ""}
                onChange={handleChangeEditarServicio}
                required={true}
              />
              <InputForm
                label="Descripción"
                placeholder="Descripción"
                type="text"
                id="descripcion"
                value={formEditarServicio.descripcion || ""}
                onChange={handleChangeEditarServicio}
                required={true}
              />
              <InputSelect
                label="Tipo de servicio"
                placeholder="Tipo de servicio"
                options={
                  tiposServicios?.data?.map((tipo) => ({
                    id: tipo.idTipoServicio,
                    descripcion: tipo.descripcion,
                  })) || []
                }
                id="idTipoServicio"
                value={formEditarServicio.idTipoServicio?.toString() || ""}
                onChange={handleChangeEditarServicio}
                required={true}
              />
              <InputSelect
                label="Tipo de horario"
                placeholder="Tipo de horario"
                options={
                  tiposHorarios?.data?.map((tipo) => ({
                    id: tipo.idTipoHorarioDescripcion,
                    descripcion: tipo.nombre,
                  })) || []
                }
                id="idTipoHorarioDescripcion"
                value={
                  formEditarServicio.idTipoHorarioDescripcion?.toString() || ""
                }
                onChange={(e) => {
                  handleChangeEditarServicio(e);
                  if (
                    e.target.selectedOptions[0].text.includes("dia completo")
                  ) {
                    setTipoHorarioDescripcion(true);
                  } else {
                    setTipoHorarioDescripcion(false);
                  }
                }}
                required={true}
              />
              {!tipoHorarioDescripcion && (
                <InputSelect
                  label="Tipo de duración"
                  placeholder="Tipo de duración"
                  options={
                    tiposDuraciones?.data?.map((tipo) => ({
                      id: tipo.idTipoDuracion,
                      descripcion: tipo.descripcion,
                    })) || []
                  }
                  id="idTipoDuracion"
                  value={formEditarServicio.idTipoDuracion?.toString() || ""}
                  onChange={(e) => {
                    handleChangeEditarServicio(e);
                    if (
                      tiposDuraciones?.data?.find(
                        (tipo) =>
                          tipo.idTipoDuracion === Number(e.target.value),
                      )?.descripcion === "flexible"
                    ) {
                      setTipoDuracion("flexible");
                    } else {
                      setTipoDuracion("fija");
                    }
                  }}
                  required={true}
                />
              )}
              <InputSelectStateBoolean
                label="Estado"
                placeholder="Estado"
                id="estado"
                value={formEditarServicio.estado?.toString() || ""}
                onChange={handleChangeEditarServicio}
              />
            </FormSection>
            <FormSection
              title="Configuración de horas"
              description="Configuración de horas"
              Icon={Clock}
            >
              {tipoHorarioDescripcion && (
                <span className="text-sm text-gray-500">
                  El servicio cubre todo el día. No es necesario configurar
                  horas.
                </span>
              )}
              {!tipoHorarioDescripcion && tipoDuracion === "fija" && (
                <InputForm
                  label="Horas fijas"
                  placeholder="Horas fijas"
                  type="number"
                  id="horasFijas"
                  value={formEditarServicio.horasFijas?.toString() || ""}
                  onChange={handleChangeEditarServicio}
                  required={true}
                />
              )}
              {!tipoHorarioDescripcion && tipoDuracion === "flexible" && (
                <>
                  <InputForm
                    label="Horas mínimas"
                    placeholder="Horas mínimas"
                    type="number"
                    id="horasMinimas"
                    value={formEditarServicio.horasMinimas?.toString() || ""}
                    onChange={handleChangeEditarServicio}
                    required={true}
                  />
                  <InputForm
                    label="Horas máximas"
                    placeholder="Horas máximas"
                    type="number"
                    id="horasMaximas"
                    value={formEditarServicio.horasMaximas?.toString() || ""}
                    onChange={handleChangeEditarServicio}
                    required={true}
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
