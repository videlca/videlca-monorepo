import AddIcon from "@mui/icons-material/Add";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ButtonAction } from "../../../common/ButtonAction";
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
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {row.original.descripcion}
        </Typography>
      ),
    },
    {
      accessorKey: "subSegmentaciones",
      header: "Sub-Segmentaciones",
      cell: ({ row }) => (
        <div className="flex flex-col gap-2">
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
            {row.original.subSegmentaciones?.length} Sub Segmentaciones
          </Typography>

          <div className="flex flex-wrap justify-center gap-1">
            {row.original.subSegmentaciones?.map((subSegmentacion) => (
              <Chip
                key={subSegmentacion.idSubSegmentacion}
                size="small"
                color="primary"
                variant="outlined"
                label={subSegmentacion.descripcion}
              />
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
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <ButtonAction
          Icon={AddIcon}
          label="Agregar segmentación"
          onClick={handleShowAddSegmentacionModal}
        />
      </div>
      <Table
        data={segmentaciones?.data?.data || []}
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
          <div className="flex flex-col gap-6">
            <InputForm
              label="Descripción *"
              placeholder="Ej: Segmentación por Industria"
              type="text"
              id="descripcion"
              required={true}
              {...registerCreate("descripcion")}
            />

            <Divider />
            <div>
              <div className="mb-4 flex items-center justify-between">
                <Typography variant="h5" component="h4">
                  Sub-segmentaciones (Opcional)
                </Typography>
                <Button
                  size="small"
                  onClick={() => setShowSubSegmentations(!showSubSegmentations)}
                  startIcon={showSubSegmentations ? <ExpandLess /> : <ExpandMore />}
                >
                  {showSubSegmentations ? "Ocultar" : "Agregar"} Sub-segmentaciones
                </Button>
              </div>

              {showSubSegmentations && (
                <Box className="flex flex-col gap-4 rounded-lg p-4" sx={{ bgcolor: "background.default" }}>
                  <Paper variant="outlined" className="flex flex-col gap-4 p-4">
                    <Typography variant="h6" component="h5">
                      Agregar Sub-segmentación
                    </Typography>

                    <InputForm
                      label="Descripción *"
                      placeholder="Ej: Sub-segmentación por Industria"
                      type="text"
                      id="sub-descripcion"
                      required={false}
                      value={subSegmentaciones?.descripcion}
                      onChange={handleChangeSubSegmentacion}
                    />

                    <div className="flex gap-2">
                      <Button size="small" variant="contained" onClick={handleAddSubSegmentacion}>
                        Agregar
                      </Button>
                    </div>
                  </Paper>

                  {/* List of Sub-segmentations */}
                  {formCreateSubSegmentaciones.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <Typography variant="h6" component="h5">
                        Sub-segmentaciones ({formCreateSubSegmentaciones.length})
                      </Typography>
                      <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                        {formCreateSubSegmentaciones.map((subSeg, index) => (
                          <Paper
                            variant="outlined"
                            key={index}
                            className="flex items-center justify-between px-3 py-2"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {subSeg.descripcion}
                                </Typography>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Tooltip title="Quitar">
                                <IconButton
                                  color="error"
                                  onClick={() => {
                                  setValueCreate(
                                    "subSegmentaciones",
                                    formCreateSubSegmentaciones.filter(
                                      (_, i) => i !== index,
                                    ),
                                  );
                                }}
                                >
                                  <DeleteOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </div>
                          </Paper>
                        ))}
                      </div>
                    </div>
                  )}
                </Box>
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
          <div className="flex flex-col gap-6">
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

            <Divider />
            <div>
              <div className="mb-4 flex items-center justify-between">
                <Typography variant="h5" component="h4">
                  Sub-segmentaciones
                </Typography>
                <Button
                  size="small"
                  onClick={() => setShowSubSegmentations(!showSubSegmentations)}
                  startIcon={showSubSegmentations ? <ExpandLess /> : <ExpandMore />}
                >
                  {showSubSegmentations ? "Ocultar" : "Editar"} Sub-segmentaciones
                </Button>
              </div>

              {showSubSegmentations && (
                <Box className="flex flex-col gap-4 rounded-lg p-4" sx={{ bgcolor: "background.default" }}>
                  <Paper variant="outlined" className="flex flex-col gap-4 p-4">
                    <Typography variant="h6" component="h5">
                      Editar Sub-segmentación (Opcional)
                    </Typography>

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

                    <div className="flex gap-2">
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={() => setShowSubSegmentations(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
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
                      </Button>
                    </div>
                  </Paper>

                  {/* List of Sub-segmentations */}
                  {!!segmentacionById?.data?.subSegmentaciones?.length && (
                      <div className="flex flex-col gap-2">
                        <Typography variant="h6" component="h5">
                          Sub-segmentaciones (
                          {segmentacionById?.data?.subSegmentaciones?.length})
                        </Typography>
                        <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
                          {segmentacionById?.data?.subSegmentaciones?.map(
                            (subSeg, index) => (
                              <Paper
                                variant="outlined"
                                key={index}
                                className="flex items-center justify-between px-3 py-2"
                              >
                                <div className="flex flex-1 items-center gap-2">
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {subSeg.descripcion}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={subSeg.estado ? "Activa" : "Inactiva"}
                                    color={subSeg.estado ? "success" : "error"}
                                    variant="outlined"
                                  />
                                </div>
                                <div className="flex gap-1">
                                  <Tooltip title="Editar">
                                    <IconButton
                                      color="primary"
                                      onClick={() => handleShowEditSubSegmentacion(subSeg)}
                                    >
                                      <EditOutlined fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Eliminar">
                                    <IconButton
                                      color="error"
                                      onClick={() =>
                                        handleDeleteSubSegmentacion(subSeg.idSubSegmentacion || 0)
                                      }
                                    >
                                      <DeleteOutlined fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </div>
                              </Paper>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                </Box>
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
