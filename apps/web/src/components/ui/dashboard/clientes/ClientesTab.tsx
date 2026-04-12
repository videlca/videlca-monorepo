import { ButtonAction } from "../../../common/ButtonAction";
import { Building2, Mail, PlusIcon, User } from "lucide-react";
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
import { ConfiguracionCorreo } from "../../../common/ConfiguracionCorreo";
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
        pageSize={5}
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
              type="text"
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
              type="text"
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
                  allowNegative={true}
                />
                <InputForm
                  label="Longitud*"
                  placeholder="Longitud"
                  type="number"
                  id="longitud"
                  value={formAddPuesto.longitud?.toString()}
                  onChange={handleChangeAddPuesto}
                  required
                  allowNegative={true}
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
                type="text"
                id="telefono"
                value={formAddPuesto.telefono}
                onChange={handleChangeAddPuesto}
                required
              />
              <InputForm
                label="Teléfono 2"
                placeholder="Teléfono 2"
                type="text"
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
              <ConfiguracionCorreo
                correos={correos}
                onCorreosChange={setCorreos}
              />
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
