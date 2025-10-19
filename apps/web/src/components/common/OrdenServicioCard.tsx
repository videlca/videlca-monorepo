import { useState } from "react";
import type { GruposLiquidaciones } from "../../api/types/liquidaciones";
import { priceFormat } from "../../utils/PriceFormat";
import { getStatusColor } from "../../utils/StatusColor";
import { OrdenDetalles } from "../ui/modals/OrdenDetalles";
import { useGetOrdenServicioById } from "../../api/queryFunctions/orden-servicio";
import { toast } from "sonner";

export const OrdenServicioCard = ({
  grupoLiquidacion,
  showTotal = false,
}: {
  grupoLiquidacion: GruposLiquidaciones;
  showTotal?: boolean;
}) => {
  const [isOpenDetalles, setIsOpenDetalles] = useState(false);

  const {
    mutateAsync: getOrdenServicioByIdMutation,
    data: ordenServicioData,
    isPending,
  } = useGetOrdenServicioById();

  return (
    <>
      <div className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {grupoLiquidacion.liquidaciones.map((liquidacion) => (
            <div
              key={liquidacion.idLiquidacion}
              className={`rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md ${
                isPending ? "cursor-wait opacity-50" : "cursor-pointer"
              }`}
              onClick={() => {
                if (isPending) return;
                getOrdenServicioByIdMutation(
                  liquidacion.ordenServicio.idOrdenServicio,
                  {
                    onSuccess: (data) => {
                      if (data.status === 200 || data.status === 201) {
                        setIsOpenDetalles(true);
                      }
                    },
                    onError: (error) => {
                      toast.error(
                        error.message ||
                          "Error al obtener la orden de servicio",
                      );
                    },
                  },
                );
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  {liquidacion.ordenServicio.ordenServicioId.descripcionId}
                </h3>
                <span
                  className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusColor(liquidacion.ordenServicio.idEstadoOrdenServicio?.nombre || "")}`}
                >
                  {liquidacion.ordenServicio.idEstadoOrdenServicio?.nombre}
                </span>
              </div>

              <div className="space-y-1 text-xs text-gray-600">
                <div>
                  <span className="font-medium text-gray-900">
                    {liquidacion.ordenServicio.idLocacion?.idCliente.nombre}
                  </span>
                </div>
                <div className="text-gray-500">
                  {liquidacion.ordenServicio.idLocacion?.nombre} -{" "}
                  {liquidacion.ordenServicio.idLocacion?.direccion}
                </div>
              </div>
            </div>
          ))}
        </div>
        {showTotal && (
          <div className="mt-4 flex justify-end">
            <span className="text-sm text-gray-600">
              Liquidación Total:{" "}
              <span className="font-medium text-green-600">
                {priceFormat(grupoLiquidacion.total)}
              </span>
            </span>
          </div>
        )}
      </div>

      {ordenServicioData?.data && (
        <OrdenDetalles
          isOpenDetails={isOpenDetalles}
          setIsOpenDetails={setIsOpenDetalles}
          selectedOrderDetail={ordenServicioData.data}
        />
      )}
    </>
  );
};
