import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useState } from "react";
import type { CreateCorreoDto, UpdatePuestoDto } from "../../../api/dtos";
import {
  useClientesActivo,
  useDeletePuesto,
  usePuestoById,
  usePuestosByCliente,
  useUpdatePuesto,
} from "../../../api/queryFunctions/clientes";
import { useCiudad } from "../../../api/queryFunctions/configuracion";
import { useForm } from "react-hook-form";
import type { Puesto } from "../../../types";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { ArrowLeftIcon, Building2, Mail, User } from "lucide-react";
import Table from "../../../components/common/Table";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { FormSection } from "../../../components/common/FormSection";
import { InputForm } from "../../../components/common/InputForm";
import { InputSelect } from "../../../components/common/InputSelect";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";
import { ConfiguracionCorreo } from "../../../components/common/ConfiguracionCorreo";
import { CheckboxForm } from "../../../components/common/CheckboxForm";

export const Route = createFileRoute("/dashboard/clientes/$idCliente/puestos")({
  component: RouteComponent,
});

export function RouteComponent() {
  const { idCliente } = useParams({
    from: "/dashboard/clientes/$idCliente/puestos",
  });
  // Estados
  const navigate = useNavigate({ from: "/dashboard/clientes" });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [correos, setCorreos] = useState<CreateCorreoDto[]>([]);
  const [idPuestoSelected, setIdPuestoSelected] = useState<number | null>(null);
  const [isFacturacionDiferente, setIsFacturacionDiferente] = useState(false);

  // Mutaciones y Queries
  const { data: puestos } = usePuestosByCliente(Number(idCliente));
  const { data: ciudades } = useCiudad();
  const { data: clientes } = useClientesActivo();

  const { mutate: updatePuesto, isPending: isUpdatingPuesto } =
    useUpdatePuesto();
  const { mutate: getPuestoById } = usePuestoById();
  const { mutate: deletePuesto } = useDeletePuesto();

  // Formularios

  // TODO: Agregar correos

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEditForm,
    setValue: setValueEdit,

  } = useForm<UpdatePuestoDto>({
    defaultValues: {
      idCliente: 0,
      idClienteFacturacion: null,
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
    },
  });

  // Handlers

  const handleShowEditPuestoModal = (row: Row<Puesto>) => {
    getPuestoById(row.original.idLocacion, {
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
          resetEditForm({
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
            correos: [...correosFormatted],
          });
          setIsFacturacionDiferente(data.data.idClienteFacturacion != null);
          setCorreos(correosFormatted);
        }
      },
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditPuesto = () => {
    setIsEditModalOpen(false);
    resetEditForm();
    setCorreos([]);
  };

  const columnsPuestos: ColumnDef<Puesto>[] = [
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
      header: "Nombre de la puesto",
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Puestos cliente</h1>
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
        data={puestos?.data || []}
        columns={columnsPuestos}
        enablePagination={true}
        pageSize={5}
        enableSorting={true}
        enableFiltering={true}
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
                  idCiudad: Number(data.idCiudad),
                  correos: correos,
                },
              },
              {
                onSuccess: () => {
                  handleCloseEditPuesto();

                },
              },
            );
          })}
        >
          <div className="flex flex-col gap-4">
            <FormSection
              title="Información de la puesto"
              description="Información de la puesto"
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
                  label="Ciudad*"
                  placeholder="Ciudad"
                  id="idCiudad"
                  options={
                    ciudades?.data?.map((ciudad) => ({
                      id: ciudad.idCiudad,
                      descripcion: ciudad.descripcion,
                    })) || []
                  }
                  required
                  {...registerEdit("idCiudad", { valueAsNumber: true })}
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
                  {...registerEdit("diasAnticipaticionNotificacion", { valueAsNumber: true })}
                />
                <InputForm
                  label="Latitud*"
                  placeholder="Latitud"
                  type="number"
                  id="latitud"
                  required
                  allowNegative={true}
                  {...registerEdit("latitud", { valueAsNumber: true })}
                />
                <InputForm
                  label="Longitud*"
                  placeholder="Longitud"
                  type="number"
                  id="longitud"
                  required
                  allowNegative={true}
                  {...registerEdit("longitud", { valueAsNumber: true })}
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
                      label="Cliente facturación*"
                      placeholder="Cliente facturación"
                      id="idClienteFacturacion"
                      options={
                        clientes?.data?.map((cliente) => ({
                          id: cliente.idCliente,
                          descripcion: cliente.nombre,
                        })) || []
                      }
                      required
                      {...registerEdit("idClienteFacturacion")}
                    />
                  </div>
                )}
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
                  type="text"
                  id="telefono"
                  required
                  {...registerEdit("telefono")}
                />
                <InputForm
                  label="Teléfono 2"
                  placeholder="Teléfono 2"
                  type="text"
                  id="segundoTelefono"
                  required={false}
                  {...registerEdit("segundoTelefono")}
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
        text="¿Estás seguro de querer eliminar esta puesto?"
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
