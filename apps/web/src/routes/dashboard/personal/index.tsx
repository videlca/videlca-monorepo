import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { Personal } from "../../../api/types/personal";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import {
  BriefcaseIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
} from "lucide-react";
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
import { useForm } from "../../../hooks/useForm";
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

  // Formularios
  const {
    form: formAddPersonal,
    handleChange: handleChangeAddPersonal,
    resetForm: resetFormAddPersonal,
    setForm: setFormAddPersonal,
  } = useForm<CreatePersonalDto>({
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
  });

  const {
    form: formEditPersonal,
    handleChange: handleChangeEditPersonal,
    setForm: setFormEditPersonal,
    resetForm: resetFormEditPersonal,
  } = useForm<UpdatePersonalDto>({
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
  });

  const {
    form: formAddNovedad,
    handleChange: handleChangeAddNovedad,
    handleChangeTime: handleChangeTimeAddNovedad,
    resetForm: resetFormAddNovedad,
  } = useForm<CreateNovedadDto>({
    descripcion: "",
    fechaInicio: "",
    horaInicio: "",
    fechaFin: "",
    horaFin: "",
    idTipoNovedad: 0,
  });

  const handleSubmitAddPersonal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createPersonal(
      {
        ...formAddPersonal,
        fechaActual: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setIsOpenAddModal(false);
          resetFormAddPersonal();
        },
      },
    );
  };

  const handleSubmitEditPersonal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updatePersonal(
      {
        id: selectedPersonal?.idPersonal || 0,
        data: {
          ...formEditPersonal,
          fechaActual: new Date().toISOString(),
        },
      },
      {
        onSuccess: () => {
          setIsOpenEditModal(false);
          resetFormEditPersonal();
        },
      },
    );
  };

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
                    setFormEditPersonal({
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
          resetFormAddPersonal();
        }}
        title="Agregar personal"
        size="2xl"
      >
        <FormsModal
          onSubmit={handleSubmitAddPersonal}
          isLoading={isCreatingPersonal}
          onCancel={() => {
            setIsOpenAddModal(false);
            resetFormAddPersonal();
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
                value={formAddPersonal.primerNombre}
                onChange={handleChangeAddPersonal}
              />
              <InputForm
                label="Segundo nombre"
                id="segundoNombre"
                type="text"
                placeholder="Segundo nombre"
                required
                value={formAddPersonal.segundoNombre}
                onChange={handleChangeAddPersonal}
              />
              <InputForm
                label="Primer apellido"
                id="primerApellido"
                type="text"
                placeholder="Primer apellido"
                required
                value={formAddPersonal.primerApellido}
                onChange={handleChangeAddPersonal}
              />
              <InputForm
                label="Segundo apellido"
                id="segundoApellido"
                type="text"
                placeholder="Segundo apellido"
                required
                value={formAddPersonal.segundoApellido}
                onChange={handleChangeAddPersonal}
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
                value={formAddPersonal.idTipoGenero}
                onChange={handleChangeAddPersonal}
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
                value={formAddPersonal.idTipoIdentificacion}
                onChange={handleChangeAddPersonal}
              />
              <InputForm
                label="Número de identificación"
                id="numeroIdentificacion"
                type="number"
                placeholder="Número de identificación"
                required
                value={formAddPersonal.numeroIdentificacion}
                onChange={handleChangeAddPersonal}
              />
              <InputForm
                label="Teléfono"
                id="telefono"
                type="number"
                placeholder="Teléfono"
                required
                value={formAddPersonal.telefono}
                onChange={handleChangeAddPersonal}
              />
              <InputForm
                label="Fecha de nacimiento"
                id="fechaNacimiento"
                type="date"
                placeholder="Fecha de nacimiento"
                required
                value={formAddPersonal.fechaNacimiento}
                onChange={handleChangeAddPersonal}
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
                value={formAddPersonal.idCiudad}
                onChange={handleChangeAddPersonal}
              />
              <InputForm
                label="Dirección de residencia"
                id="direccionResidencia"
                type="text"
                placeholder="Dirección de residencia"
                required
                value={formAddPersonal.direccionResidencia}
                onChange={handleChangeAddPersonal}
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
                value={formAddPersonal.idTipoContrato}
                onChange={(e) => {
                  handleChangeAddPersonal(e);
                  console.log(e.target.selectedOptions[0].text);
                  if (e.target.selectedOptions[0].text.includes("Indefinido")) {
                    formAddPersonal.fechaFinContrato = null;
                  } else {
                    formAddPersonal.fechaFinContrato = "";
                  }
                }}
              />
              <InputForm
                label="Fecha de inicio de contrato"
                id="fechaInicioContrato"
                type="date"
                placeholder="Fecha de inicio de contrato"
                required
                value={formAddPersonal.fechaInicioContrato}
                onChange={handleChangeAddPersonal}
              />
              <InputForm
                label="Fecha de fin de contrato"
                id="fechaFinContrato"
                type="date"
                placeholder="Fecha de fin de contrato"
                disabled={formAddPersonal.fechaFinContrato === null}
                required
                value={formAddPersonal.fechaFinContrato || ""}
                onChange={handleChangeAddPersonal}
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
                value={formAddPersonal.idTipoPersonal}
                onChange={handleChangeAddPersonal}
              />
              <CheckboxForm
                label="¿Tiene arma?"
                id="arma"
                checked={formAddPersonal.arma}
                onChange={handleChangeAddPersonal}
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
          resetFormEditPersonal();
        }}
        title="Editar personal"
        size="2xl"
      >
        <FormsModal
          onSubmit={handleSubmitEditPersonal}
          isLoading={isUpdatingPersonal}
          onCancel={() => {
            setIsOpenEditModal(false);
            setSelectedPersonal(null);
            resetFormEditPersonal();
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
                value={formEditPersonal.primerNombre || ""}
                onChange={handleChangeEditPersonal}
              />
              <InputForm
                label="Segundo nombre"
                id="segundoNombre"
                type="text"
                placeholder="Segundo nombre"
                required
                value={formEditPersonal.segundoNombre || ""}
                onChange={handleChangeEditPersonal}
              />
              <InputForm
                label="Primer apellido"
                id="primerApellido"
                type="text"
                placeholder="Primer apellido"
                required
                value={formEditPersonal.primerApellido || ""}
                onChange={handleChangeEditPersonal}
              />
              <InputForm
                label="Segundo apellido"
                id="segundoApellido"
                type="text"
                placeholder="Segundo apellido"
                required
                value={formEditPersonal.segundoApellido || ""}
                onChange={handleChangeEditPersonal}
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
                value={formEditPersonal.idTipoGenero || 0}
                onChange={handleChangeEditPersonal}
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
                value={formEditPersonal.idTipoIdentificacion || 0}
                onChange={handleChangeEditPersonal}
              />
              <InputForm
                label="Número de identificación"
                id="numeroIdentificacion"
                type="number"
                placeholder="Número de identificación"
                required
                value={formEditPersonal.numeroIdentificacion || ""}
                onChange={handleChangeEditPersonal}
              />
              <InputForm
                label="Teléfono"
                id="telefono"
                type="number"
                placeholder="Teléfono"
                required
                value={formEditPersonal.telefono || ""}
                onChange={handleChangeEditPersonal}
              />
              <InputForm
                label="Fecha de nacimiento"
                id="fechaNacimiento"
                type="date"
                placeholder="Fecha de nacimiento"
                required
                value={formEditPersonal.fechaNacimiento || ""}
                onChange={handleChangeEditPersonal}
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
                value={formEditPersonal.idCiudad || 0}
                onChange={handleChangeEditPersonal}
              />
              <InputForm
                label="Dirección de residencia"
                id="direccionResidencia"
                type="text"
                placeholder="Dirección de residencia"
                required
                value={formEditPersonal.direccionResidencia || ""}
                onChange={handleChangeEditPersonal}
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
                value={formEditPersonal.idTipoContrato || 0}
                onChange={(e) => {
                  handleChangeEditPersonal(e);
                  console.log(e.target.selectedOptions[0].text);
                  if (e.target.selectedOptions[0].text.includes("Indefinido")) {
                    formEditPersonal.fechaFinContrato = null;
                  } else {
                    formEditPersonal.fechaFinContrato = "";
                  }
                }}
              />
              <InputForm
                label="Fecha de inicio de contrato"
                id="fechaInicioContrato"
                type="date"
                placeholder="Fecha de inicio de contrato"
                required
                value={formEditPersonal.fechaInicioContrato || ""}
                onChange={handleChangeEditPersonal}
              />
              <InputForm
                label="Fecha de fin de contrato"
                id="fechaFinContrato"
                type="date"
                placeholder="Fecha de fin de contrato"
                disabled={formEditPersonal.fechaFinContrato === null}
                required
                value={formEditPersonal.fechaFinContrato || ""}
                onChange={handleChangeEditPersonal}
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
                value={formEditPersonal.idTipoPersonal || 0}
                onChange={handleChangeEditPersonal}
              />
              <CheckboxForm
                label="¿Tiene arma?"
                id="arma"
                checked={formEditPersonal.arma || false}
                onChange={handleChangeEditPersonal}
              />
              <CheckboxForm
                label="¿Está laborando?"
                id="laborando"
                checked={formEditPersonal.laborando || false}
                onChange={handleChangeEditPersonal}
              />
            </FormSection>
          </div>
        </FormsModal>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenAddNovedadModal}
        onClose={() => {
          setIsOpenAddNovedadModal(false);
          resetFormAddNovedad();
        }}
        title={"Agregar novedad"}
        size="lg"
      >
        <FormsModal
          onSubmit={(e) => {
            e.preventDefault();
            createNovedad(
              {
                idPersonal: selectedPersonal?.idPersonal || 0,
                data: {
                  ...formAddNovedad,
                  horaFin: timeFormat(formAddNovedad.horaFin || ""),
                  horaInicio: timeFormat(formAddNovedad.horaInicio || ""),
                },
              },
              {
                onSuccess: () => {
                  setIsOpenAddNovedadModal(false);
                  resetFormAddNovedad();
                },
              },
            );
          }}
          onCancel={() => {
            setIsOpenAddNovedadModal(false);
            resetFormAddNovedad();
          }}
          updating={false}
          isLoading={isLoadingCreateNovedad}
        >
          <div className="flex flex-col gap-4">
            <InputSelect
              label="Tipo de novedad"
              placeholder="Tipo de novedad"
              id="idTipoNovedad"
              value={formAddNovedad.idTipoNovedad}
              onChange={handleChangeAddNovedad}
              options={
                tiposNovedades?.data?.map((tipo) => ({
                  id: tipo.idTipoNovedad,
                  descripcion: tipo.descripcion,
                })) || []
              }
            />
            <InputForm
              label="Descripción"
              placeholder="Descripción"
              id="descripcion"
              value={formAddNovedad.descripcion || ""}
              onChange={handleChangeAddNovedad}
              type="text"
            />
            <InputForm
              label="Fecha de inicio"
              placeholder="Fecha de inicio"
              id="fechaInicio"
              value={formAddNovedad.fechaInicio || ""}
              onChange={handleChangeAddNovedad}
              type="date"
            />
            <InputTime24H
              label="Hora de inicio"
              placeholder="Selecciona una hora de inicio"
              id="horaInicio"
              name="horaInicio"
              value={formAddNovedad.horaInicio || ""}
              onChange={handleChangeTimeAddNovedad}
              required={true}
            />
            <InputForm
              label="Fecha de fin"
              placeholder="Fecha de fin"
              id="fechaFin"
              value={formAddNovedad.fechaFin || ""}
              onChange={handleChangeAddNovedad}
              type="date"
            />
            <InputTime24H
              label="Hora de fin"
              placeholder="Selecciona una hora de fin"
              id="horaFin"
              name="horaFin"
              value={formAddNovedad.horaFin || ""}
              onChange={handleChangeTimeAddNovedad}
              required={true}
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
