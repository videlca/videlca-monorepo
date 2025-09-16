import { ButtonAction } from "../../../common/ButtonAction";
import {
  Building2,
  EyeIcon,
  Mail,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  User,
  XIcon,
} from "lucide-react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import Table from "../../../common/Table";
import { StateLabel } from "../../../common/StateLabel";
import type { Cliente } from "../../../../types";
import { SimpleModal } from "../../../common/SimpleModal";
import { useState } from "react";
import {
  useClienteById,
  useClientes,
  useCreateCliente,
  useDeleteCliente,
  useUpdateCliente,
} from "../../../../api/queryFunctions/clientes/clientes";
import { ConfirmarDelete } from "../../modals/ConfirmarDelete";
import { useForm } from "../../../../hooks/useForm";
import type {
  CreateClienteDto,
  CreateCorreoDto,
  CreatePuestoDto,
  UpdateClienteDto,
} from "../../../../api/dtos/clientes";
import { InputForm } from "../../../common/InputForm";
import {
  useCiudad,
  useEstadoOrden,
  useTipoCliente,
  useTipoIdentificacionActivo,
} from "../../../../api/queryFunctions/configuracion";
import {
  useCreatePuesto,
  useSubSegmentaciones,
} from "../../../../api/queryFunctions/clientes";
import { InputSelect } from "../../../common/InputSelect";
import { InputSelectStateBoolean } from "../../../common/InputSelectState";
import { FormsModal } from "../../modals/FormsModal";
import { FormSection } from "../../../common/FormSection";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { MoreActionsButton } from "../../common/MoreActionsButton";

