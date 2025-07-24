import { ButtonAction } from "../../../common/ButtonAction";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import Table from "../../../common/Table";
import { StateLabel } from "../../../common/StateLabel";
import type { Correo, Locacion } from "../../../../types";
import { SimpleModal } from "../../../common/SimpleModal";
import { useState } from "react";
import { ConfirmarDelete } from "../../modals/ConfirmarDelete";
import {
  useClientesActivo,
  useCreateLocacion,
  useLocacionById,
  useLocaciones,
  useUpdateLocacion,
} from "../../../../api/queryFunctions/clientes";
import { useForm } from "../../../../hooks/useForm";
import type {
  CreateCorreoDto,
  CreateLocacionDto,
  UpdateLocacionDto,
} from "../../../../api/dtos";
import { useCiudad } from "../../../../api/queryFunctions/configuracion";
import { InputForm } from "../../../common/InputForm";
import { InputSelect } from "../../../common/InputSelect";
import Button from "../../../common/Button";

export function LocacionesTab() {
  // Estados
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLocacion, setEditingLocacion] = useState<Locacion | null>(null);
  const [isOpenDelete, setIsOpenDelete] = useState(false);

  // Mutaciones y Queries
  const { data: locaciones } = useLocaciones();
  const { data: ciudades } = useCiudad();
  const { data: clientes } = useClientesActivo();

  const { mutate: createLocacion, isPending: isCreatingLocacion } =
    useCreateLocacion();
  const { mutate: updateLocacion, isPending: isUpdatingLocacion } =
    useUpdateLocacion();
  const { mutate: getLocacionById, isPending: isGettingLocacionById } =
    useLocacionById();

  // Formularios

  // TODO: Revisar formulario
  const {
    form: formAddLocacion,
    handleChange: handleChangeAddLocacion,
    handleNumericChange: handleNumericChangeAddLocacion,
    setForm: setFormAddLocacion,
    resetForm: resetFormAddLocacion,
  } = useForm<CreateLocacionDto>({
    idCliente: 0,
    nombre: "Locación 1",
    idCiudad: 0,
    direccion: "Calle 123",
    latitud: 0,
    longitud: 0,
    primerNombreResponsable: "Juan",
    primerApellidoResponsable: "Perez",
    telefono: "1234567890",
    diasAnticipaticionNotificacion: 10,
    correos: [
      {
        email: "juan.perez@gmail.com",
        nombre: "Juan",
        apellido: "Perez",
        estados: [12, 13, 14, 15, 16],
      },
    ],
  });

  // TODO: Agregar correos

  const {
    form: formEditLocacion,
    handleChange: handleChangeEditLocacion,
    handleNumericChange: handleNumericChangeEditLocacion,
    setForm: setFormEditLocacion,
  } = useForm<UpdateLocacionDto>({
    idCliente: 0,
    nombre: "",
    idCiudad: 0,
    direccion: "",
    latitud: 0,
    longitud: 0,
    primerNombreResponsable: "",
    primerApellidoResponsable: "",
    telefono: "",
    diasAnticipaticionNotificacion: 10,
    correos: [],
    estado: true,
  });

  // Handlers

  const handleShowEditLocacionModal = (row: Row<Locacion>) => {
    setEditingLocacion(row.original);
    getLocacionById(row.original.idLocacion, {
      onSuccess: (data) => {
        if (data.data) {
          setFormEditLocacion({
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
              data.data.diasAnticipacionNotificacion,
            estado: data.data.estado,
            correos: [...data.data.correos] as unknown as CreateCorreoDto[],
          });
        }
      },
    });
    setIsEditModalOpen(true);
  };

  const handleAddCorreo = () => {
    // setFormAddLocacion({
    //   ...formAddLocacion,
    //   correos: [
    //     ...formAddLocacion.correos,
    //     { email: "", nombre: "", apellido: "", estados: [] },
    //   ],
    // });
  };

  const columnsLocaciones: ColumnDef<Locacion>[] = [
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
        <div className="flex gap-2">
          <ButtonAction
            Icon={PencilIcon}
            label="Editar"
            onClick={() => handleShowEditLocacionModal(row)}
          />
          <ButtonAction
            Icon={TrashIcon}
            label="Eliminar"
            onClick={() => {
              // setEditingLocacion(row.original);
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
          label="Agregar locación"
          onClick={() => setIsAddModalOpen(true)}
        />
      </div>
      <Table
        data={locaciones?.data || []}
        columns={columnsLocaciones}
        enablePagination={true}
        pageSize={10}
        enableSorting={true}
        enableFiltering={true}
      />

      {/* Modal para agregar locación */}
      <SimpleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Agregar locación"
        size="xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createLocacion(formAddLocacion, {
              onSuccess: () => {
                setIsAddModalOpen(false);
                resetFormAddLocacion();
              },
            });
          }}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputForm
              label="Nombre*"
              placeholder="Nombre"
              type="text"
              id="nombre"
              value={formAddLocacion.nombre}
              onChange={handleChangeAddLocacion}
              required
            />
            <InputForm
              label="Dirección*"
              placeholder="Dirección"
              type="text"
              id="direccion"
              value={formAddLocacion.direccion}
              onChange={handleChangeAddLocacion}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputForm
              label="Latitud*"
              placeholder="Latitud"
              type="number"
              id="latitud"
              value={formAddLocacion.latitud.toString()}
              onChange={handleChangeAddLocacion}
              required
            />
            <InputForm
              label="Longitud*"
              placeholder="Longitud"
              type="number"
              id="longitud"
              value={formAddLocacion.longitud.toString()}
              onChange={handleChangeAddLocacion}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputForm
              label="Primer nombre responsable*"
              placeholder="Primer nombre responsable"
              type="text"
              id="primerNombreResponsable"
              value={formAddLocacion.primerNombreResponsable}
              onChange={handleChangeAddLocacion}
              required
            />
            <InputForm
              label="Primer apellido responsable*"
              placeholder="Primer apellido responsable"
              type="text"
              id="primerApellidoResponsable"
              value={formAddLocacion.primerApellidoResponsable}
              onChange={handleChangeAddLocacion}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputForm
              label="Teléfono*"
              placeholder="Teléfono"
              type="number"
              id="telefono"
              value={formAddLocacion.telefono}
              onChange={handleChangeAddLocacion}
              required
            />
            <InputForm
              label="Teléfono 2"
              placeholder="Teléfono 2"
              type="number"
              id="segundoTelefono"
              value={formAddLocacion.segundoTelefono || ""}
              onChange={handleChangeAddLocacion}
              required={false}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputSelect
              label="Cliente*"
              placeholder="Cliente"
              id="idCliente"
              value={formAddLocacion.idCliente}
              onChange={handleNumericChangeAddLocacion}
              options={
                clientes?.data?.map((cliente) => ({
                  id: cliente.idCliente,
                  descripcion: cliente.nombre,
                })) || []
              }
              required
            />
            <InputSelect
              label="Ciudad*"
              placeholder="Ciudad"
              id="idCiudad"
              value={formAddLocacion.idCiudad}
              onChange={handleNumericChangeAddLocacion}
              options={
                ciudades?.data?.map((ciudad) => ({
                  id: ciudad.idCiudad,
                  descripcion: ciudad.descripcion,
                })) || []
              }
              required
            />
          </div>
          {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InputForm
              label="Días de anticipación de notificación*"
              placeholder="Días de anticipación de notificación"
              type="number"
              id="diasAnticipaticionNotificacion"
              value={formAddLocacion.diasAnticipaticionNotificacion.toString()}
              onChange={handleChangeAddLocacion}
              required
            />
          </div> */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h5 className="mb-3 text-sm font-medium text-gray-900">
              Es necesario agregar al menos un correo para poder enviar
              notificaciones.
            </h5>

            <InputForm
              label="Correo *"
              placeholder="Correo"
              type="email"
              id="correo"
              required={false}
              value={""}
              onChange={() => {}}
            />

            <div className="mt-4 flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  type="button"
                  className="rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300"
                  onClick={handleAddCorreo}
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => {
                setIsAddModalOpen(false);
                resetFormAddLocacion();
              }}
              className="w-auto bg-gray-500 hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isCreatingLocacion}
              className="w-auto"
            >
              {isCreatingLocacion ? "Creando..." : "Agregar"}
            </Button>
          </div>
        </form>
      </SimpleModal>

      {/* Modal para editar locación */}
      <SimpleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar locación"
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Formulario para editar una locación</p>
          {formEditLocacion && (
            <pre>{JSON.stringify(formEditLocacion, null, 2)}</pre>
          )}
        </div>
      </SimpleModal>

      <ConfirmarDelete
        isOpenDelete={isOpenDelete}
        text="¿Estás seguro de querer eliminar este cliente?"
        onDelete={() => {}}
        onClose={() => setIsOpenDelete(false)}
      />
    </div>
  );
}
