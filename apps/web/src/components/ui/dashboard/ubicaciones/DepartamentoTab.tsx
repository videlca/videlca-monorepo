import { useMemo, useState } from "react";
import type { Departamento } from "../../../../types";
import type { ColumnDef } from "@tanstack/react-table";
import Table from "../../../common/Table";
import { ButtonAction } from "../../../common/ButtonAction";
import { EditIcon, PlusIcon } from "lucide-react";
import { SimpleModal } from "../../../common/SimpleModal";
import {
  useActualizarDepartamento,
  useCrearDepartamento,
  useDepartamento,
  usePais,
} from "../../../../api/queryFunctions/configuracion/ubicaciones";
import { useForm } from "../../../../hooks/useForm";
import type {
  CreateDepartamentoDto,
  UpdateDepartamentoDto,
} from "../../../../api/dtos/configuracion";
import { InputForm } from "../../../common/InputForm";
import { InputSelect } from "../../../common/InputSelect";
import Button from "../../../common/Button";

export const DepartamentoTab = () => {
  const { data: departamentos, isLoading } = useDepartamento();
  const { data: paises } = usePais();
  const { mutate: crearDepartamento } = useCrearDepartamento();
  const { mutate: actualizarDepartamento } = useActualizarDepartamento();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenEditar, setIsModalOpenEditar] = useState(false);
  const [editingRow, setEditingRow] = useState<Departamento | null>(null);
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
    setEditingRow(row);
  };

  const handleSubmitEditar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    actualizarDepartamento({
      id: editingRow?.idDepartamento as number,
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
      cell: ({ row }) => {
        return (
          <ButtonAction
            Icon={EditIcon}
            label="Editar"
            onClick={() => handleShowModalEditar(row.original)}
          />
        );
      },
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="w-auto bg-gray-500 hover:bg-gray-600"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="w-auto">
                {isLoading ? "Creando..." : "Agregar"}
              </Button>
            </div>
          </form>
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
          <form onSubmit={handleSubmitEditar} className="flex flex-col gap-4">
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
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setIsModalOpenEditar(false);
                  resetFormEditar();
                }}
                className="w-auto bg-gray-500 hover:bg-gray-600"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="w-auto">
                {isLoading ? "Actualizando..." : "Actualizar"}
              </Button>
            </div>
          </form>
        }
      />
    </>
  );
};
