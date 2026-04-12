import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { Personal } from "../../../api/types/personal";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { BriefcaseIcon, PlusIcon, UserIcon } from "lucide-react";
import { ButtonAction } from "../../../components/common/ButtonAction";
import Table from "../../../components/common/Table";
import {
  useCreatePersonal,
  useCreatePersonalNovedad,
  useDeletePersonal,
  usePersonal,
  usePersonalById,
  useUpdatePersonal,
} from "../../../api/queryFunctions/personal";
import { useState } from "react";
import { SimpleModal } from "../../../components/common/SimpleModal";
import {
  useCiudadActiva,
  useTipoContratoActivo,
  useTipoGenero,
  useTipoIdentificacion,
  useTipoNovedad,
  useTipoPersonalActivo,
} from "../../../api/queryFunctions/configuracion";

import type {
  CreateNovedadDto,
  CreatePersonalDto,
  UpdatePersonalDto,
} from "../../../api/dtos/personal";
import { InputForm } from "../../../components/common/InputForm";
import { InputSelect } from "../../../components/common/InputSelect";
import { CheckboxForm } from "../../../components/common/CheckboxForm";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { FormSection } from "../../../components/common/FormSection";
import { timeFormat } from "../../../utils/TimeFormat";
import { InputTime24H } from "../../../components/common/InputTime24H";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";
import { useForm } from "react-hook-form";

