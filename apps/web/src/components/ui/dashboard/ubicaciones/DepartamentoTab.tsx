import { useMemo, useState } from "react";
import type { Departamento } from "../../../../types";
import type { ColumnDef } from "@tanstack/react-table";
import Table from "../../../common/Table";
import { ButtonAction } from "../../../common/ButtonAction";
import { EditIcon, PlusIcon, TrashIcon } from "lucide-react";
import { SimpleModal } from "../../../common/SimpleModal";
import {
  useActualizarDepartamento,
  useCrearDepartamento,
  useDepartamento,
  useEliminarDepartamento,
  usePais,
} from "../../../../api/queryFunctions/configuracion/ubicaciones";
import { useForm } from "../../../../hooks/useForm";
import type {
  CreateDepartamentoDto,
  UpdateDepartamentoDto,
} from "../../../../api/dtos/configuracion";
import { InputForm } from "../../../common/InputForm";
import { InputSelect } from "../../../common/InputSelect";
import { ConfirmarDelete } from "../../modals/ConfirmarDelete";
import { FormsModal } from "../../modals/FormsModal";
import { MoreActionsButton } from "../../common/MoreActionsButton";

export const DepartamentoTab = () => {
  // Estados
  const [isModalOpenEliminar, setIsModalOpenEliminar] = useState(false);
  const [selectIdRow, setSelectIdRow] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenEditar, setIsModalOpenEditar] = useState(false);

  // Queries y mutaciones

  const { data: departamentos } = useDepartamento();
  const { data: paises } = usePais();
  const { mutate: crearDepartamento, isPending: isLoadingCrearDepartamento } =
    useCrearDepartamento();
  const {
    mutate: actualizarDepartamento,
    isPending: isLoadingActualizarDepartamento,
  } = useActualizarDepartamento();
  const { mutate: eliminarDepartamento } = useEliminarDepartamento();
  // Formularios
  const { form, resetForm, handleChange } = useForm<CreateDepartamentoDto>({
    descripcion: "",
    pais: 0,
    codigoDepartamento: "",
  });
  const {
    form: formEditar,
    handleChange: handleChangeEditar,
    setForm: setFormEditar,
    resetForm: resetFormEditar,
  } = useForm<UpdateDepartamentoDto>({
    descripcion: "",
    pais: 0,
    codigoDepartamento: "",
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    crearDepartamento({
      ...form,
      pais: Number(form.pais),
    });
    setIsModalOpen(false);
    resetForm();
  };

  const handleShowModalEditar = (row: Departamento) => {
    setIsModalOpenEditar(true);
    setFormEditar({
      descripcion: row.descripcion,
      pais: row.pais.idPais,
      codigoDepartamento: row.codigoDepartamento,
    });
    setSelectIdRow(row.idDepartamento);
  };

  const handleSubmitEditar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    actualizarDepartamento({
      id: selectIdRow as number,
      data: {
        descripcion: formEditar.descripcion || "",
        pais: formEditar.pais || 0,
        codigoDepartamento: formEditar.codigoDepartamento || "",
      },
    });
    setIsModalOpenEditar(false);
    resetFormEditar();
  };

  const columnsDepartamentos: ColumnDef<Departamento>[] = [
    {
      header: "ID",
      accessorKey: "idDepartamento",
    },
    {
      header: "Departamento",
      accessorKey: "descripcion",
    },
    {
      header: "Codigo departamento",
      accessorKey: "codigoDepartamento",
    },
    {
      header: "Pais",
      accessorKey: "pais.descripcion",
    },
    {
      header: "Acciones",
      cell: ({ row }) => (
        <MoreActionsButton
          menuId={`actions-${row.original.idDepartamento}`}
          actions={[
            {
              label: "Editar",
              onClick: () => handleShowModalEditar(row.original),
            },
            {
              label: "Eliminar",
              onClick: () => {
                setIsModalOpenEliminar(true);
                setSelectIdRow(row.original.idDepartamento);
              },
              color: "red" as const,
            },
          ]}
        />
      ),
    },
  ];

  const paisOptions = useMemo(
    () =>
      paises?.data?.map((pais) => ({
        id: pais.idPais,
        descripcion: pais.descripcion,
      })) || [],
    [paises?.data],
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <ButtonAction
            Icon={PlusIcon}
            label="Agregar departamento"
            onClick={() => setIsModalOpen(true)}
          />
        </div>
        <Table
          data={departamentos?.data || []}
          columns={columnsDepartamentos}
          enablePagination={true}
          pageSize={10}
          enableSorting={true}
        />
      </div>
      {/* Modal para agregar departamento */}
      <SimpleModal
        isOpen={isModalOpen}
        title="Agregar departamento"
        size="md"
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        children={
          <FormsModal
            onSubmit={handleSubmit}
            isLoading={isLoadingCrearDepartamento}
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
                label="Pais"
                placeholder="Pais"
                id="pais"
                value={form.pais || ""}
                onChange={handleChange}
                options={paisOptions}
                required
              />
              <InputForm
                label="Código de departamento"
                placeholder="Código de departamento"
                id="codigoDepartamento"
                required
                value={form.codigoDepartamento || ""}
                onChange={handleChange}
                type="text"
              />
            </div>
          </FormsModal>
        }
      />
      <SimpleModal
        isOpen={isModalOpenEditar}
        title="Editar departamento"
        size="md"
        onClose={() => {
          setIsModalOpenEditar(false);
          resetFormEditar();
        }}
        children={
          <FormsModal
            onSubmit={handleSubmitEditar}
            isLoading={isLoadingActualizarDepartamento}
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
                label="Pais"
                placeholder="Pais"
                id="pais"
                value={formEditar.pais || ""}
                onChange={handleChangeEditar}
                options={paisOptions}
              />
              <InputForm
                label="Código de departamento"
                placeholder="Código de departamento"
                id="codigoDepartamento"
                required
                value={formEditar.codigoDepartamento || ""}
                onChange={handleChangeEditar}
                type="text"
              />
            </div>
          </FormsModal>
        }
      />
      <ConfirmarDelete
        isOpenDelete={isModalOpenEliminar}
        text="¿Estás seguro de querer eliminar este departamento?"
        onDelete={() => {
          eliminarDepartamento(
            { id: selectIdRow as number },
            {
              onSettled: () => {
                setIsModalOpenEliminar(false);
                setSelectIdRow(null);
              },
            },
          );
        }}
        onClose={() => setIsModalOpenEliminar(false)}
      />
    </>
  );
};
