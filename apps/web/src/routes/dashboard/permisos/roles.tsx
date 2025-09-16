import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { CheckIcon, PencilIcon, PlusIcon, TrashIcon } from "lucide-react";
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
import { useForm } from "../../../hooks/useForm";
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

  // Queries y mutaciones
  const { data: roles } = useRoles();
  const { data: modulos } = useGetModulos();

  const { mutate: createRole, isPending: isCreatingRole } = useCreateRole();
  const { mutate: updateRole, isPending: isUpdatingRole } = useUpdateRole();
  const { mutate: deleteRole } = useDeleteRole();

  // Formularios
  const {
    form: formCreateRole,
    resetForm: resetFormCreateRole,
    handleChange: handleChangeCreateRole,
    setForm: setFormCreateRole,
  } = useForm<CreateRoleDto>({
    descripcion: "",
    permissionsIds: [],
  });

  const {
    form: formUpdateRole,
    resetForm: resetFormUpdateRole,
    handleChange: handleChangeUpdateRole,
    setForm: setFormUpdateRole,
  } = useForm<UpdateRoleDto>({
    descripcion: "",
    estado: false,
  });

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
                setFormUpdateRole({
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
            Icon={PlusIcon}
            label="Agregar rol"
            onClick={() => {
              setIsModalOpen(true);
            }}
          />
        </div>
        <Table
          data={roles?.data || []}
          columns={columns}
          enablePagination={false}
          pageSize={20}
          enableSorting={false}
        />
      </div>

      <SimpleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetFormCreateRole();
        }}
        title="Agregar rol"
      >
        <FormsModal
          onSubmit={(e) => {
            e.preventDefault();
            createRole(formCreateRole, {
              onSuccess: () => {
                setIsModalOpen(false);
                resetFormCreateRole();
              },
            });
          }}
          isLoading={isCreatingRole}
          onCancel={() => {
            setIsModalOpen(false);
            resetFormCreateRole();
          }}
          updating={false}
        >
          <div className="flex flex-col gap-4">
            <InputForm
              label="Descripción"
              placeholder="Descripción"
              type="text"
              id="descripcion"
              value={formCreateRole.descripcion}
              onChange={handleChangeCreateRole}
            />
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-900">
                Agregue los módulos que desea asignar al rol.
                <span className="text-xs text-gray-500">
                  (Se pueden seleccionar múltiples módulos)
                </span>
              </p>
              {modulos?.data && (
                <div className="grid grid-cols-2 gap-2">
                  {modulos.data.map((modulo) => {
                    const isSelected = formCreateRole.permissionsIds.includes(
                      modulo.id,
                    );

                    const toggleSelection = () => {
                      if (!isSelected) {
                        setFormCreateRole({
                          ...formCreateRole,
                          permissionsIds: [
                            ...formCreateRole.permissionsIds,
                            modulo.id,
                          ],
                        });
                      } else {
                        setFormCreateRole({
                          ...formCreateRole,
                          permissionsIds: formCreateRole.permissionsIds.filter(
                            (id) => id !== modulo.id,
                          ),
                        });
                      }
                    };

                    return (
                      <label
                        key={modulo.id}
                        className={`relative max-h-20 min-h-14 cursor-pointer gap-2 rounded-md border p-4 transition-all duration-200 ${
                          isSelected
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-200"
                        }`}
                        htmlFor={modulo.id.toString()}
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={isSelected}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleSelection();
                          }
                        }}
                      >
                        {isSelected && (
                          <CheckIcon className="absolute top-2 right-2 h-4 w-4 text-blue-600" />
                        )}

                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {modulo.nombre}
                        </p>

                        <input
                          type="checkbox"
                          id={modulo.id.toString()}
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormCreateRole({
                                ...formCreateRole,
                                permissionsIds: [
                                  ...formCreateRole.permissionsIds,
                                  modulo.id,
                                ],
                              });
                            } else {
                              setFormCreateRole({
                                ...formCreateRole,
                                permissionsIds:
                                  formCreateRole.permissionsIds.filter(
                                    (id) => id !== modulo.id,
                                  ),
                              });
                            }
                          }}
                          className="hidden"
                        />
                      </label>
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
          resetFormUpdateRole();
        }}
        title="Editar rol"
      >
        <FormsModal
          onSubmit={(e) => {
            e.preventDefault();
            updateRole(
              {
                id: idSelectedRole as number,
                data: {
                  ...formUpdateRole,
                  estado: String(formUpdateRole.estado) === "true",
                },
              },
              {
                onSuccess: () => {
                  setIsModalUpdateOpen(false);
                  resetFormUpdateRole();
                },
              },
            );
          }}
          isLoading={isUpdatingRole}
          onCancel={() => {
            setIsModalUpdateOpen(false);
            resetFormUpdateRole();
          }}
          updating={false}
        >
          <div className="flex flex-col gap-4">
            <InputForm
              label="Descripción"
              placeholder="Descripción"
              type="text"
              id="descripcion"
              value={formUpdateRole.descripcion || ""}
              onChange={handleChangeUpdateRole}
            />
            <InputSelectStateBoolean
              label="Estado"
              placeholder="Estado"
              id="estado"
              value={formUpdateRole.estado?.toString() || ""}
              onChange={handleChangeUpdateRole}
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
