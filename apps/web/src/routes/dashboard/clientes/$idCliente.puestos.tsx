import { PageHeader } from "../../../components/ui/common/PageHeader";
import Typography from "@mui/material/Typography";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { useState } from "react";
import type { CreateCorreoDto, UpdatePuestoDto, CreatePuestoDto } from "../../../api/dtos";
import {
  useClientesActivo,
  useDeletePuesto,
  usePuestoById,
  usePuestosByCliente,
  useUpdatePuesto,
  useCreatePuesto,
} from "../../../api/queryFunctions/clientes";
import { useCiudad } from "../../../api/queryFunctions/configuracion";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { updatePuestoSchema, createPuestoSchema } from "../../../api/validations/puestoValidation";
import { showErrorToast } from "../../../api/utils/toastError";
import type { Puesto } from "../../../types";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { ButtonAction } from "../../../components/common/ButtonAction";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import MailOutlined from "@mui/icons-material/MailOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
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
import { CoordinateInput } from "../../../components/common/CoordinateInput";

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
  const [isAddPuestoModalOpen, setIsAddPuestoModalOpen] = useState(false);
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
  const { mutate: createPuesto, isPending: isCreatingPuesto } =
    useCreatePuesto();
  const { mutate: getPuestoById } = usePuestoById();
  const { mutate: deletePuesto } = useDeletePuesto();

  // Formularios

  const {
    register: registerAddPuesto,
    control: controlAddPuesto,
    handleSubmit: handleSubmitAddPuesto,
    reset: resetAddPuesto,
    setValue: setValueAddPuesto,
  } = useForm<CreatePuestoDto>({
    resolver: yupResolver(createPuestoSchema) as any,
    defaultValues: {
      idCliente: Number(idCliente),
      nombre: "",
      idClienteFacturacion: null,
      idCiudad: 0,
      direccion: "",
      latitud: "",
      longitud: "",
      primerNombreResponsable: "",
      primerApellidoResponsable: "",
      telefono: "",
      segundoTelefono: "",
      diasAnticipaticionNotificacion: 0,
      correos: [],
    },
  });

  // TODO: Agregar correos

  const {
    register: registerEdit,
    control: controlEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEditForm,
    setValue: setValueEdit,
  } = useForm<UpdatePuestoDto>({
    resolver: yupResolver(updatePuestoSchema) as any,
    defaultValues: {
      idCliente: 0,
      idClienteFacturacion: null,
      nombre: "",
      idCiudad: 0,
      direccion: "",
      latitud: "",
      longitud: "",
      primerNombreResponsable: "",
      primerApellidoResponsable: "",
      telefono: "",
      diasAnticipaticionNotificacion: 0,
      correos: [],
      estado: true,
    },
  });

  // Handlers

  const handleCloseAddPuesto = () => {
    setIsAddPuestoModalOpen(false);
    resetAddPuesto();
    setCorreos([]);
    setIsFacturacionDiferente(false);
  };

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
            latitud: data.data.latitud.toString(),
            longitud: data.data.longitud.toString(),
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
    setIsFacturacionDiferente(false);
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
      header: "Nombre del puesto",
    },
    {
      accessorKey: "idCiudad.descripcion",
      header: "Ciudad",
    },
    {
      accessorKey: "direccion",
      header: "Dirección",
      cell: ({ row }) => (
        <span className="whitespace-nowrap">{row.original.direccion}</span>
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
        <>{row.original.segundoTelefono || "N/A"}</>
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
        <>{row.original.correos.map((correo) => correo.email).join(", ")}</>
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
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Puestos cliente"
        actions={
          <>
            <ButtonAction
              Icon={ArrowBackIcon}
              label="Volver"
              color="blue-light"
              type="button"
              onClick={() => {
                navigate({
                  to: "/dashboard/clientes",
                });
              }}
            />
            <ButtonAction
              Icon={AddIcon}
              label="Agregar puesto"
              onClick={() => setIsAddPuestoModalOpen(true)}
            />
          </>
        }
      />
      <Table
        data={puestos?.data?.data || []}
        columns={columnsPuestos}
        enablePagination={true}
        pageSize={5}
        enableSorting={true}
        enableFiltering={true}
        filterColumns={[
          { label: "Nombre", value: "nombre" },
          { label: "Dirección", value: "direccion" },
          { label: "Cliente", value: "idCliente.nombre" },
          { label: "Ciudad", value: "idCiudad.descripcion" },
        ]}
      />

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
          onSubmit={handleSubmitAddPuesto((data) => {
            createPuesto(
              {
                ...data,
                idCiudad: Number(data.idCiudad),
                correos: correos,
                idClienteFacturacion: isFacturacionDiferente ? Number(data.idClienteFacturacion) : null,
                idCliente: Number(idCliente),
              },
              {
                onSuccess: (resData) => {
                  if (resData.status === 200 || resData.status === 201) {
                    handleCloseAddPuesto();
                  }
                },
              },
            );
          }, (errors) => {
            const messages = Object.values(errors).map((err) => err?.message).filter(Boolean) as string[];
            showErrorToast(messages, "Errores de validación");
          })}
        >
          <div className="flex flex-col gap-4">
            <FormSection
              title="Información del puesto"
              description="Información del puesto"
              Icon={BusinessOutlined}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputForm
                  label="Nombre*"
                  placeholder="Nombre"
                  type="text"
                  id="nombre"
                  required
                  {...registerAddPuesto("nombre")}
                />
                <InputSelect
                  label="Ciudad*"
                  placeholder="Ciudad"
                  id="idCiudad"
                  options={
                    ciudades?.data?.data?.map((ciudad) => ({
                      id: ciudad.idCiudad,
                      descripcion: ciudad.descripcion,
                    })) || []
                  }
                  required
                  control={controlAddPuesto}
                  name="idCiudad"
                />
                <InputForm
                  label="Dirección*"
                  placeholder="Dirección"
                  type="text"
                  id="direccion"
                  required
                  {...registerAddPuesto("direccion")}
                />
                <InputForm
                  label="Días de anticipación de notificación* (máximo 10 días)"
                  placeholder="Días de anticipación de notificación"
                  type="number"
                  id="diasAnticipaticionNotificacion"
                  maxLength={2}
                  required
                  {...registerAddPuesto("diasAnticipaticionNotificacion")}
                />
                <CoordinateInput
                  label="Latitud"
                  placeholder="Latitud"
                  id="latitud"
                  required={false}
                  maxLength={13}
                  {...registerAddPuesto("latitud")}
                />
                <CoordinateInput
                  label="Longitud"
                  placeholder="Longitud"
                  id="longitud"
                  required={false}
                  maxLength={13}
                  {...registerAddPuesto("longitud")}
                />
                <div className="md:col-span-2">
                  <CheckboxForm
                    label="El responsable de facturación es diferente al cliente."
                    id="isFacturacionDiferente"
                    checked={isFacturacionDiferente}
                    onChange={(e) => {
                      setIsFacturacionDiferente(e.target.checked);
                      if (!e.target.checked) {
                        setValueAddPuesto("idClienteFacturacion", null);
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
                        clientes?.data?.data?.map((cliente) => ({
                          id: cliente.idCliente,
                          descripcion: cliente.nombre,
                        })) || []
                      }
                      required
                      control={controlAddPuesto}
                      name="idClienteFacturacion"
                    />
                  </div>
                )}
              </div>
            </FormSection>
            <FormSection
              title="Información de contacto"
              description="Información de contacto"
              Icon={PersonOutlined}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <InputForm
                  label="Primer nombre responsable*"
                  placeholder="Primer nombre responsable"
                  type="text"
                  id="primerNombreResponsable"
                  required
                  {...registerAddPuesto("primerNombreResponsable")}
                />
                <InputForm
                  label="Primer apellido responsable*"
                  placeholder="Primer apellido responsable"
                  type="text"
                  id="primerApellidoResponsable"
                  required
                  {...registerAddPuesto("primerApellidoResponsable")}
                />
                <InputForm
                  label="Teléfono*"
                  placeholder="Teléfono"
                  type="text"
                  id="telefono"
                  prefix="+57"
                  maxLength={10}
                  allowNegative={false}
                  required
                  {...registerAddPuesto("telefono")}
                />
                <InputForm
                  label="Teléfono 2"
                  placeholder="Teléfono 2"
                  type="text"
                  id="segundoTelefono"
                  prefix="+57"
                  maxLength={10}
                  allowNegative={false}
                  required={false}
                  {...registerAddPuesto("segundoTelefono")}
                />
              </div>
            </FormSection>
            <FormSection
              title="Correos electrónicos"
              description="Correos electrónicos"
              Icon={MailOutlined}
              Details={
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Correos configurados ({correos.length})
                </Typography>
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
                onSuccess: (resData) => {
                  if (resData.status === 200 || resData.status === 201) {
                    handleCloseEditPuesto();
                  }
                },
              },
            );
          }, (errors) => {
            const messages = Object.values(errors).map((err) => err?.message).filter(Boolean) as string[];
            showErrorToast(messages, "Errores de validación");
          })}
        >
          <div className="flex flex-col gap-4">
            <FormSection
              title="Información de la puesto"
              description="Información de la puesto"
              Icon={BusinessOutlined}
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
                    ciudades?.data?.data.map((ciudad) => ({
                      id: ciudad.idCiudad,
                      descripcion: ciudad.descripcion,
                    })) || []
                  }
                  required
                  control={controlEdit}
                  name="idCiudad"
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
                  label="Días de anticipación de notificación* (máximo 10 días)"
                  placeholder="Días de anticipación de notificación"
                  type="number"
                  maxLength={2}
                  id="diasAnticipaticionNotificacion"
                  required
                  {...registerEdit("diasAnticipaticionNotificacion")}
                />
                <CoordinateInput
                  label="Latitud"
                  placeholder="Latitud"
                  id="latitud"
                  required={false}
                  maxLength={13}
                  {...registerEdit("latitud")}
                />
                <CoordinateInput
                  label="Longitud"
                  placeholder="Longitud"
                  id="longitud"
                  required={false}
                  maxLength={13}
                  {...registerEdit("longitud")}
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
                        clientes?.data?.data.map((cliente) => ({
                          id: cliente.idCliente,
                          descripcion: cliente.nombre,
                        })) || []
                      }
                      required
                      control={controlEdit}
                      name="idClienteFacturacion"
                    />
                  </div>
                )}
              </div>
            </FormSection>

            <FormSection
              title="Información de contacto"
              description="Información de contacto"
              Icon={PersonOutlined}
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
                  prefix="+57"
                  maxLength={10}
                  allowNegative={false}
                  required
                  {...registerEdit("telefono")}
                />
                <InputForm
                  label="Teléfono 2"
                  placeholder="Teléfono 2"
                  type="text"
                  id="segundoTelefono"
                  prefix="+57"
                  maxLength={10}
                  allowNegative={false}
                  required={false}
                  {...registerEdit("segundoTelefono")}
                />
              </div>
            </FormSection>

            <FormSection
              title="Correos electrónicos"
              description="Correos electrónicos"
              Icon={MailOutlined}
              Details={
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Correos configurados ({correos.length})
                </Typography>
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
