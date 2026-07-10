import { ButtonAction } from "../../../common/ButtonAction";
import {
  Building2,
  Mail,
  PlusIcon,
  User,
  XIcon,
} from "lucide-react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import Table from "../../../common/Table";
import type { ServerFilterColumn } from "../../../common/Table";
import { StateLabel } from "../../../common/StateLabel";
import type { Puesto } from "../../../../types";
import { SimpleModal } from "../../../common/SimpleModal";
import { useState } from "react";
import { ConfirmarDelete } from "../../modals/ConfirmarDelete";
import {
  useClientesActivo,
  useDeletePuesto,
  useFilterPuestos,
  usePuestoById,
  usePuestos,
  useUpdatePuesto,
} from "../../../../api/queryFunctions/clientes";

import type { CreateCorreoDto, FilterLocacionDto, UpdatePuestoDto } from "../../../../api/dtos";
import { LocacionFilterColumn } from "../../../../api/dtos/clientes";
import {
  useCiudad,
  useEstadoOrden,
} from "../../../../api/queryFunctions/configuracion";
import { InputForm } from "../../../common/InputForm";
import { InputSelect } from "../../../common/InputSelect";
import { toast } from "sonner";
import { FormsModal } from "../../modals/FormsModal";
import { FormSection } from "../../../common/FormSection";
import { MoreActionsButton } from "../../common/MoreActionsButton";
import { CheckboxForm } from "../../../common/CheckboxForm";
import { useForm } from "react-hook-form";

