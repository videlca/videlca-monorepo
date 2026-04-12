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

import type {
  CreateSegmentacionDto,
  UpdateSegmentacionDto,
  UpdateSubSegmentacionDto,
} from "../../../../api/dtos";
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
import { ConfirmarDelete } from "../../modals/ConfirmarDelete";
import { MoreActionsButton } from "../../common/MoreActionsButton";
import { useForm } from "react-hook-form";

export function SegmentacionTab() {
  // Estados
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [isOpenDeleteSubSegmentacion, setIsOpenDeleteSubSegmentacion] =
    useState(false);
  const [showSubSegmentations, setShowSubSegmentations] = useState(false);
  const [showAddSubSegmentationModal, setShowAddSubSegmentationModal] =
    useState(false);
  const [idSegmentacion, setIdSegmentacion] = useState(0);
  const [idSubSegmentacion, setIdSubSegmentacion] = useState(0);

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

  // Formularios con react-hook-form
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    watch: watchCreate,
    setValue: setValueCreate,
  } = useForm<CreateSegmentacionDto>({
    defaultValues: {
      descripcion: "",
      subSegmentaciones: [],
    },
  });

  const formCreateSubSegmentaciones = watchCreate("subSegmentaciones");

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
  } = useForm<UpdateSegmentacionDto>({
    defaultValues: {
      estado: false,
      descripcion: "",
    },
  });

  // Estado auxiliar para sub-segmentaciones (no es un formulario RHF)
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
    setValueCreate("subSegmentaciones", [
      ...formCreateSubSegmentaciones,
      { descripcion: subSegmentaciones.descripcion },
    ]);
    setSubSegmentaciones({ descripcion: "" });
  };

  const handleCreateSegmentacion = (data: CreateSegmentacionDto) => {
    crearSegmentacion(data, {
      onSuccess: () => {
        setIsAddModalOpen(false);
        resetCreate();
      },
    });
  };

  const handleAddSubSegmentacionToSegmentacion = (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
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

  const handleUpdateSegmentacion = (data: UpdateSegmentacionDto) => {
    actualizarSegmentacion(
      {
        id: segmentacionById?.data?.idSegmentacion || 0,
        data: {
          ...data,
          estado: String(data.estado) === "true",
        },
      },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
          resetEdit();
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
        resetEdit({
          estado: data?.data?.estado,
          descripcion: data?.data?.descripcion || "",
        });
      },
    });
  };

  const handleDeleteSegmentacion = (id: number) => {
    setIsOpenDelete(true);
    setIdSegmentacion(id);
  };

  const handleDeleteSubSegmentacion = (id: number) => {
    setIsOpenDeleteSubSegmentacion(true);
    setIdSubSegmentacion(id);
  };

  const handleShowEditSubSegmentacion = (subSegmentacion: SubSegmentacion) => {
    setSubSegmentaciones({
      idSubSegmentacion: subSegmentacion.idSubSegmentacion,
      descripcion: subSegmentacion.descripcion,
      estado: subSegmentacion.estado,
    });
    setShowSubSegmentations(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    resetEdit();
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
          resetEdit();
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
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium whitespace-nowrap text-gray-500">
            {row.original.subSegmentaciones?.length} Sub Segmentaciones
          </p>

          <div className="flex flex-wrap gap-2">
            {row.original.subSegmentaciones?.map((subSegmentacion) => (
              <span
                className="w-fit rounded-md bg-blue-100 px-2 py-1 text-center text-sm font-medium whitespace-nowrap text-blue-600 hover:bg-blue-200"
                key={subSegmentacion.idSubSegmentacion}
              >
                {subSegmentacion.descripcion}
              </span>
            ))}
          </div>
        </div>
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
        <MoreActionsButton
          menuId={`actions-${row.original.idSegmentacion}`}
          actions={[
            {
              label: "Agregar Sub-segmentación",
              onClick: () => {
                setShowAddSubSegmentationModal(true);
                setIdSegmentacion(row.original.idSegmentacion);
              },
            },
            {
              label: "Editar",
              onClick: () => {
                handleShowEditSegmentacionModal(row.original.idSegmentacion);
                setSubSegmentaciones({
                  idSubSegmentacion: 0,
                  descripcion: "",
                  estado: undefined,
                });
              },
            },
            {
              label: "Eliminar",
              onClick: () => {
                handleDeleteSegmentacion(row.original.idSegmentacion);
              },
              color: "red" as const,
            },
          ]}
        />
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
        pageSize={5}
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
            resetCreate();
          }}
          updating={false}
          onSubmit={handleSubmitCreate(handleCreateSegmentacion)}
        >
          <div className="space-y-6">
            <InputForm
              label="Descripción *"
              placeholder="Ej: Segmentación por Industria"
              type="text"
              id="descripcion"
              required={true}
              {...registerCreate("descripcion")}
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
                      id="sub-descripcion"
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
                  {formCreateSubSegmentaciones.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-900">
                        Sub-segmentaciones (
                        {formCreateSubSegmentaciones.length})
                      </h5>
                      <div className="max-h-48 space-y-2 overflow-y-auto">
                        {formCreateSubSegmentaciones.map((subSeg, index) => (
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
                                  setValueCreate(
                                    "subSegmentaciones",
                                    formCreateSubSegmentaciones.filter(
                                      (_, i) => i !== index,
                                    ),
                                  );
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
            resetEdit();
          }}
          updating={true}
          onSubmit={handleSubmitEdit(handleUpdateSegmentacion)}
        >
          <div className="space-y-6">
            <InputForm
              label="Descripción *"
              placeholder="Ej: Segmentación por Industria"
              type="text"
              id="descripcion"
              required={true}
              {...registerEdit("descripcion")}
            />

            <InputSelectStateBoolean
              label="Estado"
              id="estado"
              placeholder="Selecciona el estado"
              {...registerEdit("estado")}
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
                      id="sub-descripcion-edit"
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
                      id="sub-estado-edit"
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
          <InputForm
            label="Descripción *"
            placeholder="Ej: Sub-segmentación por Industria"
            type="text"
            id="sub-descripcion-add"
            required={false}
            value={subSegmentaciones?.descripcion}
            onChange={handleChangeSubSegmentacion}
          />
        </FormsModal>
      </SimpleModal>

      <ConfirmarDelete
        isOpenDelete={isOpenDelete}
        text="¿Estás seguro de querer eliminar esta segmentación?"
        onDelete={() => {
          eliminarSegmentacion(idSegmentacion, {
            onSuccess: () => {
              setIsOpenDelete(false);
              setIdSegmentacion(0);
            },
          });
        }}
        onClose={() => setIsOpenDelete(false)}
      />
      <ConfirmarDelete
        isOpenDelete={isOpenDeleteSubSegmentacion}
        text="¿Estás seguro de querer eliminar esta sub-segmentación?"
        onDelete={() => {
          eliminarSubSegmentacion(idSubSegmentacion, {
            onSuccess: () => {
              setIsOpenDeleteSubSegmentacion(false);
              setIsEditModalOpen(false);
              setIdSubSegmentacion(0);
              resetEdit();
            },
          });
        }}
        onClose={() => setIsOpenDeleteSubSegmentacion(false)}
      />
    </div>
  );
}
