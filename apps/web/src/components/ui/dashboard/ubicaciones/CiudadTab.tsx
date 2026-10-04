import AddIcon from "@mui/icons-material/Add";
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
import { useForm } from "react-hook-form";
import { InputForm } from "../../../common/InputForm";
import { InputSelect } from "../../../common/InputSelect";
import { InputSelectStateBoolean } from "../../../common/InputSelectState";
import { StateLabel } from "../../../common/StateLabel";
import { ConfirmarDelete } from "../../modals/ConfirmarDelete";
import { FormsModal } from "../../modals/FormsModal";
import { MoreActionsButton } from "../../common/MoreActionsButton";

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
  const { register: registerCrear, control: controlCrear, handleSubmit: handleSubmitCrear, reset: resetCrear } = useForm<CreateCiudadDto>({
    defaultValues: { descripcion: "", departamento: 0, codigoCiudad: "" },
  });
  const {
    register: registerEditar,
    control: controlEditar,
    handleSubmit: handleSubmitEditar,
    reset: resetEditar,
  } = useForm<UpdateCiudadDto>({
    defaultValues: { descripcion: "", departamento: 0, codigoCiudad: "", estado: false },
  });

  const onSubmitCrear = (data: CreateCiudadDto) => {
    crearCiudad({
      ...data,
      departamento: Number(data.departamento),
    });
    setIsModalOpen(false);
    resetCrear();
  };

  const handleShowModalEditar = (row: Ciudad) => {
    setIsModalOpenEditar(true);
    resetEditar({
      estado: row.estado,
      descripcion: row.descripcion,
      departamento: row.departamento.idDepartamento,
      codigoCiudad: row.codigoCiudad,
    });
    setSelectIdRow(row.idCiudad);
  };

  const onSubmitEditar = (data: UpdateCiudadDto) => {
    actualizarCiudad({
      id: selectIdRow as number,
      data: {
        estado: String(data.estado) === "true",
        descripcion: data.descripcion || "",
        departamento: data.departamento || 0,
        codigoCiudad: data.codigoCiudad || "",
      },
    });
    setIsModalOpenEditar(false);
    resetEditar();
  };
  const columnsCiudades: ColumnDef<Ciudad>[] = [
    {
      header: "Código ciudad",
      accessorKey: "codigoCiudad",
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
      cell: ({ row }) => (
        <MoreActionsButton
          menuId={`actions-${row.original.idCiudad}`}
          actions={[
            {
              label: "Editar",
              onClick: () => handleShowModalEditar(row.original),
            },
            {
              label: "Eliminar",
              onClick: () => {
                setIsModalOpenEliminar(true);
                setSelectIdRow(row.original.idCiudad);
              },
              color: "red" as const,
            },
          ]}
        />
      ),
    },
  ];

  const departamentosOptions = useMemo(
    () =>
      departamentos?.data?.data.map((departamento) => ({
        id: departamento.idDepartamento,
        descripcion: departamento.descripcion,
      })) || [],
    [departamentos?.data?.data],
  );
  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex justify-end">
          <ButtonAction
            Icon={AddIcon}
            label="Agregar ciudad"
            onClick={() => setIsModalOpen(true)}
          />
        </div>
        <Table
          data={ciudades?.data?.data || []}
          columns={columnsCiudades}
          enablePagination={true}
          pageSize={5}
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
          resetCrear();
        }}
        children={
          <FormsModal
            onSubmit={handleSubmitCrear(onSubmitCrear)}
            isLoading={isLoadingCrearCiudad}
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
                label="Departamento"
                placeholder="Departamento"
                id="departamento"
                options={departamentosOptions || []}
                required
                control={controlCrear}
                name="departamento"
                valueAsNumber
              />
              <InputForm
                label="Código de ciudad"
                placeholder="Código de ciudad"
                id="codigoCiudad"
                required
                type="text"
                {...registerCrear("codigoCiudad")}
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
          resetEditar();
        }}
        children={
          <FormsModal
            onSubmit={handleSubmitEditar(onSubmitEditar)}
            isLoading={isLoadingActualizarCiudad}
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
                label="Departamento"
                placeholder="Departamento"
                id="departamento"
                options={departamentosOptions || []}
                control={controlEditar}
                name="departamento"
                valueAsNumber
              />
              <InputForm
                label="Código de ciudad"
                placeholder="Código de ciudad"
                id="codigoCiudad"
                required
                type="text"
                {...registerEditar("codigoCiudad")}
              />
              <InputSelectStateBoolean
                label="Estado"
                placeholder="Estado"
                id="estado"
                {...registerEditar("estado")}
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