export function PuestosTab() {
  // Estados

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [isFacturacionDiferente, setIsFacturacionDiferente] = useState(false);
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
  const [idPuestoSelected, setIdPuestoSelected] = useState<number | null>(null);
  const [filteredPuestos, setFilteredPuestos] = useState<Puesto[] | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterLocacionDto | undefined>(undefined);

  // Mutaciones y Queries
  const { data: puestos } = usePuestos();
  const { data: ciudades } = useCiudad();
  const { data: clientes } = useClientesActivo();
  const { data: estadosOrdenServicio } = useEstadoOrden();

  const { mutate: updatePuesto, isPending: isUpdatingPuesto } =
    useUpdatePuesto();
  const { mutate: getPuestoById } = usePuestoById();
  const { mutate: deletePuesto } = useDeletePuesto();
  const { mutate: filterPuestos, isPending: isFilteringPuestos } =
    useFilterPuestos();

  // Formulario con react-hook-form
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    formState: { errors: errorsEdit },
  } = useForm<UpdatePuestoDto>({
    defaultValues: {
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
      idClienteFacturacion: null,
    },
  });

  // Handlers

  const handleShowEditPuestoModal = (row: Row<Puesto>) => {
    getPuestoById(row.original.idLocacion, {
      onSuccess: (data) => {
        if (data.data) {
          resetEdit({
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
            idClienteFacturacion: data.data.idClienteFacturacion?.idCliente || null,
            correos: [...data.data.correos] as unknown as CreateCorreoDto[],
          });
          setIsFacturacionDiferente(data.data.idClienteFacturacion != null);
          setCorreos(data.data.correos as unknown as CreateCorreoDto[]);
        }
      },
    });
    setIsEditModalOpen(true);
  };

  const columnsPuestos: ColumnDef<Puesto>[] = [
    {
      accessorKey: "idLocacion",
      header: "ID",
    },
    {
      accessorKey: "nombre",
      header: "Nombre",
    },
    {
      accessorKey: "direccion",
      header: "Dirección",
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
    },
    {
      accessorKey: "idCliente.nombre",
      header: "Cliente",
    },
    {
      accessorKey: "idClienteFacturacion.nombre",
      header: "Responsable facturación",
      cell: ({ row }) => row.original.idClienteFacturacion ? row.original.idClienteFacturacion.nombre : "Mismo cliente",
    },
    {
      accessorKey: "idCiudad.descripcion",
      header: "Ciudad",
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
        <MoreActionsButton
          menuId={`actions-${row.original.idLocacion}`}
          actions={[
            {
              label: "Editar",
              onClick: () => {
                handleShowEditPuestoModal(row);
                setIdPuestoSelected(row.original.idLocacion);
              },
            },
            {
              label: "Eliminar",
              onClick: () => {
                setIdPuestoSelected(row.original.idLocacion);
                setIsOpenDelete(true);
              },
              color: "red" as const,
            },
          ]}
        />
      ),
    },
  ];

  const handleCloseEditPuesto = () => {
    setIsEditModalOpen(false);
    resetEdit();
    setCorreos([]);
    setIsFacturacionDiferente(false);
    setCorreoInput({
      nombre: "",
      apellido: "",
      correo: "",
    });
  };

  return (
    <div className="space-y-4">
      {/* <div className="flex justify-end">
        <ButtonAction
          Icon={PlusIcon}
          label="Agregar puesto"
          onClick={() => setIsAddModalOpen(true)}
        />
      </div> */}
      <Table
        data={filteredPuestos ?? puestos?.data?.data ?? []}
        columns={columnsPuestos}
        enablePagination={true}
        pageSize={5}
        enableSorting={true}
        enableFiltering={true}
        filterColumns={[
          { label: "Nombre", value: LocacionFilterColumn.NOMBRE },
          { label: "Dirección", value: LocacionFilterColumn.DIRECCION },
          { label: "Cliente", value: LocacionFilterColumn.CLIENTE },
          { label: "Ciudad", value: LocacionFilterColumn.CIUDAD },
        ] satisfies ServerFilterColumn[]}
        onServerFilter={(column, query) => {
          const filter = { column: column as LocacionFilterColumn, query, pagination: false };
          setCurrentFilter(filter);
          filterPuestos(
            filter,
            {
              onSuccess: (data) => {
                setFilteredPuestos(data.data?.data ?? []);
              },
            },
          );
        }}
        onServerFilterClear={() => {
          setFilteredPuestos(null);
          setCurrentFilter(undefined);
        }}
        serverFilterLoading={isFilteringPuestos}
      />

      {/* Modal para editar puesto */}
      <SimpleModal
        isOpen={isEditModalOpen}
        onClose={() => handleCloseEditPuesto()}
        title="Editar puesto"
        size="4xl"
      >
        <FormsModal
          isLoading={isUpdatingPuesto}
          onCancel={() => {
            handleCloseEditPuesto();
          }}
          updating={true}
          onSubmit={handleSubmitEdit((data) => {
            updatePuesto(
              {
                id: idPuestoSelected as number,
                data: {
                  ...data,
                  idCliente: Number(data.idCliente),
                  idCiudad: Number(data.idCiudad),
                  correos: correos,
                  idClienteFacturacion: isFacturacionDiferente ? Number(data.idClienteFacturacion) : null,
                },
              },
              {
                onSuccess: () => {
                  handleCloseEditPuesto();
                  if (currentFilter) {
                    filterPuestos(currentFilter, {
                      onSuccess: (data) => {
                        setFilteredPuestos(data.data?.data ?? []);
                      },
                    });
                  }
                },
              },
            );
          })}
        >
          <div className="flex flex-col gap-4">
            <FormSection
              title="Información del puesto"
              description="Información del puesto"
              Icon={Building2}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputForm
                  label="Nombre*"
                  placeholder="Nombre"
                  type="text"
                  id="nombre"
                  required
                  {...registerEdit("nombre")}
                />
                <InputSelect
                  label="Cliente*"
                  placeholder="Cliente"
                  id="idCliente"
                  options={
                    clientes?.data?.data.map((cliente) => ({
                      id: cliente.idCliente,
                      descripcion: cliente.nombre,
                    })) || []
                  }
                  required
                  {...registerEdit("idCliente")}
                />
                <div className="md:col-span-2">
                  <CheckboxForm
                    label="El responsable de facturación es diferente al cliente."
                    id="isFacturacionDiferente"
                    checked={isFacturacionDiferente}
                    onChange={(e) => {
                      setIsFacturacionDiferente(e.target.checked);
                      if (!e.target.checked) {
                        setValueEdit("idClienteFacturacion", null);
                      }
                    }}
                  />
                </div>
                {isFacturacionDiferente && (
                  <div className="md:col-span-2">
                    <InputSelect
                      label="Responsable facturación*"
                      placeholder="Responsable facturación"
                      id="idClienteFacturacion"
                      options={
                        clientes?.data?.data.map((cliente) => ({
                          id: cliente.idCliente,
                          descripcion: cliente.nombre,
                        })) || []
                      }
                      required
                      {...registerEdit("idClienteFacturacion")}
                    />
                  </div>
                )}
                <InputSelect
                  label="Ciudad*"
                  placeholder="Ciudad"
                  id="idCiudad"
                  options={
                    ciudades?.data?.data.map((ciudad) => ({
                      id: ciudad.idCiudad,
                      descripcion: ciudad.descripcion,
                    })) || []
                  }
                  required
                  {...registerEdit("idCiudad")}
                />
                <InputForm
                  label="Dirección*"
                  placeholder="Dirección"
                  type="text"
                  id="direccion"
                  required
                  {...registerEdit("direccion")}
                />
                <InputForm
                  label="Días de anticipación de notificación*"
                  placeholder="Días de anticipación de notificación"
                  type="number"
                  id="diasAnticipaticionNotificacion"
                  required
                  {...registerEdit("diasAnticipaticionNotificacion")}
                />
                <InputForm
                  label="Latitud*"
                  placeholder="Latitud"
                  type="number"
                  id="latitud"
                  required
                  step="any"
                  maxLength={10}
                  allowNegative={true}
                  {...registerEdit("latitud")}
                />
                <InputForm
                  label="Longitud*"
                  placeholder="Longitud"
                  type="number"
                  id="longitud"
                  required
                  step="any"
                  maxLength={10}
                  allowNegative={true}
                  {...registerEdit("longitud")}
                />
              </div>
            </FormSection>

            <FormSection
              title="Información de contacto"
              description="Información de contacto"
              Icon={User}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputForm
                  label="Primer nombre responsable*"
                  placeholder="Primer nombre responsable"
                  type="text"
                  id="primerNombreResponsable"
                  required
                  {...registerEdit("primerNombreResponsable")}
                />
                <InputForm
                  label="Primer apellido responsable*"
                  placeholder="Primer apellido responsable"
                  type="text"
                  id="primerApellidoResponsable"
                  required
                  {...registerEdit("primerApellidoResponsable")}
                />
                <InputForm
                  label="Teléfono*"
                  placeholder="Teléfono"
                  type="number"
                  id="telefono"
                  prefix="+57"
                  maxLength={10}
                  allowNegative={false}
                  error={errorsEdit.telefono?.message}
                  required
                  {...registerEdit("telefono", {
                    required: "El teléfono es requerido",
                    valueAsNumber: true,
                  })}
                />
                <InputForm
                  label="Teléfono 2"
                  placeholder="Teléfono 2"
                  type="number"
                  id="segundoTelefono"
                  prefix="+57"
                  maxLength={10}
                  allowNegative={false}
                  {...registerEdit("segundoTelefono", {
                    valueAsNumber: true,
                  })}
                />
              </div>
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
                      id="correo-nombre"
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
                      id="correo-apellido"
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
                      id="correo-email"
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
              <div className="mt-4 flex flex-col gap-2">
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
                        {estadosOrdenServicio?.data?.data
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
        text="¿Estás seguro de querer eliminar este puesto?"
        onDelete={() => {
          deletePuesto(idPuestoSelected as number, {
            onSuccess: () => {
              setIsOpenDelete(false);
              setIdPuestoSelected(null);
            },
          });
        }}
        onClose={() => setIsOpenDelete(false)}
      />
    </div>
  );
}
