import { ButtonAction } from "../../../common/ButtonAction";
import { Building2, Download, Mail, PlusIcon, User } from "lucide-react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import Table from "../../../common/Table";
import { StateLabel } from "../../../common/StateLabel";
import type { Cliente } from "../../../../types";
import { SimpleModal } from "../../../common/SimpleModal";
import { useState, useEffect } from "react";
import {
  useClienteById,
  useClientesActivo,
  useCreateCliente,
  useDeleteCliente,
  useDescargarExcelClientes,
  useEnviarExcelClientes,
  useUpdateCliente,
} from "../../../../api/queryFunctions/clientes/clientes";
import { ConfirmarDelete } from "../../modals/ConfirmarDelete";
import { EnvioCorreos } from "../../modals/EnvioCorreos";

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
  useSegmentacionById,
  useSegmentaciones,
} from "../../../../api/queryFunctions/clientes";
import { InputSelect } from "../../../common/InputSelect";
import { InputSelectStateBoolean } from "../../../common/InputSelectState";
import { CheckboxForm } from "../../../common/CheckboxForm";
import { FormsModal } from "../../modals/FormsModal";
import { FormSection } from "../../../common/FormSection";
import { ConfiguracionCorreo } from "../../../common/ConfiguracionCorreo";
import { useNavigate } from "@tanstack/react-router";
import { MoreActionsButton } from "../../common/MoreActionsButton";
import { useForm } from "react-hook-form";