export const Route = createFileRoute("/dashboard/personal/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate({ from: "/dashboard/personal" });
  // Estados
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [isOpenEditModal, setIsOpenEditModal] = useState(false);
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
  const [selectedPersonal, setSelectedPersonal] = useState<Personal | null>(
    null,
  );

  const [isOpenAddNovedadModal, setIsOpenAddNovedadModal] = useState(false);
  // Queries y mutaciones
  const { data: personal } = usePersonal();
  const { data: tiposIdentificacion } = useTipoIdentificacion();
  const { data: ciudades } = useCiudadActiva();
  const { data: tiposGenero } = useTipoGenero();
  const { data: tiposPersonal } = useTipoPersonalActivo();
  const { data: tiposNovedades } = useTipoNovedad();
  const { data: tiposContrato } = useTipoContratoActivo();

  const { mutate: createPersonal, isPending: isCreatingPersonal } =
    useCreatePersonal();
  const { mutate: getPersonalById } = usePersonalById();
  const { mutate: updatePersonal, isPending: isUpdatingPersonal } =
    useUpdatePersonal();
  const { mutate: deletePersonal } = useDeletePersonal();

  const { mutate: createNovedad, isPending: isLoadingCreateNovedad } =
    useCreatePersonalNovedad();

  // Formularios con react-hook-form
  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    reset: resetAdd,
    watch: watchAdd,
    setValue: setValueAdd,
  } = useForm<CreatePersonalDto>({
    defaultValues: {
      primerNombre: "",
      segundoNombre: "",
      primerApellido: "",
      segundoApellido: "",
      numeroIdentificacion: "",
      fechaActual: "",
      fechaInicioContrato: "",
      fechaFinContrato: "",
      fechaNacimiento: "",
      direccionResidencia: "",
      telefono: "",
      arma: false,
      idTipoIdentificacion: 0,
      idCiudad: 0,
      idTipoGenero: 0,
      idTipoPersonal: 0,
      idTipoContrato: 0,
    },
  });

  const fechaFinContratoAdd = watchAdd("fechaFinContrato");

  const {
    register: registerEditPersonal,
    handleSubmit: handleSubmitEditPersonal,
    reset: resetEditPersonal,
    watch: watchEdit,
    setValue: setValueEdit,
  } = useForm<UpdatePersonalDto>({
    defaultValues: {
      primerNombre: "",
      segundoNombre: "",
      primerApellido: "",
      segundoApellido: "",
      numeroIdentificacion: "",
      fechaActual: "",
      fechaInicioContrato: "",
      fechaFinContrato: "",
      fechaNacimiento: "",
      direccionResidencia: "",
      telefono: "",
      arma: false,
      idTipoIdentificacion: 0,
      idCiudad: 0,
      idTipoGenero: 0,
      idTipoPersonal: 0,
      idTipoContrato: 0,
      laborando: false,
    },
  });

  const fechaFinContratoEdit = watchEdit("fechaFinContrato");

  const {
    register: registerNovedad,
    handleSubmit: handleSubmitNovedad,
    reset: resetNovedad,
  } = useForm<CreateNovedadDto>({
    defaultValues: {
      descripcion: "",
      fechaInicio: "",
      horaInicio: "",
      fechaFin: "",
      horaFin: "",
      idTipoNovedad: 0,
    },
  });

  const columns: ColumnDef<Personal>[] = [
    {
      accessorKey: "idPersonal",
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
      accessorKey: "primerNombre",
      header: "Primer nombre",
    },
    {
      accessorKey: "segundoNombre",
      header: "Segundo nombre",
    },
    {
      accessorKey: "primerApellido",
      header: "Primer apellido",
    },
    {
      accessorKey: "segundoApellido",
      header: "Segundo apellido",
    },
    {
      accessorKey: "fechaInicioContrato",
      header: "Fecha de inicio de contrato",
    },
    {
      accessorKey: "idCiudad.descripcion",
      header: "Ciudad",
    },
    {
      accessorKey: "idTipoGenero.descripcion",
      header: "Género",
    },
    {
      accessorKey: "idTipoPersonal.descripcion",
      header: "Tipo de personal",
    },
    {
      accessorKey: "laborando",
      header: "Laborando",
      cell: ({ row }) => <StateLabel state={row.original.laborando} />,
    },
    {
      accessorKey: "arma",
      header: "Arma",
      cell: ({ row }) => <StateLabel state={row.original.arma} />,
    },
    {
      accessorKey: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <MoreActionsButton
          menuId={`actions-${row.original.idPersonal}`}
          actions={[
            {
              label: "Agregar novedad",
              onClick: () => {
                setSelectedPersonal(row.original);
                setIsOpenAddNovedadModal(true);
              },
            },
            {
              label: "Ver novedades",
              onClick: () => {
                navigate({
                  to: "/dashboard/personal/novedades-personal/$id",
                  params: { id: row.original.idPersonal.toString() },
                });
              },
            },
            {
              label: "Editar",
              onClick: () => {
                setSelectedPersonal(row.original);
                setIsOpenEditModal(true);
                getPersonalById(row.original.idPersonal, {
                  onSuccess: (data) => {
                    resetEditPersonal({
                      primerNombre: data.data?.primerNombre || "",
                      segundoNombre: data.data?.segundoNombre || "",
                      primerApellido: data.data?.primerApellido || "",
                      segundoApellido: data.data?.segundoApellido || "",
                      numeroIdentificacion:
                        data.data?.numeroIdentificacion || "",
                      fechaInicioContrato: data.data?.fechaInicioContrato || "",
                      fechaFinContrato: data.data?.fechaFinContrato || null,
                      fechaNacimiento: data.data?.fechaNacimiento || "",
                      direccionResidencia: data.data?.direccionResidencia || "",
                      telefono: data.data?.telefono || "",
                      arma: data.data?.arma || false,
                      idTipoIdentificacion:
                        data.data?.idTipoIdentificacion?.idTipoIdentificacion ||
                        0,
                      idCiudad: data.data?.idCiudad?.idCiudad || 0,
                      idTipoGenero: data.data?.idTipoGenero?.idTipoGenero || 0,
                      idTipoPersonal:
                        data.data?.idTipoPersonal?.idTipoPersonal || 0,
                      laborando: data.data?.laborando || false,
                      idTipoContrato:
                        data.data?.idTipoContrato?.idTipoContrato || 0,
                    });
                  },
                });
              },
            },
            {
              label: "Eliminar",
              onClick: () => {
                setSelectedPersonal(row.original);
                setIsOpenDeleteModal(true);
              },
              color: "red" as const,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="flex justify-end">
          <ButtonAction
            Icon={PlusIcon}
            label="Nuevo personal"
            onClick={() => setIsOpenAddModal(true)}
          />
        </div>
        <Table
          data={personal?.data || []}
          columns={columns}
          enablePagination={true}
          pageSize={5}
          enableSorting={true}
          enableFiltering={true}
        />
      </div>
      <SimpleModal
        isOpen={isOpenAddModal}
        onClose={() => {
          setIsOpenAddModal(false);
          resetAdd();
        }}
        title="Agregar personal"
        size="2xl"
      >
        <FormsModal
          onSubmit={handleSubmitAdd((data) => {
            createPersonal(
              {
                ...data,
                fechaActual: new Date().toISOString(),
                idTipoIdentificacion: Number(data.idTipoIdentificacion),
                idCiudad: Number(data.idCiudad),
                idTipoGenero: Number(data.idTipoGenero),
                idTipoPersonal: Number(data.idTipoPersonal),
                idTipoContrato: Number(data.idTipoContrato),
              },
              {
                onSuccess: () => {
                  setIsOpenAddModal(false);
                  resetAdd();
                },
              },
            );
          })}
          isLoading={isCreatingPersonal}
          onCancel={() => {
            setIsOpenAddModal(false);
            resetAdd();
          }}
          updating={false}
        >
          <div className="flex flex-col gap-4">
            <FormSection
              title="Información personal"
              description="Información personal del personal"
              Icon={UserIcon}
            >
              <InputForm
                label="Primer nombre"
                id="primerNombre"
                type="text"
                placeholder="Primer nombre"
                required
                {...registerAdd("primerNombre")}
              />
              <InputForm
                label="Segundo nombre"
                id="segundoNombre"
                type="text"
                placeholder="Segundo nombre"
                required
                {...registerAdd("segundoNombre")}
              />
              <InputForm
                label="Primer apellido"
                id="primerApellido"
                type="text"
                placeholder="Primer apellido"
                required
                {...registerAdd("primerApellido")}
              />
              <InputForm
                label="Segundo apellido"
                id="segundoApellido"
                type="text"
                placeholder="Segundo apellido"
                required
                {...registerAdd("segundoApellido")}
              />
              <InputSelect
                label="Género"
                id="idTipoGenero"
                placeholder="Género"
                required
                options={
                  tiposGenero?.data?.map((genero) => ({
                    id: genero.idTipoGenero,
                    descripcion: genero.descripcion,
                  })) || []
                }
                {...registerAdd("idTipoGenero")}
              />
              <InputSelect
                label="Tipo de identificación"
                id="idTipoIdentificacion"
                placeholder="Tipo de identificación"
                required
                options={
                  tiposIdentificacion?.data?.map((tipo) => ({
                    id: tipo.idTipoIdentificacion,
                    descripcion: tipo.descripcion,
                  })) || []
                }
                {...registerAdd("idTipoIdentificacion")}
              />
              <InputForm
                label="Número de identificación"
                id="numeroIdentificacion"
                type="number"
                placeholder="Número de identificación"
                required
                {...registerAdd("numeroIdentificacion")}
              />
              <InputForm
                label="Teléfono"
                id="telefono"
                type="number"
                placeholder="Teléfono"
                required
                {...registerAdd("telefono")}
              />
              <InputForm
                label="Fecha de nacimiento"
                id="fechaNacimiento"
                type="date"
                placeholder="Fecha de nacimiento"
                required
                {...registerAdd("fechaNacimiento")}
              />
              <InputSelect
                label="Ciudad"
                id="idCiudad"
                placeholder="Ciudad"
                required
                options={
                  ciudades?.data?.map((ciudad) => ({
                    id: ciudad.idCiudad,
                    descripcion: ciudad.descripcion,
                  })) || []
                }
                {...registerAdd("idCiudad")}
              />
              <InputForm
                label="Dirección de residencia"
                id="direccionResidencia"
                type="text"
                placeholder="Dirección de residencia"
                required
                {...registerAdd("direccionResidencia")}
              />
            </FormSection>
            <FormSection
              title="Información laboral"
              description="Información laboral del personal"
              Icon={BriefcaseIcon}
            >
              <InputSelect
                label="Tipo de contrato"
                id="idTipoContrato"
                placeholder="Tipo de contrato"
                required
                options={
                  tiposContrato?.data?.map((contrato) => ({
                    id: contrato.idTipoContrato,
                    descripcion: contrato.descripcion,
                  })) || []
                }
                {...registerAdd("idTipoContrato", {
                  onChange: (e) => {
                    if (e.target.selectedOptions[0].text.includes("Indefinido")) {
                      setValueAdd("fechaFinContrato", null);
                    } else {
                      setValueAdd("fechaFinContrato", "");
                    }
                  },
                })}
              />
              <InputForm
                label="Fecha de inicio de contrato"
                id="fechaInicioContrato"
                type="date"
                placeholder="Fecha de inicio de contrato"
                required
                {...registerAdd("fechaInicioContrato")}
              />
              <InputForm
                label="Fecha de fin de contrato"
                id="fechaFinContrato"
                type="date"
                placeholder="Fecha de fin de contrato"
                disabled={fechaFinContratoAdd === null}
                required
                {...registerAdd("fechaFinContrato")}
                value={fechaFinContratoAdd || ""}
              />

              <InputSelect
                label="Tipo de personal"
                id="idTipoPersonal"
                placeholder="Tipo de personal"
                required
                options={
                  tiposPersonal?.data?.map((personal) => ({
                    id: personal.idTipoPersonal,
                    descripcion: personal.descripcion,
                  })) || []
                }
                {...registerAdd("idTipoPersonal")}
              />
              <CheckboxForm
                label="¿Tiene arma?"
                id="arma"
                {...registerAdd("arma")}
              />
            </FormSection>
          </div>
        </FormsModal>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenEditModal}
        onClose={() => {
          setIsOpenEditModal(false);
          setSelectedPersonal(null);
          resetEditPersonal();
        }}
        title="Editar personal"
        size="2xl"
      >
        <FormsModal
          onSubmit={handleSubmitEditPersonal((data) => {
            updatePersonal(
              {
                id: selectedPersonal?.idPersonal || 0,
                data: {
                  ...data,
                  fechaActual: new Date().toISOString(),
                  idTipoIdentificacion: Number(data.idTipoIdentificacion),
                  idCiudad: Number(data.idCiudad),
                  idTipoGenero: Number(data.idTipoGenero),
                  idTipoPersonal: Number(data.idTipoPersonal),
                  idTipoContrato: Number(data.idTipoContrato),
                },
              },
              {
                onSuccess: () => {
                  setIsOpenEditModal(false);
                  resetEditPersonal();
                },
              },
            );
          })}
          isLoading={isUpdatingPersonal}
          onCancel={() => {
            setIsOpenEditModal(false);
            setSelectedPersonal(null);
            resetEditPersonal();
          }}
          updating={true}
        >
          <div className="flex flex-col gap-4">
            <FormSection
              title="Información personal"
              description="Información personal del personal"
              Icon={UserIcon}
            >
              <InputForm
                label="Primer nombre"
                id="primerNombre"
                type="text"
                placeholder="Primer nombre"
                required
                {...registerEditPersonal("primerNombre")}
              />
              <InputForm
                label="Segundo nombre"
                id="segundoNombre"
                type="text"
                placeholder="Segundo nombre"
                required
                {...registerEditPersonal("segundoNombre")}
              />
              <InputForm
                label="Primer apellido"
                id="primerApellido"
                type="text"
                placeholder="Primer apellido"
                required
                {...registerEditPersonal("primerApellido")}
              />
              <InputForm
                label="Segundo apellido"
                id="segundoApellido"
                type="text"
                placeholder="Segundo apellido"
                required
                {...registerEditPersonal("segundoApellido")}
              />
              <InputSelect
                label="Género"
                id="idTipoGenero"
                placeholder="Género"
                required
                options={
                  tiposGenero?.data?.map((genero) => ({
                    id: genero.idTipoGenero,
                    descripcion: genero.descripcion,
                  })) || []
                }
                {...registerEditPersonal("idTipoGenero")}
              />
              <InputSelect
                label="Tipo de identificación"
                id="idTipoIdentificacion"
                placeholder="Tipo de identificación"
                required
                options={
                  tiposIdentificacion?.data?.map((tipo) => ({
                    id: tipo.idTipoIdentificacion,
                    descripcion: tipo.descripcion,
                  })) || []
                }
                {...registerEditPersonal("idTipoIdentificacion")}
              />
              <InputForm
                label="Número de identificación"
                id="numeroIdentificacion"
                type="number"
                placeholder="Número de identificación"
                required
                {...registerEditPersonal("numeroIdentificacion")}
              />
              <InputForm
                label="Teléfono"
                id="telefono"
                type="number"
                placeholder="Teléfono"
                required
                {...registerEditPersonal("telefono")}
              />
              <InputForm
                label="Fecha de nacimiento"
                id="fechaNacimiento"
                type="date"
                placeholder="Fecha de nacimiento"
                required
                {...registerEditPersonal("fechaNacimiento")}
              />
              <InputSelect
                label="Ciudad"
                id="idCiudad"
                placeholder="Ciudad"
                required
                options={
                  ciudades?.data?.map((ciudad) => ({
                    id: ciudad.idCiudad,
                    descripcion: ciudad.descripcion,
                  })) || []
                }
                {...registerEditPersonal("idCiudad")}
              />
              <InputForm
                label="Dirección de residencia"
                id="direccionResidencia"
                type="text"
                placeholder="Dirección de residencia"
                required
                {...registerEditPersonal("direccionResidencia")}
              />
            </FormSection>
            <FormSection
              title="Información laboral"
              description="Información laboral del personal"
              Icon={BriefcaseIcon}
            >
              <InputSelect
                label="Tipo de contrato"
                id="idTipoContrato"
                placeholder="Tipo de contrato"
                required
                options={
                  tiposContrato?.data?.map((contrato) => ({
                    id: contrato.idTipoContrato,
                    descripcion: contrato.descripcion,
                  })) || []
                }
                {...registerEditPersonal("idTipoContrato", {
                  onChange: (e) => {
                    if (e.target.selectedOptions[0].text.includes("Indefinido")) {
                      setValueEdit("fechaFinContrato", null);
                    } else {
                      setValueEdit("fechaFinContrato", "");
                    }
                  },
                })}
              />
              <InputForm
                label="Fecha de inicio de contrato"
                id="fechaInicioContrato"
                type="date"
                placeholder="Fecha de inicio de contrato"
                required
                {...registerEditPersonal("fechaInicioContrato")}
              />
              <InputForm
                label="Fecha de fin de contrato"
                id="fechaFinContrato"
                type="date"
                placeholder="Fecha de fin de contrato"
                disabled={fechaFinContratoEdit === null}
                required
                {...registerEditPersonal("fechaFinContrato")}
                value={fechaFinContratoEdit || ""}
              />

              <InputSelect
                label="Tipo de personal"
                id="idTipoPersonal"
                placeholder="Tipo de personal"
                required
                options={
                  tiposPersonal?.data?.map((personal) => ({
                    id: personal.idTipoPersonal,
                    descripcion: personal.descripcion,
                  })) || []
                }
                {...registerEditPersonal("idTipoPersonal")}
              />
              <CheckboxForm
                label="¿Tiene arma?"
                id="arma"
                {...registerEditPersonal("arma")}
              />
              <CheckboxForm
                label="¿Está laborando?"
                id="laborando"
                {...registerEditPersonal("laborando")}
              />
            </FormSection>
          </div>
        </FormsModal>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenAddNovedadModal}
        onClose={() => {
          setIsOpenAddNovedadModal(false);
          resetNovedad();
        }}
        title={"Agregar novedad"}
        size="lg"
      >
        <FormsModal
          onSubmit={handleSubmitNovedad((data) => {
            createNovedad(
              {
                idPersonal: selectedPersonal?.idPersonal || 0,
                data: {
                  ...data,
                  idTipoNovedad: Number(data.idTipoNovedad),
                  horaFin: timeFormat(data.horaFin || ""),
                  horaInicio: timeFormat(data.horaInicio || ""),
                },
              },
              {
                onSuccess: () => {
                  setIsOpenAddNovedadModal(false);
                  resetNovedad();
                },
              },
            );
          })}
          onCancel={() => {
            setIsOpenAddNovedadModal(false);
            resetNovedad();
          }}
          updating={false}
          isLoading={isLoadingCreateNovedad}
        >
          <div className="flex flex-col gap-4">
            <InputSelect
              label="Tipo de novedad"
              placeholder="Tipo de novedad"
              id="idTipoNovedad"
              options={
                tiposNovedades?.data?.map((tipo) => ({
                  id: tipo.idTipoNovedad,
                  descripcion: tipo.descripcion,
                })) || []
              }
              {...registerNovedad("idTipoNovedad")}
            />
            <InputForm
              label="Descripción"
              placeholder="Descripción"
              id="descripcion"
              type="text"
              {...registerNovedad("descripcion")}
            />
            <InputForm
              label="Fecha de inicio"
              placeholder="Fecha de inicio"
              id="fechaInicio"
              type="date"
              {...registerNovedad("fechaInicio")}
            />
            <InputTime24H
              label="Hora de inicio"
              placeholder="Selecciona una hora de inicio"
              id="horaInicio"
              required={true}
              {...registerNovedad("horaInicio")}
            />
            <InputForm
              label="Fecha de fin"
              placeholder="Fecha de fin"
              id="fechaFin"
              type="date"
              {...registerNovedad("fechaFin")}
            />
            <InputTime24H
              label="Hora de fin"
              placeholder="Selecciona una hora de fin"
              id="horaFin"
              required={true}
              {...registerNovedad("horaFin")}
            />
          </div>
        </FormsModal>
      </SimpleModal>

      <ConfirmarDelete
        isOpenDelete={isOpenDeleteModal}
        text="¿Estás seguro de querer eliminar este personal?"
        onDelete={() => {
          deletePersonal(selectedPersonal?.idPersonal || 0, {
            onSuccess: () => {
              setIsOpenDeleteModal(false);
              setSelectedPersonal(null);
            },
          });
        }}
        onClose={() => setIsOpenDeleteModal(false)}
      />
    </Section>
  );
}
