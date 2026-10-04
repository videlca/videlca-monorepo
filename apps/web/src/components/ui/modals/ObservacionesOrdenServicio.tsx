import { SimpleModal } from "../../common/SimpleModal";
import type {
  ObservacionOrdenServicio,
  OrdenServicio,
} from "../../../api/types/orden-servicio";
import {
  useCreateObservacionOrdenServicio,
  useDeleteObservacionOrdenServicio,
} from "../../../api/queryFunctions/orden-servicio/observaciones";
import { ObservacionesPanel } from "./ObservacionesPanel";

export const ObservacionesOrdenServicio = ({
  isOpenObservaciones,
  setIsOpenObservaciones,
  selectedOrderDetail,
  setSelectedOrderDetail,
  observacionesQueryData,
}: {
  isOpenObservaciones: boolean;
  setIsOpenObservaciones: (isOpen: boolean) => void;
  selectedOrderDetail: OrdenServicio;
  setSelectedOrderDetail: (selectedOrderDetail: OrdenServicio | null) => void;
  observacionesQueryData: ObservacionOrdenServicio[];
}) => {
  const {
    mutate: createObservacionMutation,
    isPending: createObservacionMutationPending,
  } = useCreateObservacionOrdenServicio();
  const {
    mutate: deleteObservacionMutation,
    isPending: deleteObservacionMutationPending,
  } = useDeleteObservacionOrdenServicio();

  if (!isOpenObservaciones) return null;

  return (
    <SimpleModal
      isOpen={isOpenObservaciones}
      onClose={() => {
        setIsOpenObservaciones(false);
        setSelectedOrderDetail(null);
      }}
      title={`Observaciones: ${selectedOrderDetail?.ordenServicioId?.descripcionId || ""} - ${selectedOrderDetail?.idLocacion?.idCliente?.nombre || selectedOrderDetail?.idCliente?.nombre || ""}`}
      size="xl"
    >
      <ObservacionesPanel
        observaciones={(observacionesQueryData ?? []).map((observacion) => ({
          id: observacion.idObservacionOrdenServicio,
          descripcion: observacion.descripcion,
          fechaCreacion: observacion.fechaCreacion,
          autor: observacion.idUsuario,
        }))}
        onCreate={(descripcion, onSuccess) =>
          createObservacionMutation(
            {
              descripcion,
              idOrdenServicio: selectedOrderDetail.idOrdenServicio,
            },
            { onSuccess },
          )
        }
        createPending={createObservacionMutationPending}
        onDelete={(id) =>
          deleteObservacionMutation({
            id,
            idOrdenServicio: selectedOrderDetail.idOrdenServicio,
          })
        }
        deletePending={deleteObservacionMutationPending}
      />
    </SimpleModal>
  );
};
