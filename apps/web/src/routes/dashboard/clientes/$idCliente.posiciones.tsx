import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useState } from "react";
import type { CreateCorreoDto, UpdatePosicionDto } from "../../../api/dtos";
import {
  useDeletePosicion,
  usePosicionById,
  usePosicionesByCliente,
  useUpdatePosicion,
} from "../../../api/queryFunctions/clientes";
import {
  useCiudad,
  useEstadoOrden,
} from "../../../api/queryFunctions/configuracion";
import { useForm } from "../../../hooks/useForm";
import type { Posicion } from "../../../types";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { ButtonAction } from "../../../components/common/ButtonAction";
import {
  ArrowLeftIcon,
  Building2,
  Mail,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  User,
  XIcon,
} from "lucide-react";
import Table from "../../../components/common/Table";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { FormSection } from "../../../components/common/FormSection";
import { InputForm } from "../../../components/common/InputForm";
import { InputSelect } from "../../../components/common/InputSelect";
import { toast } from "sonner";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";

export const Route = createFileRoute(
  "/dashboard/clientes/$idCliente/posiciones",
)({
  component: RouteComponent,
});

export function RouteComponent() {
  const { idCliente } = useParams({
    from: "/dashboard/clientes/$idCliente/posiciones",
  });
  // Estados
  const navigate = useNavigate({ from: "/dashboard/clientes" });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [correoInput, setCorreoInput] = useState<{
    nombre: string;
    apellido: string;
    correo: string;
  }>({
    nombre: "",
    apellido: "",
    correo: "",
  });
  const [correos, setCorreos] = useState<CreateCorreoDto[]>([]);
  const [idPosicionSelected, setIdPosicionSelected] = useState<number | null>(
    null,
  );

  // Mutaciones y Queries
  const { data: posiciones } = usePosicionesByCliente(Number(idCliente));
  const { data: ciudades } = useCiudad();
  // const { data: clientes } = useClientesActivo();
  const { data: estadosOrdenServicio } = useEstadoOrden();

  const { mutate: updatePosicion, isPending: isUpdatingPosicion } =
    useUpdatePosicion();
  const { mutate: getPosicionById } = usePosicionById();
  const { mutate: deletePosicion } = useDeletePosicion();

  // Formularios

  // TODO: Agregar correos

  const {
    form: formEditPosicion,
    handleChange: handleChangeEditPosicion,
    handleNumericChange: handleNumericChangeEditPosicion,
    setForm: setFormEditPosicion,
    resetForm: resetFormEditPosicion,
  } = useForm<UpdatePosicionDto>({
    idCliente: 0,
    nombre: "",
    idCiudad: 0,
    direccion: "",
    latitud: 0,
    longitud: 0,
    primerNombreResponsable: "",
    primerApellidoResponsable: "",
    telefono: "",
    diasAnticipaticionNotificacion: 0,
    correos: [],
    estado: true,
  });

  // Handlers

  const handleShowEditPosicionModal = (row: Row<Posicion>) => {
    getPosicionById(row.original.idLocacion, {
      onSuccess: (data) => {
        if (data.data) {
          const correosFormatted = data.data.correos.map((correo) => ({
            nombre: correo.nombre,
            apellido: correo.apellido,
            email: correo.email,
            estados: correo.estados.map(
              (estado) => estado.idEstadoOrdenServicio,
            ),
          }));
          setFormEditPosicion({
            idCliente: data.data.idCliente.idCliente,
            nombre: data.data.nombre,
            idCiudad: data.data.idCiudad.idCiudad,
            direccion: data.data.direccion,
            latitud: data.data.latitud,
            longitud: data.data.longitud,
            primerNombreResponsable: data.data.primerNombreResponsable,
            primerApellidoResponsable: data.data.primerApellidoResponsable,
            telefono: data.data.telefono,
            diasAnticipaticionNotificacion:
              data.data.diasAnticipaticionNotificacion,
            estado: data.data.estado,
            correos: [...correosFormatted],
          });
          setCorreos(correosFormatted);
        }
      },
    });
    setIsEditModalOpen(true);
  };

  const columnsPosiciones: ColumnDef<Posicion>[] = [
    {
      accessorKey: "idLocacion",
      header: "ID",
    },
    {
      accessorKey: "idCliente.nombre",
      header: "Cliente",
    },
    {
      accessorKey: "nombre",
      header: "Nombre de la posición",
    },
    {
      accessorKey: "idCiudad.descripcion",
      header: "Ciudad",
    },
    {
      accessorKey: "direccion",
      header: "Dirección",
      cell: ({ row }) => (
        <span className="text-sm font-medium whitespace-nowrap text-gray-900">
          {row.original.direccion}
        </span>
      ),
    },
    {
      accessorKey: "latitud",
      header: "Latitud",
    },
    {
      accessorKey: "longitud",
      header: "Longitud",
    },
    {
      accessorKey: "primerNombreResponsable",
      header: "Primer nombre responsable",
    },
    {
      accessorKey: "primerApellidoResponsable",
      header: "Primer apellido responsable",
    },
    {
      accessorKey: "telefono",
      header: "Teléfono",
    },
    {
      accessorKey: "segundoTelefono",
      header: "Teléfono 2",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-900">
          {row.original.segundoTelefono || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "diasAnticipaticionNotificacion",
      header: "Días de anticipación de notificación",
    },
    {
      accessorKey: "correos",
      header: "Correos",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-900">
          {row.original.correos.map((correo) => correo.email).join(", ")}
        </span>
      ),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => <StateLabel state={row.original.estado} />,
    },
    {
      accessorKey: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <ButtonAction
            Icon={PencilIcon}
            label="Editar"
            onClick={() => {
              handleShowEditPosicionModal(row);
              setIdPosicionSelected(row.original.idLocacion);
            }}
          />
          <ButtonAction
            Icon={TrashIcon}
            label="Eliminar"
            onClick={() => {
              setIdPosicionSelected(row.original.idLocacion);
              setIsOpenDelete(true);
            }}
            color="red"
          />
        </div>
      ),
    },
  ];

  const handleCloseEditPosicion = () => {
    setIsEditModalOpen(false);
    resetFormEditPosicion();
    setCorreos([]);
    setCorreoInput({
      nombre: "",
      apellido: "",
      correo: "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Posiciones de por cliente</h1>
        <ButtonAction
          Icon={ArrowLeftIcon}
          label="Volver"
          onClick={() => {
            navigate({
              to: "/dashboard/clientes",
            });
          }}
        />
      </div>
      <Table
        data={posiciones?.data || []}
        columns={columnsPosiciones}
        enablePagination={true}
        pageSize={10}
        enableSorting={true}
        enableFiltering={true}
      />

      {/* Modal para editar posición */}
      <SimpleModal
        isOpen={isEditModalOpen}
        onClose={() => handleCloseEditPosicion()}
        title="Editar posición"
        size="4xl"
      >
        <FormsModal
          isLoading={isUpdatingPosicion}
          onCancel={() => {
            handleCloseEditPosicion();
          }}
          updating={true}
          onSubmit={(e) => {
            e.preventDefault();
            updatePosicion(
              {
                id: idPosicionSelected as number,
                data: {
                  ...formEditPosicion,
                  correos: correos,
                },
              },
              {
                onSuccess: () => {
                  handleCloseEditPosicion();
                },
              },
            );
          }}
        >
          <div className="flex flex-col gap-4">
            <FormSection
              title="Información de la posición"
              description="Información de la posición"
              Icon={Building2}
            >
              <InputForm
                label="Nombre*"
                placeholder="Nombre"
                type="text"
                id="nombre"
                value={formEditPosicion.nombre || ""}
                onChange={handleChangeEditPosicion}
                required
              />
              {/* <InputSelect
                label="Cliente*"
                placeholder="Cliente"
                id="idCliente"
                value={formEditPosicion.idCliente || 0}
                onChange={handleNumericChangeEditPosicion}
                options={
                  clientes?.data?.map((cliente) => ({
                    id: cliente.idCliente,
                    descripcion: cliente.nombre,
                  })) || []
                }
                required
              /> */}
              <InputSelect
                label="Ciudad*"
                placeholder="Ciudad"
                id="idCiudad"
                value={formEditPosicion.idCiudad || 0}
                onChange={handleNumericChangeEditPosicion}
                options={
                  ciudades?.data?.map((ciudad) => ({
                    id: ciudad.idCiudad,
                    descripcion: ciudad.descripcion,
                  })) || []
                }
                required
              />
              <InputForm
                label="Dirección*"
                placeholder="Dirección"
                type="text"
                id="direccion"
                value={formEditPosicion.direccion || ""}
                onChange={handleChangeEditPosicion}
                required
              />
              <InputForm
                label="Días de anticipación de notificación*"
                placeholder="Días de anticipación de notificación"
                type="number"
                id="diasAnticipaticionNotificacion"
                value={
                  formEditPosicion.diasAnticipaticionNotificacion?.toString() ||
                  "0"
                }
                onChange={handleChangeEditPosicion}
                required
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputForm
                  label="Latitud*"
                  placeholder="Latitud"
                  type="number"
                  id="latitud"
                  value={formEditPosicion.latitud?.toString() || ""}
                  onChange={handleChangeEditPosicion}
                  required
                />
                <InputForm
                  label="Longitud*"
                  placeholder="Longitud"
                  type="number"
                  id="longitud"
                  value={formEditPosicion.longitud?.toString() || ""}
                  onChange={handleChangeEditPosicion}
                  required
                />
              </div>
            </FormSection>

            <FormSection
              title="Información de contacto"
              description="Información de contacto"
              Icon={User}
            >
              <InputForm
                label="Primer nombre responsable*"
                placeholder="Primer nombre responsable"
                type="text"
                id="primerNombreResponsable"
                value={formEditPosicion.primerNombreResponsable || ""}
                onChange={handleChangeEditPosicion}
                required
              />
              <InputForm
                label="Primer apellido responsable*"
                placeholder="Primer apellido responsable"
                type="text"
                id="primerApellidoResponsable"
                value={formEditPosicion.primerApellidoResponsable || ""}
                onChange={handleChangeEditPosicion}
                required
              />
              <InputForm
                label="Teléfono*"
                placeholder="Teléfono"
                type="number"
                id="telefono"
                value={formEditPosicion.telefono || ""}
                onChange={handleChangeEditPosicion}
                required
              />
              <InputForm
                label="Teléfono 2"
                placeholder="Teléfono 2"
                type="number"
                id="segundoTelefono"
                value={formEditPosicion.segundoTelefono || ""}
                onChange={handleChangeEditPosicion}
                required={false}
              />
            </FormSection>

            <FormSection
              title="Correos electrónicos"
              description="Correos electrónicos"
              Icon={Mail}
              Details={
                <p className="text-sm font-medium text-gray-900">
                  Correos configurados ({correos.length || 0})
                </p>
              }
            >
              <div className="col-span-2 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="">
                  <div className="flex flex-col items-center gap-2">
                    <input
                      type="text"
                      id="nombre"
                      placeholder="Nombre"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={correoInput.nombre}
                      onChange={(e) =>
                        setCorreoInput({
                          ...correoInput,
                          nombre: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      id="apellido"
                      placeholder="Apellido"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={correoInput.apellido}
                      onChange={(e) =>
                        setCorreoInput({
                          ...correoInput,
                          apellido: e.target.value,
                        })
                      }
                    />
                    <input
                      type="email"
                      id="correo"
                      placeholder="Correo"
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={correoInput.correo}
                      onChange={(e) =>
                        setCorreoInput({
                          ...correoInput,
                          correo: e.target.value,
                        })
                      }
                    />
                    <ButtonAction
                      Icon={PlusIcon}
                      label="Añadir"
                      type="button"
                      onClick={() => {
                        if (correoInput.correo.trim() === "") {
                          toast.error(
                            "El correo electrónico no puede estar vacío",
                          );
                          return;
                        }
                        setCorreos([
                          ...correos,
                          {
                            email: correoInput.correo,
                            nombre: correoInput.nombre,
                            apellido: correoInput.apellido,
                            estados: [],
                          },
                        ]);
                        setCorreoInput({
                          nombre: "",
                          apellido: "",
                          correo: "",
                        });
                      }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-500">
                  Presione el botón de "Añadir" para agregar un nuevo correo a
                  la lista
                </span>
              </div>
              <div className="mt-4 flex h-full flex-col gap-2 overflow-y-auto">
                {correos.length > 0 &&
                  correos.map((correo) => (
                    <div
                      key={correo.email}
                      className="flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50 px-4 py-4"
                    >
                      <div className="flex flex-row items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {correo.email}
                        </p>
                        <button
                          className="cursor-pointer rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-200 hover:text-red-500"
                          onClick={() => {
                            setCorreos(
                              correos.filter((c) => c.email !== correo.email) ||
                                [],
                            );
                          }}
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Estados de Notificación
                        <span className="ml-1 text-xs text-gray-500">
                          ({correo.estados?.length || 0} seleccionados)
                        </span>
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        {estadosOrdenServicio?.data
                          ?.filter((estado) => estado.estado) // Solo estados activos
                          .map((estado, index) => (
                            <div
                              key={estado.idEstadoOrdenServicio}
                              className="flex items-start space-x-2 rounded-md p-2 hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                id={`estado-${index}-${estado.idEstadoOrdenServicio}`}
                                checked={correo.estados?.includes(
                                  estado.idEstadoOrdenServicio,
                                )}
                                // Manejo de estados asignados al correo
                                onChange={(e) => {
                                  setCorreos(
                                    correos.map((c) =>
                                      c.email === correo.email
                                        ? {
                                            ...c,
                                            estados: e.target.checked
                                              ? [
                                                  ...c.estados,
                                                  estado.idEstadoOrdenServicio,
                                                ]
                                              : c.estados.filter(
                                                  (id) =>
                                                    id !==
                                                    estado.idEstadoOrdenServicio,
                                                ),
                                          }
                                        : c,
                                    ),
                                  );
                                }}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <label
                                  htmlFor={`estado-${index}-${estado.idEstadoOrdenServicio}`}
                                  className="cursor-pointer text-sm font-medium text-gray-700 capitalize"
                                >
                                  {estado.nombre}
                                </label>
                                <p className="mt-0.5 text-xs text-gray-500">
                                  {estado.descripcion}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                {correos.length === 0 && (
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-2 py-10 text-center text-sm text-gray-500">
                    No hay correos configurados
                  </div>
                )}
              </div>
            </FormSection>
          </div>
        </FormsModal>
      </SimpleModal>

      <ConfirmarDelete
        isOpenDelete={isOpenDelete}
        text="¿Estás seguro de querer eliminar esta posición?"
        onDelete={() => {
          deletePosicion(idPosicionSelected as number, {
            onSuccess: () => {
              setIsOpenDelete(false);
              setIdPosicionSelected(null);
            },
          });
        }}
        onClose={() => setIsOpenDelete(false)}
      />
    </div>
  );
}
