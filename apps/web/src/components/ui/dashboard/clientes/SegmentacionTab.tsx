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
import type { Segmentacion, SubSegmentacion } from "../../../../types";
import { SimpleModal } from "../../../common/SimpleModal";
import { useState } from "react";
import { InputForm } from "../../../common/InputForm";
import { useForm } from "../../../../hooks/useForm";
import type {
  CreateSegmentacionDto,
  UpdateSegmentacionDto,
  UpdateSubSegmentacionDto,
} from "../../../../api/dtos";
import Button from "../../../common/Button";
import {
  useActualizarSegmentacion,
  useActualizarSubSegmentacion,
  useCrearSegmentacion,
  useCrearSubSegmentacion,
  useEliminarSegmentacion,
  useEliminarSubSegmentacion,
  useSegmentacionById,
  useSegmentaciones,
} from "../../../../api/queryFunctions/clientes";
import { InputSelectStateBoolean } from "../../../common/InputSelectState";
import { toast } from "sonner";
import { FormsModal } from "../../modals/FormsModal";

export function SegmentacionTab() {
  // Estados
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showSubSegmentations, setShowSubSegmentations] = useState(false);
  const [showAddSubSegmentationModal, setShowAddSubSegmentationModal] =
    useState(false);
  const [idSegmentacion, setIdSegmentacion] = useState(0);

  // Segmentaciones
  const { data: segmentaciones } = useSegmentaciones();
  const { mutate: crearSegmentacion, isPending: isCreatingSegmentacion } =
    useCrearSegmentacion();
  const { mutate: actualizarSegmentacion, isPending: isUpdatingSegmentacion } =
    useActualizarSegmentacion();
  const { mutate: eliminarSegmentacion } = useEliminarSegmentacion();
  const {
    mutate: obtenerSegmentacionById,
    data: segmentacionById,
    isPending: isLoadingSegmentacionById,
  } = useSegmentacionById();
  // Subsegmentaciones
  const { mutate: eliminarSubSegmentacion } = useEliminarSubSegmentacion();
  const {
    mutate: actualizarSubSegmentacion,
    isPending: isUpdatingSubSegmentacion,
  } = useActualizarSubSegmentacion();
  const { mutate: crearSubSegmentacion, isPending: isCreatingSubSegmentacion } =
    useCrearSubSegmentacion();

  // Formularios
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
    estado: false,
    descripcion: "",
  });
  const [subSegmentaciones, setSubSegmentaciones] = useState<SubSegmentacion>({
    descripcion: "",
    estado: false,
    idSubSegmentacion: 0,
  });

  const handleChangeSubSegmentacion = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
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

  const handleAddSubSegmentacionToSegmentacion = (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    console.log(idSegmentacion);
    console.log(subSegmentaciones);
    crearSubSegmentacion(
      { id: idSegmentacion, data: subSegmentaciones },
      {
        onSuccess: () => {
          setShowAddSubSegmentationModal(false);
          setSubSegmentaciones({
            idSubSegmentacion: 0,
            descripcion: "",
            estado: undefined,
          });
        },
      },
    );
  };

  const handleUpdateSegmentacion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    actualizarSegmentacion(
      {
        id: segmentacionById?.data?.idSegmentacion || 0,
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

  const handleShowEditSegmentacionModal = (id: number) => {
    setIsEditModalOpen(true);
    obtenerSegmentacionById(id, {
      onSettled: (data) => {
        setFormEdit({
          estado: data?.data?.estado,
          descripcion: data?.data?.descripcion || "",
        });
      },
    });
  };

  const handleDeleteSegmentacion = (id: number) => {
    eliminarSegmentacion(id, {
      onSuccess: () => {
        setIsEditModalOpen(false);
        resetFormEdit();
      },
    });
  };

  const handleDeleteSubSegmentacion = (id: number) => {
    eliminarSubSegmentacion(id, {
      onSuccess: () => {
        resetFormEdit();
      },
    });
  };

  const handleShowEditSubSegmentacion = (subSegmentacion: SubSegmentacion) => {
    console.log(subSegmentacion);
    setSubSegmentaciones({
      idSubSegmentacion: subSegmentacion.idSubSegmentacion,
      descripcion: subSegmentacion.descripcion,
      estado: subSegmentacion.estado,
    });
    setShowSubSegmentations(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    resetFormEdit();
    setShowSubSegmentations(false);
    setSubSegmentaciones({
      idSubSegmentacion: 0,
      descripcion: "",
      estado: false,
    });
  };

  const handleUpdateSubSegmentacion = (
    id: number,
    data: UpdateSubSegmentacionDto,
  ) => {
    if (data.descripcion === "") {
      toast.error(
        "Debe ingresar una descripción para actualizar la sub-segmentación",
      );
      return;
    }
    if (id === 0) {
      toast.error("Debe seleccionar una sub-segmentación para actualizar");
      return;
    }
    actualizarSubSegmentacion(
      { id, data },
      {
        onSuccess: () => {
          resetFormEdit();
          setIsEditModalOpen(false);
          setShowSubSegmentations(false);
        },
      },
    );
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
            Icon={PlusIcon}
            label="Agregar Sub-segmentación"
            onClick={() => {
              setShowAddSubSegmentationModal(true);
              setIdSegmentacion(row.original.idSegmentacion);
            }}
          />
          <ButtonAction
            Icon={PencilIcon}
            label="Editar"
            onClick={() => {
              handleShowEditSegmentacionModal(row.original.idSegmentacion);
              setSubSegmentaciones({
                idSubSegmentacion: 0,
                descripcion: "",
                estado: undefined,
              });
            }}
          />
          <ButtonAction
            Icon={TrashIcon}
            label="Eliminar"
            onClick={() =>
              handleDeleteSegmentacion(row.original.idSegmentacion)
            }
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
        <FormsModal
          isLoading={isCreatingSegmentacion}
          onCancel={() => {
            setIsAddModalOpen(false);
            resetFormCreate();
          }}
          updating={false}
          onSubmit={handleCreateSegmentacion}
        >
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
                                  setFormCreate({
                                    ...formCreate,
                                    subSegmentaciones:
                                      formCreate.subSegmentaciones.filter(
                                        (subSeg, i) => i !== index,
                                      ),
                                  });
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
        </FormsModal>
      </SimpleModal>

      {/* Modal para editar segmentación */}
      <SimpleModal
        isOpen={isEditModalOpen && !isLoadingSegmentacionById}
        onClose={() => handleCloseEditModal()}
        title="Editar Segmentación"
        size="xl"
      >
        <FormsModal
          isLoading={isUpdatingSegmentacion || isUpdatingSubSegmentacion}
          onCancel={() => {
            setIsEditModalOpen(false);
            resetFormEdit();
          }}
          updating={true}
          onSubmit={handleUpdateSegmentacion}
        >
          <div className="space-y-6">
            <InputForm
              label="Descripción *"
              placeholder="Ej: Segmentación por Industria"
              type="text"
              id="descripcion"
              required={true}
              value={formEdit.descripcion || ""}
              onChange={handleChangeEdit}
            />

            <InputSelectStateBoolean
              label="Estado"
              id="estado"
              placeholder="Selecciona el estado"
              value={formEdit.estado?.toString() || ""}
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
                      Editar Sub-segmentación (Opcional)
                    </h5>

                    <InputForm
                      label="Descripción *"
                      placeholder="Ej: Sub-segmentación por Industria"
                      type="text"
                      id="descripcion"
                      required={false}
                      value={subSegmentaciones?.descripcion || ""}
                      onChange={(e) => {
                        setSubSegmentaciones({
                          ...subSegmentaciones,
                          descripcion: e.target.value,
                        });
                      }}
                    />

                    <InputSelectStateBoolean
                      label="Estado"
                      id="estado"
                      placeholder="Selecciona el estado"
                      value={subSegmentaciones?.estado?.toString() || ""}
                      onChange={(e) =>
                        setSubSegmentaciones({
                          ...subSegmentaciones,
                          estado: e.target.value === "true",
                        })
                      }
                    />

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                          onClick={() => setShowSubSegmentations(false)}
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          className="rounded bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700 disabled:bg-blue-300"
                          onClick={() => {
                            console.log(subSegmentaciones);
                            handleUpdateSubSegmentacion(
                              subSegmentaciones?.idSubSegmentacion || 0,
                              {
                                descripcion:
                                  subSegmentaciones?.descripcion || "",
                                estado: subSegmentaciones?.estado,
                              },
                            );
                          }}
                        >
                          Actualizar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* List of Sub-segmentations */}
                  {segmentacionById?.data?.subSegmentaciones?.length &&
                    segmentacionById?.data?.subSegmentaciones?.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-900">
                          Sub-segmentaciones (
                          {segmentacionById?.data?.subSegmentaciones?.length})
                        </h5>
                        <div className="max-h-48 space-y-2 overflow-y-auto">
                          {segmentacionById?.data?.subSegmentaciones?.map(
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
                                    onClick={() =>
                                      handleShowEditSubSegmentacion(subSeg)
                                    }
                                    className="text-blue-600 transition-colors hover:text-blue-700"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteSubSegmentacion(
                                        subSeg.idSubSegmentacion || 0,
                                      )
                                    }
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
        </FormsModal>
      </SimpleModal>

      {/* Modal para agregar sub-segmentación */}
      <SimpleModal
        isOpen={showAddSubSegmentationModal}
        onClose={() => setShowAddSubSegmentationModal(false)}
        title="Agregar Sub-segmentación"
        size="xl"
      >
        <FormsModal
          isLoading={isCreatingSubSegmentacion}
          onCancel={() => {
            setShowAddSubSegmentationModal(false);
            setSubSegmentaciones({
              idSubSegmentacion: 0,
              descripcion: "",
              estado: undefined,
            });
          }}
          updating={false}
          onSubmit={handleAddSubSegmentacionToSegmentacion}
        >
          <div className="space-y-6">
            <InputForm
              label="Descripción *"
              placeholder="Ej: Sub-segmentación por Industria"
              type="text"
              id="descripcion"
              required={false}
              value={subSegmentaciones?.descripcion}
              onChange={handleChangeSubSegmentacion}
            />
            <div className="mt-6 flex justify-end space-x-3 pt-6">
              <Button
                onClick={() => {
                  setShowAddSubSegmentationModal(false);
                  setSubSegmentaciones({
                    idSubSegmentacion: 0,
                    descripcion: "",
                    estado: undefined,
                  });
                }}
                className="w-auto bg-gray-500 hover:bg-gray-600"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={false}>
                Agregar Sub-segmentación
              </Button>
            </div>
          </div>
        </FormsModal>
      </SimpleModal>
    </div>
  );
}
