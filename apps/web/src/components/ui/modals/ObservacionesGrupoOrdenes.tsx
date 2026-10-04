import { SimpleModal } from "../../common/SimpleModal";
import type { ObservacionGrupoOrdenServicio } from "../../../api/types/orden-servicio";
import {
  useCreateObservacionGrupoOrdenServicio,
  useDeleteObservacionGrupoOrdenServicio,
} from "../../../api/queryFunctions/orden-servicio/observaciones-grupo";
import type { GruposLiquidaciones } from "../../../api/types/liquidaciones";
import { ObservacionesPanel } from "./ObservacionesPanel";

export const ObservacionesGrupoOrdenes = ({
  isOpenObservaciones,
  setIsOpenObservaciones,
  selectedOrderDetail,
  setSelectedOrderDetail,
  observacionesQueryData,
}: {
  isOpenObservaciones: boolean;
  setIsOpenObservaciones: (isOpen: boolean) => void;
  selectedOrderDetail: GruposLiquidaciones;
  setSelectedOrderDetail: (
    selectedOrderDetail: GruposLiquidaciones | null,
  ) => void;
  observacionesQueryData: ObservacionGrupoOrdenServicio[];
}) => {
  const {
    mutate: createObservacionMutation,
    isPending: createObservacionMutationPending,
  } = useCreateObservacionGrupoOrdenServicio();
  const {
    mutate: deleteObservacionMutation,
    isPending: deleteObservacionMutationPending,
  } = useDeleteObservacionGrupoOrdenServicio();

  if (!isOpenObservaciones) return null;

  return (
    <SimpleModal
      isOpen={isOpenObservaciones}
      onClose={() => {
        setIsOpenObservaciones(false);
        setSelectedOrderDetail(null);
      }}
      title={`Observaciones Grupo de Ordenes: ${selectedOrderDetail?.descripcion || ""}`}
      size="xl"
    >
      <ObservacionesPanel
        observaciones={(observacionesQueryData ?? []).map((observacion) => ({
          id: observacion.idObservacionGrupoOrdenServicio,
          descripcion: observacion.descripcion,
          fechaCreacion: observacion.fechaCreacion,
          autor: observacion.idUsuario,
        }))}
        onCreate={(descripcion, onSuccess) =>
          createObservacionMutation(
            {
              descripcion,
              idGrupoOrdenServicio: selectedOrderDetail.idGrupoLiquidacion,
            },
            { onSuccess },
          )
        }
        createPending={createObservacionMutationPending}
        onDelete={(id) => deleteObservacionMutation({ idGrupoOrdenServicio: id })}
        deletePending={deleteObservacionMutationPending}
      />
    </SimpleModal>
  );
};
