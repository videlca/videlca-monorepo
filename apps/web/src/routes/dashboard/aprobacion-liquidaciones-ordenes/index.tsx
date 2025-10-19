import { createFileRoute } from "@tanstack/react-router";
import { CheckIcon, EyeOff, FileTextIcon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { Section } from "../../../components/ui/dashboard/Section";
import {
  useAprobarGrupoLiquidacion,
  useDesintegrarGrupoLiquidacion,
  useGetGruposLiquidaciones,
} from "../../../api/queryFunctions/liquidaciones";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { OrdenServicioCard } from "../../../components/common/OrdenServicioCard";

export const Route = createFileRoute(
  "/dashboard/aprobacion-liquidaciones-ordenes/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const [hiddenGroups, setHiddenGroups] = useState<Set<number>>(new Set());
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
  const [groupIdSelected, setGroupIdSelected] = useState<number | null>(null);

  // Queries y mutaciones
  const { data: groups } = useGetGruposLiquidaciones();
  const { mutate: aprobarGrupoLiquidacion } = useAprobarGrupoLiquidacion();
  const { mutate: desintegrarGrupoLiquidacion } =
    useDesintegrarGrupoLiquidacion();

  const toggleHideOrders = (groupId: number) => {
    const newHidden = new Set(hiddenGroups);
    if (newHidden.has(groupId)) {
      newHidden.delete(groupId);
    } else {
      newHidden.add(groupId);
    }
    setHiddenGroups(newHidden);
  };

  const handleAprobar = (groupId: number) => {
    aprobarGrupoLiquidacion(groupId);
  };

  const handleDesintegrar = (groupId: number) => {
    setGroupIdSelected(groupId);
    setIsOpenDeleteModal(true);
  };

  return (
    <Section>
      <div className="flex flex-col gap-8">
        <p className="text-sm text-gray-500">
          Selecciona un grupo para aprobar la liquidación de las órdenes.
        </p>
        {groups?.data?.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <FileTextIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No hay grupos creados
            </h3>
            <p className="mb-4 text-gray-500">
              Crea tu primer grupo desde la pantalla de búsqueda de órdenes
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups?.data?.map((group) => (
              <div
                key={group.idGrupoLiquidacion}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <div className="border-b border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex w-full flex-col items-center justify-between gap-4 md:flex-row md:gap-0">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Descripción:</span>{" "}
                        {group.descripcion} |
                        <span className="ml-1 font-medium">
                          {group.liquidaciones.length} órdenes
                        </span>{" "}
                        |<span className="ml-1 font-medium">Creado:</span>{" "}
                        {new Date(group.fechaCreacion).toLocaleDateString(
                          "es-ES",
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            toggleHideOrders(group.idGrupoLiquidacion)
                          }
                          className="flex cursor-pointer items-center rounded-md px-3 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800"
                          title={
                            hiddenGroups.has(group.idGrupoLiquidacion)
                              ? "Mostrar órdenes"
                              : "Ocultar órdenes"
                          }
                        >
                          <EyeOff className="mr-1 h-4 w-4" />
                          {hiddenGroups.has(group.idGrupoLiquidacion)
                            ? "Mostrar"
                            : "Ocultar"}
                        </button>
                        <button
                          onClick={() =>
                            handleAprobar(group.idGrupoLiquidacion)
                          }
                          className="flex cursor-pointer items-center rounded-md px-3 py-1 text-sm text-green-600 transition-colors hover:bg-green-50 hover:text-green-800"
                        >
                          <CheckIcon className="mr-1 h-4 w-4" />
                          Aprobar
                        </button>
                        <button
                          onClick={() =>
                            handleDesintegrar(group.idGrupoLiquidacion)
                          }
                          className="flex cursor-pointer items-center rounded-md px-3 py-1 text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-800"
                        >
                          <TrashIcon className="mr-1 h-4 w-4" />
                          Desintegrar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {!hiddenGroups.has(group.idGrupoLiquidacion) && (
                  <OrdenServicioCard
                    key={group.idGrupoLiquidacion}
                    grupoLiquidacion={group}
                    showTotal={true}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmarDelete
        isOpenDelete={isOpenDeleteModal}
        text="¿Estás seguro de querer desintegrar este grupo de liquidación?"
        onDelete={() => {
          desintegrarGrupoLiquidacion(groupIdSelected as number, {
            onSuccess: () => {
              setIsOpenDeleteModal(false);
              setGroupIdSelected(null);
            },
          });
        }}
        onClose={() => {
          setIsOpenDeleteModal(false);
          setGroupIdSelected(null);
        }}
      />
    </Section>
  );
}
