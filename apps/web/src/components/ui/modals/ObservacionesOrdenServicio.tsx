import { SimpleModal } from "../../common/SimpleModal";
import type {
  ObservacionOrdenServicio,
  OrdenServicio,
} from "../../../api/types/orden-servicio";
import { useState } from "react";
import {
  useCreateObservacionOrdenServicio,
  useDeleteObservacionOrdenServicio,
} from "../../../api/queryFunctions/orden-servicio/observaciones";
import { format } from "date-fns";
import { usePermissions } from "../../../context/PermissionsContext";

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
  // Estados
  const [newObservacion, setNewObservacion] = useState<string>("");
  const { currentUser } = usePermissions();

  // Mutaciones y queries
  const { mutate: createObservacionMutation } =
    useCreateObservacionOrdenServicio();
  const { mutate: deleteObservacionMutation } =
    useDeleteObservacionOrdenServicio();

  if (!isOpenObservaciones) return null;

  return (
    <SimpleModal
      isOpen={isOpenObservaciones}
      onClose={() => {
        setIsOpenObservaciones(false);
        setSelectedOrderDetail(null);
      }}
      title={`Observaciones: ${selectedOrderDetail?.ordenServicioId?.descripcionId || ""} - ${selectedOrderDetail?.idLocacion?.idCliente?.nombre || ""}`}
      size="xl"
    >
      {/* Comments List */}
      <div className="flex-1 space-y-4 overflow-y-auto py-6">
        {observacionesQueryData?.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mb-2 text-gray-400">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-gray-500">No hay observaciones aún</p>
            <p className="text-sm text-gray-400">
              Sé el primero en agregar una observación
            </p>
          </div>
        ) : (
          observacionesQueryData?.map((observacion) => (
            <div
              key={observacion.idObservacionOrdenServicio}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                    <span className="text-sm font-medium text-white">
                      {`${observacion.idUsuario.primerNombre.charAt(0).toUpperCase()}${observacion.idUsuario.primerApellido.charAt(0).toUpperCase()}`}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {`${observacion.idUsuario.primerNombre} ${observacion.idUsuario.primerApellido}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(observacion.fechaCreacion, "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>
                {observacion.idUsuario.idUser === currentUser?.idUser && (
                  <button
                    onClick={() =>
                      deleteObservacionMutation({
                        id: observacion.idObservacionOrdenServicio,
                        idOrdenServicio: selectedOrderDetail.idOrdenServicio,
                      })
                    }
                    className="cursor-pointer p-1 text-red-400 transition-colors hover:text-red-600"
                    title="Eliminar observación"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <p className="text-sm leading-relaxed text-gray-700">
                {observacion.descripcion}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add Observacion Form */}
      <div className="border-t border-gray-200 py-6">
        <div className="flex space-x-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
            <span className="text-sm font-medium text-white">
              {currentUser?.primerNombre.charAt(0).toUpperCase()}
              {currentUser?.primerApellido.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <textarea
              value={newObservacion}
              onChange={(e) => setNewObservacion(e.target.value)}
              placeholder="Agregar observación..."
              rows={3}
              className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {newObservacion.length}/500 caracteres
              </p>
              <button
                onClick={() => {
                  createObservacionMutation(
                    {
                      descripcion: newObservacion.trim(),
                      idOrdenServicio: selectedOrderDetail.idOrdenServicio,
                    },
                    {
                      onSuccess: () => {
                        setNewObservacion("");
                      },
                    },
                  );
                }}
                disabled={!newObservacion.trim() || newObservacion.length > 500}
                className="rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                Agregar Observación
              </button>
            </div>
          </div>
        </div>
      </div>
    </SimpleModal>
  );
};
