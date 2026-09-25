import { Building2, CircleDollarSign, Receipt } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { AdicionalLiquidado } from "../../../api/types/liquidaciones";
import { priceFormat } from "../../../utils/PriceFormat";
import { safeParseDate } from "../../../utils/DateUtils";

const formatMesAdicional = (fecha: string) =>
  format(safeParseDate(fecha), "MMMM yyyy", { locale: es });

// Detalle de una liquidacion de tipo "adicional" (GET /liquidaciones/:idLiquidacion/orden con tipo:'adicional').
// Los valores mostrados son el snapshot guardado en la liquidacion en su momento, no el estado actual del
// Adicional (que puede haberse editado desde entonces) — por eso no se recalcula nada aca, solo se muestra
export const AdicionalLiquidadoDetalle = ({
  detalle,
}: {
  detalle: AdicionalLiquidado;
}) => {
  const vigenciaFin = detalle.mesFin ? formatMesAdicional(detalle.mesFin) : "Indefinido";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Building2 className="h-6 w-6 text-blue-600" />
          Cliente
        </h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <p className="text-sm">
            <span className="font-medium text-gray-700">Cliente:</span>{" "}
            <span className="text-gray-600">{detalle.idCliente.nombre}</span>
          </p>
          <p className="text-sm">
            <span className="font-medium text-gray-700">Identificación:</span>{" "}
            <span className="text-gray-600">{detalle.idCliente.numeroIdentificacion}</span>
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Receipt className="h-6 w-6 text-green-600" />
          Información del Adicional
        </h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <p className="text-sm">
            <span className="font-medium text-gray-700">Nombre:</span>{" "}
            <span className="text-gray-600">{detalle.nombre}</span>
          </p>
          <p className="text-sm">
            <span className="font-medium text-gray-700">Vigencia:</span>{" "}
            <span className="text-gray-600 capitalize">
              {formatMesAdicional(detalle.mesInicio)} - {vigenciaFin}
            </span>
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-green-900">
          <CircleDollarSign className="h-6 w-6 text-green-600" />
          Precio Calculado
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <p>
            <span className="block font-medium text-green-800">Costos Directos</span>
            <span className="text-green-700">
              {detalle.costosDirectos != null ? priceFormat(Number(detalle.costosDirectos)) : "-"}
            </span>
          </p>
          <p>
            <span className="block font-medium text-green-800">Seguro de Vida</span>
            <span className="text-green-700">
              {detalle.seguroVida != null ? priceFormat(Number(detalle.seguroVida)) : "-"}
            </span>
          </p>
          <p>
            <span className="block font-medium text-green-800">AUI</span>
            <span className="text-green-700">
              {detalle.aui != null ? priceFormat(Number(detalle.aui)) : "-"}
            </span>
          </p>
          <p>
            <span className="block font-medium text-green-800">Precio antes de IVA</span>
            <span className="text-green-700">
              {detalle.precioAntesIva != null ? priceFormat(Number(detalle.precioAntesIva)) : "-"}
            </span>
          </p>
        </div>
        <p className="mt-3 border-t border-green-200 pt-3 text-sm">
          <span className="font-medium text-green-800">Precio Total (cobro mensual):</span>{" "}
          <span className="text-lg font-semibold text-green-700">
            {priceFormat(Number(detalle.precioTotal))}
          </span>
        </p>
      </div>
    </div>
  );
};
