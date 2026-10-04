import { useState } from "react";
import type { Pais } from "../../../../types";
import { ButtonAction } from "../../../common/ButtonAction";
import { SimpleModal } from "../../../common/SimpleModal";
import Table from "../../../common/Table";
import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";
import {
  // useActualizarPais,
  useCrearPais,
  usePais,
} from "../../../../api/queryFunctions/configuracion";
import { useForm } from "react-hook-form";
import type {
  CreatePaisDto,
  // UpdatePaisDto,
} from "../../../../api/dtos/configuracion";
import { InputForm } from "../../../common/InputForm";
import Button from "../../../common/Button";
import { FormsModal } from "../../modals/FormsModal";

export const PaisTab = () => {
  const { data: paises, isLoading } = usePais();
  const { mutate: crearPais } = useCrearPais();
  // const { mutate: actualizarPais } = useActualizarPais();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [isModalOpenEditar, setIsModalOpenEditar] = useState(false);
  // const [editingRow, setEditingRow] = useState<Pais | null>(null);
  const { register, handleSubmit, reset } = useForm<CreatePaisDto>({
    defaultValues: { descripcion: "" },
  });
  // const {
  //   form: formEditar,
  //   handleChange: handleChangeEditar,
  //   setForm: setFormEditar,
  //   resetForm: resetFormEditar,
  // } = useForm<UpdatePaisDto>({
  //   descripcion: "",
  // });

  const onSubmitCreate = (data: CreatePaisDto) => {
    crearPais({ ...data });
    setIsModalOpen(false);
    reset();
  };

  // const handleShowModalEditar = (row: Pais) => {
  //   setIsModalOpenEditar(true);
  //   setFormEditar({
  //     descripcion: row.descripcion,
  //   });
  //   setEditingRow(row);
  // };

  // const handleSubmitEditar = (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   actualizarPais({
  //     id: editingRow?.idPais as number,
  //     data: {
  //       descripcion: formEditar.descripcion || "",
  //     },
  //   });
  //   setIsModalOpenEditar(false);
  //   resetFormEditar();
  // };

  const columnsPaises: ColumnDef<Pais>[] = [
    {
      header: "ID",
      accessorKey: "idPais",
    },
    {
      header: "Pais",
      accessorKey: "descripcion",
    },
  ];
  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <ButtonAction
            Icon={PlusIcon}
            label="Agregar pais"
            onClick={() => setIsModalOpen(true)}
          />
        </div>
        <Table
          data={paises?.data?.data || []}
          columns={columnsPaises}
          enablePagination={true}
          pageSize={5}
          enableSorting={true}
        />
      </div>
      {/* Modal para agregar país */}
      <SimpleModal
        isOpen={isModalOpen}
        title="Agregar país"
        size="md"
        onClose={() => {
          setIsModalOpen(false);
          reset();
        }}
        children={
          <FormsModal
            onSubmit={handleSubmit(onSubmitCreate)}
            isLoading={isLoading}
            onCancel={() => {
              setIsModalOpen(false);
              reset();
            }}
            updating={false}
          >
            <InputForm
              label="Descripción"
              placeholder="Descripción"
              id="descripcion"
              required
              type="text"
              {...register("descripcion")}
            />
          </FormsModal>
        }
      />
      {/* <SimpleModal
        isOpen={isModalOpenEditar}
        title="Editar país"
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
      /> */}
    </>
  );
};
