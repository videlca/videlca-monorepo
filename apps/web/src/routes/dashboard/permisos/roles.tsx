import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { ButtonAction } from "../../../components/common/ButtonAction";
import AddIcon from "@mui/icons-material/Add";
import { useState } from "react";
import Table from "../../../components/common/Table";
import type { Rol } from "../../../types";
import type { ColumnDef } from "@tanstack/react-table";
import { StateLabel } from "../../../components/common/StateLabel";
import {
  useCreateRole,
  useDeleteRole,
  useRoles,
  useUpdateRole,
} from "../../../api/queryFunctions/permisos";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { InputForm } from "../../../components/common/InputForm";
import { useForm } from "react-hook-form";
import type { CreateRoleDto, UpdateRoleDto } from "../../../api/dtos";
import { useGetModulos } from "../../../api/queryFunctions/permisos/modulos";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";

export const Route = createFileRoute("/dashboard/permisos/roles")({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalUpdateOpen, setIsModalUpdateOpen] = useState(false);
  const [isConfirmarDeleteOpen, setIsConfirmarDeleteOpen] = useState(false);
  const [idSelectedRole, setIdSelectedRole] = useState<number | null>(null);
  // Permissions state managed separately since it's an array toggle
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  // Queries y mutaciones
  const { data: roles } = useRoles();
  const { data: modulos } = useGetModulos();

  const { mutate: createRole, isPending: isCreatingRole } = useCreateRole();
  const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateRole();
  const { mutate: deleteRole } = useDeleteRole();

  // Formularios
  const {
    register: registerCrear,
    handleSubmit: handleSubmitCrear,
    reset: resetCrear,
  } = useForm<Omit<CreateRoleDto, "permissionsIds">>({
    defaultValues: { descripcion: "" },
  });

  const {
    register: registerEditar,
    handleSubmit: handleSubmitEditar,
    reset: resetEditar,
  } = useForm<UpdateRoleDto>({
    defaultValues: { descripcion: "", estado: false },
  });

  const onSubmitCreate = (data: Omit<CreateRoleDto, "permissionsIds">) => {
    createRole(
      { ...data, permissionsIds: selectedPermissions },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          resetCrear();
          setSelectedPermissions([]);
        },
      },
    );
  };

  const onSubmitUpdate = (data: UpdateRoleDto) => {
    updateRole(
      {
        id: idSelectedRole as number,
        data: {
          ...data,
          estado: String(data.estado) === "true",
        },
      },
      {
        onSuccess: () => {
          setIsModalUpdateOpen(false);
          resetEditar();
        },
      },
    );
  };

  const columns: ColumnDef<Rol>[] = [
    {
      accessorKey: "nombreRol",
      header: "Nombre",
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        return <StateLabel state={row.getValue("estado")} />;
      },
    },
    {
      accessorKey: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <MoreActionsButton
          menuId={`actions-${row.original.id}`}
          actions={[
            {
              label: "Editar",
              onClick: () => {
                setIsModalUpdateOpen(true);
                setIdSelectedRole(row.original.id);
                resetEditar({
                  descripcion: row.original.descripcion,
                  estado: row.original.estado,
                });
              },
            },
            {
              label: "Eliminar",
              onClick: () => {
                setIdSelectedRole(row.original.id);
                setIsConfirmarDeleteOpen(true);
              },
              color: "red" as const,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="flex justify-end">
          <ButtonAction
            Icon={AddIcon}
            label="Agregar rol"
            onClick={() => {
              setIsModalOpen(true);
            }}
          />
        </div>
        <Table
          data={roles?.data?.data ?? []}
          columns={columns}
          enablePagination={false}
          pageSize={5}
          enableSorting={false}
        />
      </div>

      <SimpleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetCrear();
          setSelectedPermissions([]);
        }}
        title="Agregar rol"
      >
        <FormsModal
          onSubmit={handleSubmitCrear(onSubmitCreate)}
          isLoading={isCreatingRole}
          onCancel={() => {
            setIsModalOpen(false);
            resetCrear();
            setSelectedPermissions([]);
          }}
          updating={false}
        >
          <div className="flex flex-col gap-4">
            <InputForm
              label="Descripción"
              placeholder="Descripción"
              type="text"
              id="descripcion"
              {...registerCrear("descripcion")}
            />
            <div className="flex flex-col gap-2">
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Agregue los módulos que desea asignar al rol.{" "}
                <Typography component="span" variant="caption" color="text.secondary">
                  (Se pueden seleccionar múltiples módulos)
                </Typography>
              </Typography>
              {modulos?.data?.data && (
                <div className="grid grid-cols-2 gap-2">
                  {modulos.data.data.map((modulo) => {
                    const isSelected = selectedPermissions.includes(modulo.id);

                    const toggleSelection = () => {
                      if (!isSelected) {
                        setSelectedPermissions((prev) => [...prev, modulo.id]);
                      } else {
                        setSelectedPermissions((prev) =>
                          prev.filter((id) => id !== modulo.id),
                        );
                      }
                    };

                    return (
                      <Paper
                        key={modulo.id}
                        variant="outlined"
                        sx={{
                          px: 1,
                          borderColor: isSelected ? "primary.main" : "divider",
                          bgcolor: isSelected ? "action.selected" : "background.paper",
                        }}
                      >
                        <FormControlLabel
                          sx={{ width: "100%", m: 0 }}
                          control={
                            <Checkbox
                              size="small"
                              id={modulo.id.toString()}
                              checked={isSelected}
                              onChange={toggleSelection}
                            />
                          }
                          label={
                            <span className="capitalize">{modulo.nombre}</span>
                          }
                        />
                      </Paper>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </FormsModal>
      </SimpleModal>

      <SimpleModal
        isOpen={isModalUpdateOpen}
        onClose={() => {
          setIsModalUpdateOpen(false);
          resetEditar();
        }}
        title="Editar rol"
      >
        <FormsModal
          onSubmit={handleSubmitEditar(onSubmitUpdate)}
          isLoading={isUpdatingRole}
          onCancel={() => {
            setIsModalUpdateOpen(false);
            resetEditar();
          }}
          updating={false}
        >
          <div className="flex flex-col gap-4">
            <InputForm
              label="Descripción"
              placeholder="Descripción"
              type="text"
              id="descripcion"
              {...registerEditar("descripcion")}
            />
            <InputSelectStateBoolean
              label="Estado"
              placeholder="Estado"
              id="estado"
              {...registerEditar("estado")}
            />
          </div>
        </FormsModal>
      </SimpleModal>
      <ConfirmarDelete
        isOpenDelete={isConfirmarDeleteOpen}
        text="¿Estás seguro de querer eliminar este rol?"
        onClose={() => {
          setIsConfirmarDeleteOpen(false);
          setIdSelectedRole(null);
        }}
        onDelete={() => {
          deleteRole(idSelectedRole as number, {
            onSuccess: () => {
              setIsConfirmarDeleteOpen(false);
              setIdSelectedRole(null);
            },
          });
        }}
      />
    </Section>
  );
}