export function ClientesTab() {
  const navigate = useNavigate({ from: "/dashboard/clientes" });
  // Estados
  const [isAddPuestoModalOpen, setIsAddPuestoModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [isOpenEmail, setIsOpenEmail] = useState(false);
  const [isFacturacionDiferente, setIsFacturacionDiferente] = useState(false);

  const [correos, setCorreos] = useState<CreateCorreoDto[]>([]);

  // Mutaciones y queries
  const { data: clientes } = useClientesActivo();
  const { mutate: getClienteById } = useClienteById();
  const { mutate: createCliente, isPending: isCreatingCliente } =
    useCreateCliente();
  const { mutate: updateCliente, isPending: isUpdatingCliente } =
    useUpdateCliente();
  const { mutate: deleteCliente } = useDeleteCliente();
  const { mutate: descargarExcel, isPending: isDownloadingExcel } =
    useDescargarExcelClientes();
  const { mutate: enviarExcelClientes, isPending: isSendingExcel } =
    useEnviarExcelClientes();

  const { mutate: createPuesto, isPending: isCreatingPuesto } =
    useCreatePuesto();
  const { mutate: getSegmentacionbyId, data: segmentacionbyId } =
    useSegmentacionById();

  const { data: tipoIdentificacion } = useTipoIdentificacionActivo();
  const { data: tipoCliente } = useTipoCliente();
  const { data: segmentaciones } = useSegmentaciones();
  const { data: ciudades } = useCiudad();

  // Formularios con react-hook-form
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    watch: watchCreate,
  } = useForm<CreateClienteDto & { idSegmentacion: number }>({
    defaultValues: {
      idTipoIdentificacion: 0,
      numeroIdentificacion: "",
      nombre: "",
      idTipoCliente: 0,
      idSegmentacion: 0,
      idSubSegmentacion: 0,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    watch: watchEdit,
  } = useForm<UpdateClienteDto & { idSegmentacion: number }>({
    defaultValues: {
      idTipoIdentificacion: 0,
      numeroIdentificacion: "",
      nombre: "",
      idTipoCliente: 0,
      idSegmentacion: 0,
      idSubSegmentacion: 0,
      estado: true,
    },
  });

  const {
    register: registerAddPuesto,
    handleSubmit: handleSubmitAddPuesto,
    reset: resetAddPuesto,
    setValue: setValueAddPuesto,
  } = useForm<CreatePuestoDto>({
    defaultValues: {
      idCliente: 0,
      nombre: "",
      idClienteFacturacion: null,
      idCiudad: 0,
      direccion: "",
      latitud: 0,
      longitud: 0,
      primerNombreResponsable: "",
      primerApellidoResponsable: "",
      telefono: "",
      diasAnticipaticionNotificacion: 0,
      correos: [],
    },
  });

  const watchIdSegmentacionCreate = watchCreate("idSegmentacion");
  const watchIdSegmentacionEdit = watchEdit("idSegmentacion");

  useEffect(() => {
    if (watchIdSegmentacionCreate && watchIdSegmentacionCreate !== 0) {
      getSegmentacionbyId(watchIdSegmentacionCreate);
    }
  }, [watchIdSegmentacionCreate, getSegmentacionbyId]);

  useEffect(() => {
    if (watchIdSegmentacionEdit && watchIdSegmentacionEdit !== 0) {
      getSegmentacionbyId(watchIdSegmentacionEdit);
    }
  }, [watchIdSegmentacionEdit, getSegmentacionbyId]);

  // Handlers
  const handleShowEditClienteModal = (row: Row<Cliente>) => {
    setEditingCliente(row.original);
    getClienteById(row.original.idCliente, {
      onSuccess: (data) => {
        if (data.data) {
          resetEdit();
        }
      },
    });
    setIsEditModalOpen(true);
  };

  const handleCloseAddPuesto = () => {
    setIsAddPuestoModalOpen(false);
    resetAddPuesto();
    setCorreos([]);
    setIsFacturacionDiferente(false);
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
                setValueAddPuesto("idCliente", row.original.idCliente || 0);
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
      <div className="flex justify-end gap-2">
        <ButtonAction
          Icon={Download}
          label={isDownloadingExcel ? "Descargando..." : "Descargar Excel"}
          onClick={() => descargarExcel()}
          color="green-light"
          disabled={isDownloadingExcel}
        />
        <ButtonAction
          Icon={Mail}
          label={isSendingExcel ? "Enviando..." : "Enviar Excel"}
          onClick={() => setIsOpenEmail(true)}
          color="yellow-light"
          disabled={isSendingExcel}
        />
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
          resetCreate();
        }}
        title="Agregar cliente"
        size="xl"
      >
        <FormsModal
          isLoading={isCreatingCliente}
          onCancel={() => {
            setIsAddModalOpen(false);
            resetCreate();
          }}
          updating={false}
          onSubmit={handleSubmitCreate((data) => {
            const { idSegmentacion, ...submitData } = data;
            createCliente(
              {
                ...submitData,
                idTipoIdentificacion: Number(data.idTipoIdentificacion),
                idTipoCliente: Number(data.idTipoCliente),
                idSubSegmentacion: Number(data.idSubSegmentacion),
              },
              {
                onSuccess: () => {
                  setIsAddModalOpen(false);
                  resetCreate();
                },
              },
            );
          })}
        >
          <div className="flex flex-col gap-4">
            <InputSelect
              label="Tipo de identificación"
              placeholder="Tipo de identificación"
              id="idTipoIdentificacion"
              options={
                tipoIdentificacion?.data?.map((tipo) => ({
                  id: tipo.idTipoIdentificacion,
                  descripcion: tipo.descripcion,
                })) || []
              }
              required
              {...registerCreate("idTipoIdentificacion")}
            />
            <InputForm
              label="Número de identificación"
              placeholder="Número de identificación"
              id="numeroIdentificacion"
              type="text"
              required
              {...registerCreate("numeroIdentificacion")}
            />
            <InputForm
              label="Nombre"
              placeholder="Nombre"
              id="nombre"
              type="text"
              required
              {...registerCreate("nombre")}
            />
            <InputSelect
              label="Tipo de cliente"
              placeholder="Tipo de cliente"
              id="idTipoCliente"
              options={
                tipoCliente?.data?.map((tipo) => ({
                  id: tipo.idTipoCliente,
                  descripcion: tipo.descripcion,
                })) || []
              }
              required
              {...registerCreate("idTipoCliente")}
            />
            <InputSelect
              label="Segmentación"
              placeholder="Segmentación"
              id="idSegmentacion"
              options={
                segmentaciones?.data?.map((segmentacion) => ({
                  id: segmentacion.idSegmentacion,
                  descripcion: segmentacion.descripcion,
                })) || []
              }
              required
              {...registerCreate("idSegmentacion")}
            />
            <InputSelect
              label="Subsegmentación"
              placeholder="Subsegmentación"
              id="idSubSegmentacion"
              options={
                segmentacionbyId?.data?.subSegmentaciones?.map((sub) => ({
                  id: sub.idSubSegmentacion || 0,
                  descripcion: sub.descripcion,
                })) || []
              }
              required
              {...registerCreate("idSubSegmentacion")}
            />
          </div>
        </FormsModal>
      </SimpleModal>

      {/* Modal para editar cliente */}
      <SimpleModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          resetEdit();
        }}
        title="Editar cliente"
        size="xl"
      >
        <FormsModal
          isLoading={isUpdatingCliente}
          onCancel={() => {
            setIsEditModalOpen(false);
            resetEdit();
          }}
          updating={true}
          onSubmit={handleSubmitEdit((data) => {
            const { idSegmentacion, ...submitData } = data;
            updateCliente(
              {
                id: editingCliente?.idCliente || 0,
                data: {
                  ...submitData,
                  idTipoIdentificacion: Number(data.idTipoIdentificacion),
                  idTipoCliente: Number(data.idTipoCliente),
                  idSubSegmentacion: Number(data.idSubSegmentacion),
                  estado: String(data.estado) === "true",
                },
              },
              {
                onSuccess: () => {
                  setIsEditModalOpen(false);
                  resetEdit();
                  setEditingCliente(null);
                },
              },
            );
          })}
        >
          <div className="flex flex-col gap-4">
            <InputSelect
              label="Tipo de identificación"
              placeholder="Tipo de identificación"
              id="idTipoIdentificacion"
              options={
                tipoIdentificacion?.data?.map((tipo) => ({
                  id: tipo.idTipoIdentificacion,
                  descripcion: tipo.descripcion,
                })) || []
              }
              required
              {...registerEdit("idTipoIdentificacion")}
            />
            <InputForm
              label="Número de identificación"
              placeholder="Número de identificación"
              id="numeroIdentificacion"
              type="text"
              required
              {...registerEdit("numeroIdentificacion")}
            />
            <InputForm
              label="Nombre"
              placeholder="Nombre"
              id="nombre"
              type="text"
              required
              {...registerEdit("nombre")}
            />
            <InputSelect
              label="Tipo de cliente"
              placeholder="Tipo de cliente"
              id="idTipoCliente"
              options={
                tipoCliente?.data?.map((tipo) => ({
                  id: tipo.idTipoCliente,
                  descripcion: tipo.descripcion,
                })) || []
              }
              required
              {...registerEdit("idTipoCliente")}
            />
            <InputSelect
              label="Segmentación"
              placeholder="Segmentación"
              id="idSegmentacion"
              options={
                segmentaciones?.data?.map((segmentacion) => ({
                  id: segmentacion.idSegmentacion,
                  descripcion: segmentacion.descripcion,
                })) || []
              }
              required
              {...registerEdit("idSegmentacion")}
            />
            <InputSelect
              label="Subsegmentación"
              placeholder="Subsegmentación"
              id="idSubSegmentacion"
              options={
                segmentacionbyId?.data?.subSegmentaciones?.map((sub) => ({
                  id: sub.idSubSegmentacion || 0,
                  descripcion: sub.descripcion,
                })) || []
              }
              required
              disabled={!watchIdSegmentacionEdit}
              {...registerEdit("idSubSegmentacion")}
            />
            <InputSelectStateBoolean
              label="Estado"
              placeholder="Estado"
              id="estado"
              {...registerEdit("estado")}
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
          onSubmit={handleSubmitAddPuesto((data) => {
            createPuesto(
              {
                ...data,
                idCiudad: Number(data.idCiudad),
                correos: correos,
                idClienteFacturacion: isFacturacionDiferente ? Number(data.idClienteFacturacion) : null,
              },
              {
                onSuccess: () => {
                  handleCloseAddPuesto();
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
                  {...registerAddPuesto("nombre")}
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
                  {...registerAddPuesto("idCiudad")}
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
                  label="Días de anticipación de notificación*"
                  placeholder="Días de anticipación de notificación"
                  type="number"
                  id="diasAnticipaticionNotificacion"
                  required
                  {...registerAddPuesto("diasAnticipaticionNotificacion")}
                />
                <InputForm
                  label="Latitud*"
                  placeholder="Latitud"
                  type="number"
                  id="latitud"
                  required
                  allowNegative={true}
                  {...registerAddPuesto("latitud")}
                />
                <InputForm
                  label="Longitud*"
                  placeholder="Longitud"
                  type="number"
                  id="longitud"
                  required
                  allowNegative={true}
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
                        clientes?.data?.map((cliente) => ({
                          id: cliente.idCliente,
                          descripcion: cliente.nombre,
                        })) || []
                      }
                      required
                      {...registerAddPuesto("idClienteFacturacion")}
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
                  required
                  {...registerAddPuesto("telefono")}
                />
                <InputForm
                  label="Teléfono 2"
                  placeholder="Teléfono 2"
                  type="text"
                  id="segundoTelefono"
                  required={false}
                  {...registerAddPuesto("segundoTelefono")}
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

      <EnvioCorreos
        isOpen={isOpenEmail}
        setIsOpen={setIsOpenEmail}
        mutationEmail={enviarExcelClientes}
        envioCorreoPending={isSendingExcel}
      />
    </div>
  );
}
