import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { DetailField, DetailSection } from "../common/DetailSection";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
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
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <DetailSection icon={<BusinessOutlinedIcon />} title="Cliente">
        <DetailField label="Cliente" value={detalle.idCliente.nombre} />
        <DetailField label="Identificación" value={detalle.idCliente.numeroIdentificacion} />
      </DetailSection>

      <DetailSection icon={<ReceiptLongOutlinedIcon />} title="Información del Adicional">
        <DetailField label="Nombre" value={detalle.nombre} />
        <DetailField
          label="Vigencia"
          value={
            <span className="capitalize">
              {formatMesAdicional(detalle.mesInicio)} - {vigenciaFin}
            </span>
          }
        />
      </DetailSection>

      <Box
        className="rounded-lg p-4"
        sx={{
          border: 1,
          borderColor: "success.light",
          bgcolor: (t) => alpha(t.palette.success.main, 0.06),
        }}
      >
        <Typography
          variant="h5"
          component="h4"
          className="flex items-center gap-2"
          sx={{ mb: 1.5, "& svg": { color: "success.main", fontSize: 20 } }}
        >
          <MonetizationOnOutlinedIcon />
          Precio Calculado
        </Typography>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <DetailField
            label="Costos Directos"
            value={detalle.costosDirectos != null ? priceFormat(Number(detalle.costosDirectos)) : "-"}
          />
          <DetailField
            label="Seguro de Vida"
            value={detalle.seguroVida != null ? priceFormat(Number(detalle.seguroVida)) : "-"}
          />
          <DetailField
            label="AUI"
            value={detalle.aui != null ? priceFormat(Number(detalle.aui)) : "-"}
          />
          <DetailField
            label="Precio antes de IVA"
            value={detalle.precioAntesIva != null ? priceFormat(Number(detalle.precioAntesIva)) : "-"}
          />
        </div>
        <Typography
          variant="body2"
          sx={{ mt: 1.5, pt: 1.5, borderTop: 1, borderColor: "success.light" }}
        >
          <Box component="span" sx={{ fontWeight: 500 }}>
            Precio Total (cobro mensual):
          </Box>{" "}
          <Box component="span" sx={{ fontSize: "1.125rem", fontWeight: 600, color: "success.dark" }}>
            {priceFormat(Number(detalle.precioTotal))}
          </Box>
        </Typography>
      </Box>
    </div>
  );
};
