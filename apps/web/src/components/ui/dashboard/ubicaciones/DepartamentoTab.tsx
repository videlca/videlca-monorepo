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
import { useForm } from "react-hook-form";
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
  const { register: registerCrear, handleSubmit: handleSubmitCrear, reset: resetCrear } = useForm<CreateDepartamentoDto>({
    defaultValues: { descripcion: "", pais: 0, codigoDepartamento: "" },
  });
  const { register: registerEditar, handleSubmit: handleSubmitEditar, reset: resetEditar } = useForm<UpdateDepartamentoDto>({
    defaultValues: { descripcion: "", pais: 0, codigoDepartamento: "" },
  });

  const onSubmitCrear = (data: CreateDepartamentoDto) => {
    crearDepartamento({
      ...data,
      pais: Number(data.pais),
    });
    setIsModalOpen(false);
    resetCrear();
  };

  const handleShowModalEditar = (row: Departamento) => {
    setIsModalOpenEditar(true);
    resetEditar({
      descripcion: row.descripcion,
      pais: row.pais.idPais,
      codigoDepartamento: row.codigoDepartamento,
    });
    setSelectIdRow(row.idDepartamento);
  };

  const onSubmitEditar = (data: UpdateDepartamentoDto) => {
    actualizarDepartamento({
      id: selectIdRow as number,
      data: {
        descripcion: data.descripcion || "",
        pais: data.pais || 0,
        codigoDepartamento: data.codigoDepartamento || "",
      },
    });
    setIsModalOpenEditar(false);
    resetEditar();
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
      paises?.data?.data.map((pais) => ({
        id: pais.idPais,
        descripcion: pais.descripcion,
      })) || [],
    [paises?.data?.data],
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
          data={departamentos?.data?.data || []}
          columns={columnsDepartamentos}
          enablePagination={true}
          pageSize={5}
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
          resetCrear();
        }}
        children={
          <FormsModal
            onSubmit={handleSubmitCrear(onSubmitCrear)}
            isLoading={isLoadingCrearDepartamento}
            onCancel={() => {
              setIsModalOpen(false);
              resetCrear();
            }}
            updating={false}
          >
            <div className="flex flex-col gap-2">
              <InputForm
                label="Descripción"
                placeholder="Descripción"
                id="descripcion"
                required
                type="text"
                {...registerCrear("descripcion")}
              />
              <InputSelect
                label="Pais"
                placeholder="Pais"
                id="pais"
                options={paisOptions}
                required
                {...registerCrear("pais", { valueAsNumber: true })}
              />
              <InputForm
                label="Código de departamento"
                placeholder="Código de departamento"
                id="codigoDepartamento"
                required
                maxLength={2}
                type="text"
                {...registerCrear("codigoDepartamento")}
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
          resetEditar();
        }}
        children={
          <FormsModal
            onSubmit={handleSubmitEditar(onSubmitEditar)}
            isLoading={isLoadingActualizarDepartamento}
            onCancel={() => {
              setIsModalOpenEditar(false);
              resetEditar();
            }}
            updating={true}
          >
            <div className="flex flex-col gap-2">
              <InputForm
                label="Descripción"
                placeholder="Descripción"
                id="descripcion"
                required
                type="text"
                {...registerEditar("descripcion")}
              />
              <InputSelect
                label="Pais"
                placeholder="Pais"
                id="pais"
                options={paisOptions}
                {...registerEditar("pais", { valueAsNumber: true })}
              />
              <InputForm
                label="Código de departamento"
                placeholder="Código de departamento"
                id="codigoDepartamento"
                required
                type="text"
                {...registerEditar("codigoDepartamento")}
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
