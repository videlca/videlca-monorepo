import { ButtonAction } from "../../../common/ButtonAction";
import { PencilIcon, PlusIcon, SaveIcon, TrashIcon, XIcon } from "lucide-react";
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
  UpdateClienteDto,
} from "../../../../api/dtos/clientes";
import { InputForm } from "../../../common/InputForm";
import {
  useTipoCliente,
  useTipoIdentificacionActivo,
} from "../../../../api/queryFunctions/configuracion";
import { useSubSegmentaciones } from "../../../../api/queryFunctions/clientes";
import { InputSelect } from "../../../common/InputSelect";
import Button from "../../../common/Button";
import { InputSelectStateBoolean } from "../../../common/InputSelectState";

export function ClientesTab() {
  // Estados
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [isOpenDelete, setIsOpenDelete] = useState(false);

  // Mutaciones y queries
  const { data: clientes } = useClientes();
  const { mutate: getClienteById } = useClienteById();
  const { mutate: createCliente, isPending: isCreatingCliente } =
    useCreateCliente();
  const { mutate: updateCliente, isPending: isUpdatingCliente } =
    useUpdateCliente();
  const { mutate: deleteCliente, isPending: isDeletingCliente } =
    useDeleteCliente();

  const { data: tipoIdentificacion } = useTipoIdentificacionActivo();
  const { data: tipoCliente } = useTipoCliente();
  const { data: subSegmentaciones } = useSubSegmentaciones();

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
            estado: data.data.estado || true,
          });
        }
      },
    });
    setIsEditModalOpen(true);
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
        <div className="flex gap-2">
          <ButtonAction
            Icon={PencilIcon}
            label="Editar"
            onClick={() => handleShowEditClienteModal(row)}
          />
          <ButtonAction
            Icon={TrashIcon}
            label="Eliminar"
            onClick={() => {
              setEditingCliente(row.original);
              setIsOpenDelete(true);
            }}
            color="red"
          />
        </div>
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
        onClose={() => setIsAddModalOpen(false)}
        title="Agregar cliente"
        size="xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createCliente(formCreateCliente, {
              onSuccess: () => {
                setIsAddModalOpen(false);
              },
            });
          }}
          className="flex flex-col gap-4"
        >
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
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setIsAddModalOpen(false);
                resetFormCreateCliente();
              }}
              className="w-auto bg-gray-500 hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isCreatingCliente}
              className="w-auto"
            >
              {isCreatingCliente ? "Creando..." : "Agregar"}
            </Button>
          </div>
        </form>
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateCliente({
              id: editingCliente?.idCliente || 0,
              data: {
                ...formEditCliente,
                estado: String(formEditCliente.estado) === "true",
              },
            });
            setIsEditModalOpen(false);
          }}
          className="flex flex-col gap-4"
        >
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
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setIsEditModalOpen(false);
                resetFormEditCliente();
              }}
              className="w-auto bg-gray-500 hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isUpdatingCliente}
              className="w-auto"
            >
              {isUpdatingCliente ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </form>
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