export function ClientesTab() {
  const navigate = useNavigate({ from: "/dashboard/clientes" });
  // Estados
  const [isAddPuestoModalOpen, setIsAddPuestoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
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

  // Mutaciones y queries
  const { data: clientes } = useClientes();
  const { mutate: getClienteById } = useClienteById();
  const { mutate: createCliente, isPending: isCreatingCliente } =
    useCreateCliente();
  const { mutate: updateCliente, isPending: isUpdatingCliente } =
    useUpdateCliente();
  const { mutate: deleteCliente } = useDeleteCliente();

  const { mutate: createPuesto, isPending: isCreatingPuesto } =
    useCreatePuesto();

  const { data: tipoIdentificacion } = useTipoIdentificacionActivo();
  const { data: tipoCliente } = useTipoCliente();
  const { data: subSegmentaciones } = useSubSegmentaciones();
  const { data: ciudades } = useCiudad();
  const { data: estadosOrdenServicio } = useEstadoOrden();

  // Fomularios
  const {
    form: formCreateCliente,
    handleChange: handleChangeCreateCliente,
    handleNumericChange: handleNumericChangeCreateCliente,
    resetForm: resetFormCreateCliente,
  } = useForm<CreateClienteDto>({
    idTipoIdentificacion: 0,
    numeroIdentificacion: "",
    nombre: "",
    idTipoCliente: 0,
    idSubSegmentacion: 0,
  });

  const {
    form: formEditCliente,
    handleChange: handleChangeEditCliente,
    handleNumericChange: handleNumericChangeEditCliente,
    resetForm: resetFormEditCliente,
    setForm: setFormEditCliente,
  } = useForm<UpdateClienteDto>({
    idTipoIdentificacion: 0,
    numeroIdentificacion: "",
    nombre: "",
    idTipoCliente: 0,
    idSubSegmentacion: 0,
    estado: true,
  });

  const {
    form: formAddPuesto,
    handleChange: handleChangeAddPuesto,
    handleNumericChange: handleNumericChangeAddPuesto,
    setForm: setFormAddPuesto,
    resetForm: resetFormAddPuesto,
  } = useForm<CreatePuestoDto>({
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
  });

  // Handlers
  const handleShowEditClienteModal = (row: Row<Cliente>) => {
    setEditingCliente(row.original);
    getClienteById(row.original.idCliente, {
      onSuccess: (data) => {
        if (data.data) {
          setFormEditCliente({
            idTipoIdentificacion:
              data.data.idTipoIdentificacion.idTipoIdentificacion || 0,
            numeroIdentificacion: data.data.numeroIdentificacion || "",
            nombre: data.data.nombre || "",
            idTipoCliente: data.data.idTipoCliente.idTipoCliente || 0,
            idSubSegmentacion:
              data.data.idSubSegmentacion.idSubSegmentacion || 0,
            estado: data.data.estado,
          });
        }
      },
    });
    setIsEditModalOpen(true);
  };

  const handleCloseAddPuesto = () => {
    setIsAddPuestoModalOpen(false);
    resetFormAddPuesto();
    setCorreos([]);
    setCorreoInput({
      nombre: "",
      apellido: "",
      correo: "",
    });
  };

  const handleShowViewPuestoModal = (row: Row<Cliente>) => {
    navigate({
      to: "/dashboard/clientes/$idCliente/puestos",
      params: {
        idCliente: row.original.idCliente.toString(),
      },
    });
  };

  const columnsClientes: ColumnDef<Cliente>[] = [
    {
      accessorKey: "idCliente",
      header: "ID",
    },
    {
      accessorKey: "idTipoIdentificacion.descripcion",
      header: "Tipo de identificación",
    },
    {
      accessorKey: "numeroIdentificacion",
      header: "Número de identificación",
    },
    {
      accessorKey: "nombre",
      header: "Nombre",
    },
    {
      accessorKey: "idTipoCliente.descripcion",
      header: "Tipo de cliente",
    },
    {
      accessorKey: "idSubSegmentacion.descripcion",
      header: "Subsegmentación",
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        return <StateLabel state={row.original.estado} />;
      },
    },
    {
      accessorKey: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <MoreActionsButton
          menuId={`actions-${row.original.idCliente}`}
          actions={[
            {
              label: "Agregar puesto",
              onClick: () => {
                setIsAddPuestoModalOpen(true);
                setFormAddPuesto({
                  ...formAddPuesto,
                  idCliente: row.original.idCliente || 0,
                });
              },
            },
            {
              label: "Ver puestos",
              onClick: () => {
                handleShowViewPuestoModal(row);
              },
            },
            {
              label: "Editar",
              onClick: () => {
                handleShowEditClienteModal(row);
              },
            },
            {
              label: "Eliminar",
              onClick: () => {
                setEditingCliente(row.original);
                setIsOpenDelete(true);
              },
              color: "red" as const,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ButtonAction
          Icon={PlusIcon}
          label="Nuevo cliente"
          onClick={() => setIsAddModalOpen(true)}
        />
      </div>
      <Table
        data={clientes?.data || []}
        columns={columnsClientes}
        enableSorting={true}
        enablePagination={true}
        pageSize={10}
        enableFiltering={true}
      />

      {/* Modal para agregar cliente */}
      <SimpleModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetFormCreateCliente();
        }}
        title="Agregar cliente"
        size="xl"
      >
        <FormsModal
          isLoading={isCreatingCliente}
          onCancel={() => {
            setIsAddModalOpen(false);
            resetFormCreateCliente();
          }}
          updating={false}
          onSubmit={(e) => {
            e.preventDefault();
            createCliente(formCreateCliente, {
              onSuccess: () => {
                setIsAddModalOpen(false);
                resetFormCreateCliente();
              },
            });
          }}
        >
          <div className="flex flex-col gap-4">
            <InputSelect
              label="Tipo de identificación"
              placeholder="Tipo de identificación"
              id="idTipoIdentificacion"
              value={formCreateCliente.idTipoIdentificacion}
              onChange={handleNumericChangeCreateCliente}
              options={
                tipoIdentificacion?.data?.map((tipo) => ({
                  id: tipo.idTipoIdentificacion,
                  descripcion: tipo.descripcion,
                })) || []
              }
              required
            />
            <InputForm
              label="Número de identificación"
              placeholder="Número de identificación"
              id="numeroIdentificacion"
              value={formCreateCliente.numeroIdentificacion}
              onChange={handleChangeCreateCliente}
              type="number"
              required
            />
            <InputForm
              label="Nombre"
              placeholder="Nombre"
              id="nombre"
              type="text"
              value={formCreateCliente.nombre}
              onChange={handleChangeCreateCliente}
              required
            />
            <InputSelect
              label="Tipo de cliente"
              placeholder="Tipo de cliente"
              id="idTipoCliente"
              value={formCreateCliente.idTipoCliente}
              onChange={handleNumericChangeCreateCliente}
              options={
                tipoCliente?.data?.map((tipo) => ({
                  id: tipo.idTipoCliente,
                  descripcion: tipo.descripcion,
                })) || []
              }
              required
            />
            <InputSelect
              label="Subsegmentación"
              placeholder="Subsegmentación"
              id="idSubSegmentacion"
              value={formCreateCliente.idSubSegmentacion}
              onChange={handleNumericChangeCreateCliente}
              options={
                subSegmentaciones?.data?.map((sub) => ({
                  id: sub.idSubSegmentacion || 0,
                  descripcion: sub.descripcion,
                })) || []
              }
              required
            />
          </div>
        </FormsModal>
      </SimpleModal>

      {/* Modal para editar cliente */}
      <SimpleModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          resetFormEditCliente();
        }}
        title="Editar cliente"
        size="xl"
      >
        <FormsModal
          isLoading={isUpdatingCliente}
          onCancel={() => {
            setIsEditModalOpen(false);
            resetFormEditCliente();
          }}
          updating={true}
          onSubmit={(e) => {
            e.preventDefault();
            updateCliente(
              {
                id: editingCliente?.idCliente || 0,
                data: {
                  ...formEditCliente,
                  estado: String(formEditCliente.estado) === "true",
                },
              },
              {
                onSuccess: () => {
                  setIsEditModalOpen(false);
                  resetFormEditCliente();
                  setEditingCliente(null);
                },
              },
            );
          }}
        >
          <div className="flex flex-col gap-4">
            <InputSelect
              label="Tipo de identificación"
              placeholder="Tipo de identificación"
              id="idTipoIdentificacion"
              value={formEditCliente.idTipoIdentificacion || 0}
              onChange={handleNumericChangeEditCliente}
              options={
                tipoIdentificacion?.data?.map((tipo) => ({
                  id: tipo.idTipoIdentificacion,
                  descripcion: tipo.descripcion,
                })) || []
              }
              required
            />
            <InputForm
              label="Número de identificación"
              placeholder="Número de identificación"
              id="numeroIdentificacion"
              value={formEditCliente.numeroIdentificacion || ""}
              onChange={handleChangeEditCliente}
              type="number"
              required
            />
            <InputForm
              label="Nombre"
              placeholder="Nombre"
              id="nombre"
              type="text"
              value={formEditCliente.nombre || ""}
              onChange={handleChangeEditCliente}
              required
            />
            <InputSelect
              label="Tipo de cliente"
              placeholder="Tipo de cliente"
              id="idTipoCliente"
              value={formEditCliente.idTipoCliente || 0}
              onChange={handleNumericChangeEditCliente}
              options={
                tipoCliente?.data?.map((tipo) => ({
                  id: tipo.idTipoCliente,
                  descripcion: tipo.descripcion,
                })) || []
              }
              required
            />
            <InputSelect
              label="Subsegmentación"
              placeholder="Subsegmentación"
              id="idSubSegmentacion"
              value={formEditCliente.idSubSegmentacion || 0}
              onChange={handleNumericChangeEditCliente}
              options={
                subSegmentaciones?.data?.map((sub) => ({
                  id: sub.idSubSegmentacion || 0,
                  descripcion: sub.descripcion,
                })) || []
              }
              required
            />
            <InputSelectStateBoolean
              label="Estado"
              placeholder="Estado"
              id="estado"
              value={formEditCliente.estado?.toString() || ""}
              onChange={handleChangeEditCliente}
            />
          </div>
        </FormsModal>
      </SimpleModal>

      {/* Modal para agregar un puesto a cliente*/}
      <SimpleModal
        isOpen={isAddPuestoModalOpen}
        onClose={() => {
          handleCloseAddPuesto();
        }}
        title="Agregar puesto"
        size="4xl"
      >
        <FormsModal
          isLoading={isCreatingPuesto}
          onCancel={() => {
            handleCloseAddPuesto();
          }}
          updating={false}
          onSubmit={(e) => {
            e.preventDefault();
            createPuesto(
              {
                ...formAddPuesto,
                correos: correos,
              },
              {
                onSuccess: () => {
                  handleCloseAddPuesto();
                },
              },
            );
          }}
        >
          <div className="flex flex-col gap-4">
            <FormSection
              title="Información del puesto"
              description="Información del puesto"
              Icon={Building2}
            >
              <InputForm
                label="Nombre*"
                placeholder="Nombre"
                type="text"
                id="nombre"
                value={formAddPuesto.nombre}
                onChange={handleChangeAddPuesto}
                required
              />
              {/* <InputSelect
                label="Cliente*"
                placeholder="Cliente"
                id="idCliente"
                value={formAddPuesto.idCliente}
                onChange={handleNumericChangeAddPuesto}
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
                value={formAddPuesto.idCiudad}
                onChange={handleNumericChangeAddPuesto}
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
                value={formAddPuesto.direccion}
                onChange={handleChangeAddPuesto}
                required
              />
              <InputForm
                label="Días de anticipación de notificación*"
                placeholder="Días de anticipación de notificación"
                type="number"
                id="diasAnticipaticionNotificacion"
                value={formAddPuesto.diasAnticipaticionNotificacion?.toString()}
                onChange={handleChangeAddPuesto}
                required
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputForm
                  label="Latitud*"
                  placeholder="Latitud"
                  type="number"
                  id="latitud"
                  value={formAddPuesto.latitud?.toString()}
                  onChange={handleChangeAddPuesto}
                  required
                />
                <InputForm
                  label="Longitud*"
                  placeholder="Longitud"
                  type="number"
                  id="longitud"
                  value={formAddPuesto.longitud?.toString()}
                  onChange={handleChangeAddPuesto}
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
                value={formAddPuesto.primerNombreResponsable}
                onChange={handleChangeAddPuesto}
                required
              />
              <InputForm
                label="Primer apellido responsable*"
                placeholder="Primer apellido responsable"
                type="text"
                id="primerApellidoResponsable"
                value={formAddPuesto.primerApellidoResponsable}
                onChange={handleChangeAddPuesto}
                required
              />
              <InputForm
                label="Teléfono*"
                placeholder="Teléfono"
                type="number"
                id="telefono"
                value={formAddPuesto.telefono}
                onChange={handleChangeAddPuesto}
                required
              />
              <InputForm
                label="Teléfono 2"
                placeholder="Teléfono 2"
                type="number"
                id="segundoTelefono"
                value={formAddPuesto.segundoTelefono || ""}
                onChange={handleChangeAddPuesto}
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
                  <label
                    htmlFor="correo"
                    className="space-y-2 text-base font-medium text-gray-700"
                  >
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
                        type="email"
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
                  </label>
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
                              correos.filter((c) => c.email !== correo.email),
                            );
                          }}
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Estados de Notificación
                        <span className="ml-1 text-xs text-gray-500">
                          ({correo.estados.length || 0} seleccionados)
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
        text="¿Estás seguro de querer eliminar este cliente?"
        onDelete={() => {
          deleteCliente(editingCliente?.idCliente || 0, {
            onSuccess: () => {
              setIsOpenDelete(false);
              setEditingCliente(null);
            },
          });
        }}
        onClose={() => setIsOpenDelete(false)}
      />
    </div>
  );
}
