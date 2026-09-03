import { useState } from "react";
import type { GruposLiquidaciones } from "../../api/types/liquidaciones";
import { priceFormat } from "../../utils/PriceFormat";
import { getStatusColor } from "../../utils/StatusColor";
import { OrdenDetalles } from "../ui/modals/OrdenDetalles";
import { useGetOrdenLiquidada } from "../../api/queryFunctions/liquidaciones";
import { toast } from "sonner";

export const OrdenServicioCard = ({
  grupoLiquidacion,
  showTotal = false,
}: {
  grupoLiquidacion: GruposLiquidaciones;
  showTotal?: boolean;
}) => {
  const [isOpenDetalles, setIsOpenDetalles] = useState(false);

  // Se muestra el snapshot de la liquidacion (lo realmente cobrado ese mes), no el findOne de la orden completa:
  // si la orden abarca varios meses, el total de la orden no coincide con lo que se liquido en este mes puntual
  const {
    mutateAsync: getOrdenLiquidadaMutation,
    data: ordenLiquidadaData,
    isPending,
  } = useGetOrdenLiquidada();

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
                getOrdenLiquidadaMutation(liquidacion.idLiquidacion, {
                  onSuccess: (data) => {
                    if (data.status === 200 || data.status === 201) {
                      setIsOpenDetalles(true);
                    }
                  },
                  onError: (error) => {
                    toast.error(
                      error.message ||
                        "Error al obtener el detalle de la liquidación",
                    );
                  },
                });
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

              {/* Valor liquidado de esta orden puntual (ya viene en el objeto, no requiere otra consulta) */}
              <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="text-xs text-gray-500">Liquidado</span>
                <span className="text-sm font-semibold text-green-600">
                  {priceFormat(liquidacion.valor_liquidacion)}
                </span>
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

      {ordenLiquidadaData?.data && (
        <OrdenDetalles
          isOpenDetails={isOpenDetalles}
          setIsOpenDetails={setIsOpenDetalles}
          selectedOrderDetail={ordenLiquidadaData.data}
        />
      )}
    </>
  );
};
