import { createFileRoute } from "@tanstack/react-router";
import {
  CheckIcon,
  EyeOff,
  FileTextIcon,
  Mail,
  MessageSquareTextIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { Section } from "../../../components/ui/dashboard/Section";
import {
  useAprobarGrupoLiquidacion,
  useDesintegrarGrupoLiquidacion,
  useEnviarCorreoArchivoLiquidacion,
  useGenerarReporteArchivoLiquidacion,
  useGetGruposLiquidaciones,
} from "../../../api/queryFunctions/liquidaciones";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { OrdenServicioCard } from "../../../components/common/OrdenServicioCard";
import { EnvioCorreos } from "../../../components/ui/modals/EnvioCorreos";
import { ObservacionesGrupoOrdenes } from "../../../components/ui/modals/ObservacionesGrupoOrdenes";
import type { GruposLiquidaciones } from "../../../api/types";
import { useGetObservacionesGrupoOrdenServicio } from "../../../api/queryFunctions/orden-servicio/observaciones-grupo";
import ButtonOrdenes from "../../../components/common/ButtonOrdenes";

export const Route = createFileRoute(
  "/dashboard/aprobacion-liquidaciones-ordenes/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const [hiddenGroups, setHiddenGroups] = useState<Set<number>>(new Set());
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
  const [groupIdSelected, setGroupIdSelected] = useState<number | null>(null);
  const [isOpenEmail, setIsOpenEmail] = useState(false);
  const [isOpenObservaciones, setIsOpenObservaciones] = useState(false);
  const [selectedGroupOrder, setSelectedGroupOrder] =
    useState<GruposLiquidaciones | null>(null);
  // Queries y mutaciones
  const { data: groups } = useGetGruposLiquidaciones();
  const { data: observacionesQueryData } =
    useGetObservacionesGrupoOrdenServicio(
      (selectedGroupOrder?.idGrupoLiquidacion as number) || 0,
    );
  const { mutate: aprobarGrupoLiquidacion } = useAprobarGrupoLiquidacion();
  const { mutate: desintegrarGrupoLiquidacion } =
    useDesintegrarGrupoLiquidacion();

  // Archivos de liquidaciones
  const { mutate: generarReporteArchivoLiquidacion } =
    useGenerarReporteArchivoLiquidacion();
  const {
    mutate: enviarCorreoArchivoLiquidacion,
    isPending: enviarCorreoArchivoLiquidacionPending,
  } = useEnviarCorreoArchivoLiquidacion();

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

  const handleGenerarReporteLiquidacion = (groupId: number) => {
    generarReporteArchivoLiquidacion(groupId);
  };

  const handleEnviarCorreoLiquidacion = (groupId: number) => {
    setIsOpenEmail(true);
    setGroupIdSelected(groupId);
  };
  return (
    <Section>
      <div className="flex flex-col gap-8">
        <p className="text-sm text-gray-500">
          Selecciona un grupo para aprobar la liquidación de las órdenes.
        </p>
        {groups?.data?.data?.length === 0 ? (
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
            {groups?.data?.data?.map((group) => (
              <div
                key={group.idGrupoLiquidacion}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <div className="border-b border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex w-full flex-col items-center justify-between gap-4 md:flex-row md:gap-0">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Descripción:</span>{" "}
                        {group.descripcion} <br />
                        <span className="font-medium">Órdenes:</span>{" "}
                        {group.liquidaciones?.length || 0}
                        <br />
                        <span className="font-medium">Creado:</span>{" "}
                        {new Date(group.fechaCreacion).toLocaleDateString(
                          "es-ES",
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-0 md:gap-4">
                        <ButtonOrdenes
                          onClick={() =>
                            toggleHideOrders(group.idGrupoLiquidacion)
                          }
                          color="gray"
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
                        </ButtonOrdenes>
                        <ButtonOrdenes
                          onClick={() => {
                            setIsOpenObservaciones(true);
                            setSelectedGroupOrder(group);
                          }}
                          color="green"
                        >
                          <MessageSquareTextIcon className="mr-1 h-4 w-4" />
                          Observaciones
                        </ButtonOrdenes>
                        <ButtonOrdenes
                          onClick={() =>
                            handleGenerarReporteLiquidacion(
                              group.idGrupoLiquidacion,
                            )
                          }
                          color="blue"
                        >
                          <FileTextIcon className="mr-1 h-4 w-4" />
                          Generar reporte
                        </ButtonOrdenes>
                        <ButtonOrdenes
                          onClick={() =>
                            handleEnviarCorreoLiquidacion(
                              group.idGrupoLiquidacion,
                            )
                          }
                          color="amber"
                        >
                          <Mail className="mr-1 h-4 w-4" />
                          Enviar correo
                        </ButtonOrdenes>
                        <ButtonOrdenes
                          onClick={() =>
                            handleAprobar(group.idGrupoLiquidacion)
                          }
                          color="green"
                        >
                          <CheckIcon className="mr-1 h-4 w-4" />
                          Aprobar
                        </ButtonOrdenes>
                        <ButtonOrdenes
                          onClick={() =>
                            handleDesintegrar(group.idGrupoLiquidacion)
                          }
                          color="red"
                        >
                          <TrashIcon className="mr-1 h-4 w-4" />
                          Desintegrar
                        </ButtonOrdenes>
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

      <ObservacionesGrupoOrdenes
        isOpenObservaciones={isOpenObservaciones}
        setIsOpenObservaciones={(isOpen) => {
          setIsOpenObservaciones(isOpen);
          if (!isOpen) {
            setGroupIdSelected(null);
          }
        }}
        selectedOrderDetail={selectedGroupOrder || ({} as GruposLiquidaciones)}
        setSelectedOrderDetail={setSelectedGroupOrder}
        observacionesQueryData={observacionesQueryData?.data?.data || []}
      />

      <EnvioCorreos
        isOpen={isOpenEmail}
        setIsOpen={setIsOpenEmail}
        id={groupIdSelected as number}
        mutationEmail={enviarCorreoArchivoLiquidacion}
        envioCorreoPending={enviarCorreoArchivoLiquidacionPending}
      />

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
