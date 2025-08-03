import { EditIcon, PlusIcon, TrashIcon } from "lucide-react";
import { ButtonAction } from "../../../common/ButtonAction";
import Table from "../../../common/Table";
import type { ColumnDef } from "@tanstack/react-table";
import type { Ciudad } from "../../../../types";
import { useState, useMemo } from "react";
import { SimpleModal } from "../../../common/SimpleModal";
import {
  useActualizarCiudad,
  useCiudad,
  useCrearCiudad,
  useDepartamento,
  useEliminarCiudad,
} from "../../../../api/queryFunctions/configuracion";
import type {
  CreateCiudadDto,
  UpdateCiudadDto,
} from "../../../../api/dtos/configuracion";
import { useForm } from "../../../../hooks/useForm";
import { InputForm } from "../../../common/InputForm";
import { InputSelect } from "../../../common/InputSelect";
import { InputSelectStateBoolean } from "../../../common/InputSelectState";
import { StateLabel } from "../../../common/StateLabel";
import { ConfirmarDelete } from "../../modals/ConfirmarDelete";
import { FormsModal } from "../../modals/FormsModal";

export const CiudadTab = () => {
  // Estados
  const [isModalOpenEliminar, setIsModalOpenEliminar] = useState(false);
  const [selectIdRow, setSelectIdRow] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenEditar, setIsModalOpenEditar] = useState(false);

  // Queries y mutaciones
  const { data: ciudades } = useCiudad();
  const { data: departamentos } = useDepartamento();
  const { mutate: crearCiudad, isPending: isLoadingCrearCiudad } =
    useCrearCiudad();
  const { mutate: actualizarCiudad, isPending: isLoadingActualizarCiudad } =
    useActualizarCiudad();
  const { mutate: eliminarCiudad } = useEliminarCiudad();

  // Formularios
  const { form, resetForm, handleChange } = useForm<CreateCiudadDto>({
    descripcion: "",
    departamento: 0,
    codigoCiudad: "",
  });
  const {
    form: formEditar,
    handleChange: handleChangeEditar,
    setForm: setFormEditar,
    resetForm: resetFormEditar,
  } = useForm<UpdateCiudadDto>({
    descripcion: "",
    departamento: 0,
    codigoCiudad: "",
    estado: false,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    crearCiudad({
      ...form,
      departamento: Number(form.departamento),
    });
    setIsModalOpen(false);
    resetForm();
  };

  const handleShowModalEditar = (row: Ciudad) => {
    setIsModalOpenEditar(true);
    setFormEditar({
      estado: row.estado,
      descripcion: row.descripcion,
      departamento: row.departamento.idDepartamento,
      codigoCiudad: row.codigoCiudad,
    });
    setSelectIdRow(row.idCiudad);
  };

  const handleSubmitEditar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    actualizarCiudad({
      id: selectIdRow as number,
      data: {
        estado: String(formEditar.estado) === "true",
        descripcion: formEditar.descripcion || "",
        departamento: formEditar.departamento || 0,
        codigoCiudad: formEditar.codigoCiudad || "",
      },
    });
    setIsModalOpenEditar(false);
    resetFormEditar();
  };
  const columnsCiudades: ColumnDef<Ciudad>[] = [
    {
      header: "ID",
      accessorKey: "idCiudad",
    },
    {
      header: "Ciudad",
      accessorKey: "descripcion",
    },
    {
      header: "Departamento",
      accessorKey: "departamento.descripcion",
    },
    {
      header: "Pais",
      accessorKey: "departamento.pais.descripcion",
    },
    {
      header: "Estado",
      accessorKey: "estado",
      cell: ({ row }) => {
        return <StateLabel state={row.original.estado} />;
      },
    },
    {
      header: "Acciones",
      cell: ({ row }) => {
        return (
          <div className="flex justify-center gap-2">
            <ButtonAction
              Icon={EditIcon}
              label="Editar"
              onClick={() => handleShowModalEditar(row.original)}
            />
            <ButtonAction
              Icon={TrashIcon}
              label="Eliminar"
              onClick={() => {
                setIsModalOpenEliminar(true);
                setSelectIdRow(row.original.idCiudad);
              }}
              color="red"
            />
          </div>
        );
      },
    },
  ];

  const departamentosOptions = useMemo(
    () =>
      departamentos?.data?.map((departamento) => ({
        id: departamento.idDepartamento,
        descripcion: departamento.descripcion,
      })) || [],
    [departamentos?.data],
  );
  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <ButtonAction
            Icon={PlusIcon}
            label="Agregar ciudad"
            onClick={() => setIsModalOpen(true)}
          />
        </div>
        <Table
          data={ciudades?.data || []}
          columns={columnsCiudades}
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
          enableFiltering={true}
        />
      </div>

      <SimpleModal
        isOpen={isModalOpen}
        title="Agregar ciudad"
        size="md"
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        children={
          <FormsModal
            onSubmit={handleSubmit}
            isLoading={isLoadingCrearCiudad}
            onCancel={() => {
              setIsModalOpen(false);
              resetForm();
            }}
            updating={false}
          >
            <div className="flex flex-col gap-2">
              <InputForm
                label="Descripción"
                placeholder="Descripción"
                id="descripcion"
                required
                value={form.descripcion || ""}
                onChange={handleChange}
                type="text"
              />
              <InputSelect
                label="Departamento"
                placeholder="Departamento"
                id="departamento"
                value={form.departamento || ""}
                onChange={handleChange}
                options={departamentosOptions || []}
                required
              />
              <InputForm
                label="Código de ciudad"
                placeholder="Código de ciudad"
                id="codigoCiudad"
                required
                value={form.codigoCiudad || ""}
                onChange={handleChange}
                type="text"
              />
            </div>
          </FormsModal>
        }
      />
      <SimpleModal
        isOpen={isModalOpenEditar}
        title="Editar ciudad"
        size="md"
        onClose={() => {
          setIsModalOpenEditar(false);
          resetFormEditar();
        }}
        children={
          <FormsModal
            onSubmit={handleSubmitEditar}
            isLoading={isLoadingActualizarCiudad}
            onCancel={() => {
              setIsModalOpenEditar(false);
              resetFormEditar();
            }}
            updating={true}
          >
            <div className="flex flex-col gap-2">
              <InputForm
                label="Descripción"
                placeholder="Descripción"
                id="descripcion"
                required
                value={formEditar.descripcion || ""}
                onChange={handleChangeEditar}
                type="text"
              />
              <InputSelect
                label="Departamento"
                placeholder="Departamento"
                id="departamento"
                value={formEditar.departamento || ""}
                onChange={handleChangeEditar}
                options={departamentosOptions || []}
              />
              <InputForm
                label="Código de ciudad"
                placeholder="Código de ciudad"
                id="codigoCiudad"
                required
                value={formEditar.codigoCiudad || ""}
                onChange={handleChangeEditar}
                type="text"
              />
              <InputSelectStateBoolean
                label="Estado"
                placeholder="Estado"
                id="estado"
                value={formEditar.estado?.toString() || ""}
                onChange={handleChangeEditar}
              />
            </div>
          </FormsModal>
        }
      />
      <ConfirmarDelete
        isOpenDelete={isModalOpenEliminar}
        text="¿Estás seguro de querer eliminar esta ciudad?"
        onClose={() => setIsModalOpenEliminar(false)}
        onDelete={() => {
          eliminarCiudad(
            { id: selectIdRow as number },
            {
              onSettled: () => {
                setIsModalOpenEliminar(false);
                setSelectIdRow(null);
              },
            },
          );
        }}
      />
    </>
  );
};
