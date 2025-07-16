import { ButtonAction } from "../../../common/ButtonAction";
import {
  ChevronDown,
  ChevronUp,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import Table from "../../../common/Table";
import { StateLabel } from "../../../common/StateLabel";
import type { Segmentacion } from "../../../../types";
import { SimpleModal } from "../../../common/SimpleModal";
import { useState } from "react";
import { InputForm } from "../../../common/InputForm";
import { useForm } from "../../../../hooks/useForm";
import type {
  CreateSegmentacionDto,
  UpdateSegmentacionDto,
} from "../../../../api/dtos";
import Button from "../../../common/Button";
import {
  useActualizarSegmentacion,
  useCrearSegmentacion,
  useSegmentaciones,
} from "../../../../api/queryFunctions/clientes";
import { InputSelectStateBoolean } from "../../../common/InputSelectState";

export function SegmentacionTab() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showSubSegmentations, setShowSubSegmentations] = useState(false);
  const [editingSegmentacion, setEditingSegmentacion] =
    useState<Segmentacion | null>(null);

  const { data: segmentaciones } = useSegmentaciones();
  const { mutate: crearSegmentacion } = useCrearSegmentacion();
  const { mutate: actualizarSegmentacion } = useActualizarSegmentacion();
  const {
    form: formCreate,
    handleChange: handleChangeCreate,
    resetForm: resetFormCreate,
    setForm: setFormCreate,
  } = useForm<CreateSegmentacionDto>({
    descripcion: "",
    subSegmentaciones: [],
  });
  const {
    form: formEdit,
    handleChange: handleChangeEdit,
    resetForm: resetFormEdit,
    setForm: setFormEdit,
  } = useForm<UpdateSegmentacionDto>({
    descripcion: "",
    estado: false,
  });
  const [subSegmentaciones, setSubSegmentaciones] = useState<{
    descripcion: string;
  }>({
    descripcion: "",
  });

  const handleChangeSubSegmentacion = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setSubSegmentaciones({ descripcion: e.target.value });
  };

  const handleAddSubSegmentacion = () => {
    setFormCreate({
      ...formCreate,
      subSegmentaciones: [
        ...formCreate.subSegmentaciones,
        { descripcion: subSegmentaciones.descripcion },
      ],
    });
    setSubSegmentaciones({ descripcion: "" });
  };

  const handleCreateSegmentacion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    crearSegmentacion(formCreate, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        resetFormCreate();
      },
    });
  };

  const handleUpdateSegmentacion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    actualizarSegmentacion(
      {
        id: editingSegmentacion?.idSegmentacion || 0,
        data: {
          ...formEdit,
          estado: String(formEdit.estado) === "true",
        },
      },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          resetFormEdit();
        },
      },
    );
  };

  const handleShowAddSegmentacionModal = () => {
    setIsAddModalOpen(true);
  };

  const handleShowEditSegmentacionModal = (row: Segmentacion) => {
    setFormEdit({
      descripcion: row.descripcion,
      estado: row.estado,
    });
    console.log(row);
    setEditingSegmentacion(row);
    setIsEditModalOpen(true);
  };

  const columnsSegmentacion: ColumnDef<Segmentacion>[] = [
    {
      accessorKey: "idSegmentacion",
      header: "ID",
    },
    {
      accessorKey: "descripcion",
      header: "Descripción",
      cell: ({ row }) => (
        <span className="text-md font-medium text-gray-700">
          {row.original.descripcion}
        </span>
      ),
    },
    {
      accessorKey: "subSegmentaciones",
      header: "Sub-Segmentaciones",
      cell: ({ row }) => (
        <>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-500">
              {row.original.subSegmentaciones?.length} Sub Segmentaciones
            </p>

            {row.original.subSegmentaciones?.map((subSegmentacion) => (
              <span
                className="w-fit rounded-md bg-blue-100 px-2 py-1 text-center text-sm font-medium text-blue-600 hover:bg-blue-200"
                key={subSegmentacion.idSubSegmentacion}
              >
                {subSegmentacion.descripcion}
              </span>
            ))}
          </div>
        </>
      ),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => <StateLabel state={row.original.estado} />,
    },
    {
      accessorKey: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <ButtonAction
            Icon={PencilIcon}
            label="Editar"
            onClick={() => handleShowEditSegmentacionModal(row.original)}
          />
          <ButtonAction
            Icon={TrashIcon}
            label="Eliminar"
            onClick={() => {}}
            color="red"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ButtonAction
          Icon={PlusIcon}
          label="Agregar segmentación"
          onClick={handleShowAddSegmentacionModal}
        />
      </div>
      <Table
        data={segmentaciones?.data || []}
        columns={columnsSegmentacion}
        enablePagination={true}
        pageSize={10}
        enableSorting={true}
      />

      {/* Modal para agregar segmentación */}
      <SimpleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Crear Nueva Segmentación"
        size="xl"
      >
        <form onSubmit={handleCreateSegmentacion} className="space-y-4">
          <div className="space-y-6">
            <InputForm
              label="Descripción *"
              placeholder="Ej: Segmentación por Industria"
              type="text"
              id="descripcion"
              required={true}
              value={formCreate.descripcion}
              onChange={handleChangeCreate}
            />

            <div className="border-t border-gray-200 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-900">
                  Sub-segmentaciones (Opcional)
                </h4>
                <button
                  type="button"
                  onClick={() => setShowSubSegmentations(!showSubSegmentations)}
                  className="flex cursor-pointer items-center space-x-2 text-blue-600 transition-colors hover:text-blue-700"
                >
                  {showSubSegmentations ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {showSubSegmentations ? "Ocultar" : "Agregar"}{" "}
                    Sub-segmentaciones
                  </span>
                </button>
              </div>

              {showSubSegmentations && (
                <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <h5 className="mb-3 text-sm font-medium text-gray-900">
                      Agregar Sub-segmentación
                    </h5>

                    <InputForm
                      label="Descripción *"
                      placeholder="Ej: Sub-segmentación por Industria"
                      type="text"
                      id="descripcion"
                      required={false}
                      value={subSegmentaciones?.descripcion}
                      onChange={handleChangeSubSegmentacion}
                    />

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex space-x-2">
                        {/* Cancelar al actualizar */}
                        {/* <button
                          type="button"
                          className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                        >
                          Cancelar
                        </button> */}

                        <button
                          type="button"
                          className="rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300"
                          onClick={handleAddSubSegmentacion}
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* List of Sub-segmentations */}
                  {formCreate.subSegmentaciones.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-900">
                        Sub-segmentaciones (
                        {formCreate.subSegmentaciones.length})
                      </h5>
                      <div className="max-h-48 space-y-2 overflow-y-auto">
                        {formCreate.subSegmentaciones.map((subSeg, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded border border-gray-200 bg-white p-3"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">
                                  {subSeg.descripcion}
                                </span>
                                {/* <span
                                  className={`rounded-full px-2 py-1 text-xs ${
                                    true
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {true ? "Activa" : "Inactiva"}
                                </span> */}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {/* <button
                                type="button"
                                onClick={() => {}}
                                className="text-blue-600 transition-colors hover:text-blue-700"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button> */}
                              <button
                                type="button"
                                onClick={() => {
                                  // setForm({
                                  //   ...form,
                                  //   subSegmentaciones:
                                  //     form.subSegmentaciones.
                                  // });
                                  setFormCreate({
                                    ...formCreate,
                                    subSegmentaciones:
                                      formCreate.subSegmentaciones.filter(
                                        (subSeg, i) => i !== index,
                                      ),
                                  });
                                  console.log(index);
                                }}
                                className="cursor-pointer text-red-600 transition-colors hover:text-red-700"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-6">
            <Button
              onClick={() => {
                setIsAddModalOpen(false);
                resetFormCreate();
              }}
              className="w-auto bg-gray-500 hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={false}>
              Crear Segmentación
            </Button>
          </div>
        </form>
      </SimpleModal>

      {/* Modal para editar segmentación */}
      <SimpleModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Segmentación"
        size="xl"
      >
        <form onSubmit={handleUpdateSegmentacion} className="space-y-4">
          <div className="space-y-6">
            <InputForm
              label="Descripción"
              placeholder="Ej: Segmentación por Industria"
              type="text"
              id="descripcion"
              required={false}
              value={formEdit.descripcion}
              onChange={handleChangeEdit}
            />
            <InputSelectStateBoolean
              label="Estado"
              id="estado"
              placeholder="Selecciona el estado"
              value={formEdit.estado.toString() || ""}
              onChange={handleChangeEdit}
            />

            <div className="border-t border-gray-200 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-md font-medium text-gray-900">
                  Sub-segmentaciones
                </h4>
                <button
                  type="button"
                  onClick={() => setShowSubSegmentations(!showSubSegmentations)}
                  className="flex cursor-pointer items-center space-x-2 text-blue-600 transition-colors hover:text-blue-700"
                >
                  {showSubSegmentations ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {showSubSegmentations ? "Ocultar" : "Editar"}{" "}
                    Sub-segmentaciones
                  </span>
                </button>
              </div>

              {showSubSegmentations && (
                <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <h5 className="mb-3 text-sm font-medium text-gray-900">
                      Editar Sub-segmentación
                    </h5>

                    <InputForm
                      label="Descripción *"
                      placeholder="Ej: Sub-segmentación por Industria"
                      type="text"
                      id="descripcion"
                      required={true}
                      value={formEdit.subSegmentaciones?.[0]?.descripcion || ""}
                      onChange={handleChangeSubSegmentacion}
                    />

                    {/* <div className="mt-4 flex items-center justify-between">
                      <div className="flex space-x-2">
                        
                        <button
                          type="button"
                          className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          onClick={() => setIsEditModalOpen(false)}
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          className="rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300"
                          onClick={() => handleUpdateSegmentacion(e)}
                        >
                          Actualizar
                        </button>
                      </div>
                    </div> */}
                  </div>

                  {/* List of Sub-segmentations */}
                  {editingSegmentacion?.subSegmentaciones?.length &&
                    editingSegmentacion?.subSegmentaciones?.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-900">
                          Sub-segmentaciones (
                          {editingSegmentacion?.subSegmentaciones?.length})
                        </h5>
                        <div className="max-h-48 space-y-2 overflow-y-auto">
                          {editingSegmentacion?.subSegmentaciones?.map(
                            (subSeg, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between rounded border border-gray-200 bg-white p-3"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900">
                                      {subSeg.descripcion}
                                    </span>
                                    <span
                                      className={`rounded-full px-2 py-1 text-xs ${
                                        subSeg.estado
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {subSeg.estado ? "Activa" : "Inactiva"}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => {}}
                                    className="text-blue-600 transition-colors hover:text-blue-700"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSegmentacion({
                                        ...editingSegmentacion,
                                        subSegmentaciones:
                                          editingSegmentacion?.subSegmentaciones?.filter(
                                            (subSeg, i) => i !== index,
                                          ),
                                      });
                                      console.log(index);
                                    }}
                                    className="cursor-pointer text-red-600 transition-colors hover:text-red-700"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-6">
            <Button
              onClick={() => {
                setIsAddModalOpen(false);
                resetFormEdit();
              }}
              className="w-auto bg-gray-500 hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={false}>
              Actualizar Segmentación
            </Button>
          </div>
        </form>
      </SimpleModal>
    </div>
  );
}
