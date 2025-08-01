import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { Personal } from "../../../api/types/personal";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import { PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
import { ButtonAction } from "../../../components/common/ButtonAction";
import Table from "../../../components/common/Table";
import {
  useCreatePersonal,
  useDeletePersonal,
  usePersonal,
  usePersonalById,
  useUpdatePersonal,
} from "../../../api/queryFunctions/personal";
import { useState } from "react";
import { SimpleModal } from "../../../components/common/SimpleModal";
import Button from "../../../components/common/Button";
import {
  useCiudadActiva,
  useTipoGenero,
  useTipoIdentificacion,
  useTipoPersonalActivo,
} from "../../../api/queryFunctions/configuracion";
import { useForm } from "../../../hooks/useForm";
import type { CreatePeriodoDto } from "../../../api/dtos";
import type {
  CreatePersonalDto,
  UpdatePersonalDto,
} from "../../../api/dtos/personal";
import { InputForm } from "../../../components/common/InputForm";
import { InputSelect } from "../../../components/common/InputSelect";
import { CheckboxForm } from "../../../components/common/CheckboxForm";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { usePeriodoById } from "../../../api/queryFunctions/tarifas";

export const Route = createFileRoute("/dashboard/personal/")({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);
  const [isOpenEditModal, setIsOpenEditModal] = useState(false);
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
  const [selectedIdPersonal, setSelectedIdPersonal] = useState<number>(0);

  // Queries y mutaciones
  const { data: personal } = usePersonal();
  const { data: tiposIdentificacion } = useTipoIdentificacion();
  const { data: ciudades } = useCiudadActiva();
  const { data: tiposGenero } = useTipoGenero();
  const { data: tiposPersonal } = useTipoPersonalActivo();

  const { mutate: createPersonal, isPending: isCreatingPersonal } =
    useCreatePersonal();
  const { mutate: getPersonalById } = usePersonalById();
  const { mutate: updatePersonal, isPending: isUpdatingPersonal } =
    useUpdatePersonal();
  const { mutate: deletePersonal, isPending: isDeletingPersonal } =
    useDeletePersonal();

  // Formularios
  const {
    form: formAddPersonal,
    handleChange: handleChangeAddPersonal,
    resetForm: resetFormAddPersonal,
  } = useForm<CreatePersonalDto>({
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    numeroIdentificacion: "",
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
    laborando: false,
  });

  const handleSubmitAddPersonal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createPersonal(formAddPersonal, {
      onSuccess: () => {
        setIsOpenAddModal(false);
        resetFormAddPersonal();
      },
    });
  };

  const handleSubmitEditPersonal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updatePersonal(
      {
        id: selectedIdPersonal!,
        data: formEditPersonal,
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
        <div className="flex items-center gap-2">
          <ButtonAction
            Icon={PencilIcon}
            label="Editar"
            onClick={() => {
              setSelectedIdPersonal(row.original.idPersonal);
              setIsOpenEditModal(true);
              getPersonalById(row.original.idPersonal, {
                onSuccess: (data) => {
                  setFormEditPersonal({
                    primerNombre: data.data?.primerNombre || "",
                    segundoNombre: data.data?.segundoNombre || "",
                    primerApellido: data.data?.primerApellido || "",
                    segundoApellido: data.data?.segundoApellido || "",
                    numeroIdentificacion: data.data?.numeroIdentificacion || "",
                    fechaInicioContrato: data.data?.fechaInicioContrato || "",
                    fechaFinContrato: data.data?.fechaFinContrato || "",
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
                  });
                },
              });
            }}
          />
          <ButtonAction
            Icon={TrashIcon}
            label="Eliminar"
            onClick={() => {
              setSelectedIdPersonal(row.original.idPersonal);
              setIsOpenDeleteModal(true);
            }}
            color="red"
          />
        </div>
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
          pageSize={10}
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
        <form
          className="grid grid-cols-1 gap-1 md:grid-cols-2 md:gap-4"
          onSubmit={handleSubmitAddPersonal}
        >
          <div className="col-span-2 md:col-span-1">
            <h5 className="text-lg font-semibold">Información personal</h5>
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
          </div>
          <div className="col-span-2 md:col-span-1">
            <h5 className="text-lg font-semibold">Información laboral</h5>
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
              required
              value={formAddPersonal.fechaFinContrato}
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
          </div>
          <div className="col-span-2 flex justify-end space-x-2">
            <Button
              onClick={() => {
                setIsOpenAddModal(false);
                resetFormAddPersonal();
              }}
              className="w-auto bg-gray-500 hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-auto"
              onClick={() => {}}
              disabled={isCreatingPersonal}
            >
              {isCreatingPersonal ? "Creando..." : "Crear"}
            </Button>
          </div>
        </form>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenEditModal}
        onClose={() => {
          setIsOpenEditModal(false);
          setSelectedIdPersonal(0);
          resetFormEditPersonal();
        }}
        title="Editar personal"
        size="2xl"
      >
        <form
          className="grid grid-cols-1 gap-1 md:grid-cols-2 md:gap-4"
          onSubmit={handleSubmitEditPersonal}
        >
          <div className="col-span-2 md:col-span-1">
            <h5 className="text-lg font-semibold">Información personal</h5>
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
          </div>
          <div className="col-span-2 md:col-span-1">
            <h5 className="text-lg font-semibold">Información laboral</h5>
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
          </div>
          <div className="col-span-2 flex justify-end space-x-2">
            <Button
              onClick={() => {
                setIsOpenEditModal(false);
                setSelectedIdPersonal(0);
                resetFormEditPersonal();
              }}
              className="w-auto bg-gray-500 hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-auto"
              disabled={isUpdatingPersonal}
            >
              {isUpdatingPersonal ? "Actualizando..." : "Actualizar"}
            </Button>
          </div>
        </form>
      </SimpleModal>

      <ConfirmarDelete
        isOpenDelete={isOpenDeleteModal}
        text="¿Estás seguro de querer eliminar este personal?"
        onDelete={() => {
          deletePersonal(selectedIdPersonal, {
            onSuccess: () => {
              setIsOpenDeleteModal(false);
              setSelectedIdPersonal(0);
            },
          });
        }}
        onClose={() => setIsOpenDeleteModal(false)}
      />
    </Section>
  );
}
