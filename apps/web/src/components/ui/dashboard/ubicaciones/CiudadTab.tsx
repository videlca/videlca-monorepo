import { EditIcon, PlusIcon } from "lucide-react";
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
} from "../../../../api/queryFunctions/configuracion";
import type {
  CreateCiudadDto,
  UpdateCiudadDto,
} from "../../../../api/dtos/configuracion";
import { useForm } from "../../../../hooks/useForm";
import { InputForm } from "../../../common/InputForm";
import Button from "../../../common/Button";
import { InputSelect } from "../../../common/InputSelect";
import { InputSelectStateBoolean } from "../../../common/InputSelectState";

export const CiudadTab = () => {
  const { data: ciudades, isLoading } = useCiudad();
  const { data: departamentos } = useDepartamento();
  const { mutate: crearCiudad } = useCrearCiudad();
  const { mutate: actualizarCiudad } = useActualizarCiudad();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenEditar, setIsModalOpenEditar] = useState(false);
  const [editingRow, setEditingRow] = useState<Ciudad | null>(null);
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
    setEditingRow(row);
  };

  const handleSubmitEditar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    actualizarCiudad({
      id: editingRow?.idCiudad as number,
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
        return (
          <span
            className={`rounded-full px-2 py-1 text-xs ${
              row.original.estado
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {row.original.estado ? "Activo" : "Inactivo"}
          </span>
        );
      },
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
        title="Editar ciudad"
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
