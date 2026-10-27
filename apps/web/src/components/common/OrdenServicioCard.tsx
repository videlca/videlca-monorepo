import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { tones, type Tone } from "../../theme/tones";
import { OrderStateLabel } from "./OrderStateLabel";
import { useState } from "react";
import type {
  GruposLiquidaciones,
  Liquidaciones,
} from "../../api/types/liquidaciones";
import { priceFormat } from "../../utils/PriceFormat";
import { OrdenDetalles } from "../ui/modals/OrdenDetalles";
import { useGetOrdenLiquidada } from "../../api/queryFunctions/liquidaciones";
import { toast } from "sonner";

const estilosTipoServicio: Record<
  NonNullable<Liquidaciones["tipoServicio"]>,
  { label: string; tone: Tone }
> = {
  monitoreo: { label: "Monitoreo", tone: "blue" },
  vigilancia: { label: "Vigilancia", tone: "purple" },
  adicional: { label: "Adicional", tone: "amber" },
};

const TipoServicioBadge = ({
  tipo,
}: {
  tipo: NonNullable<Liquidaciones["tipoServicio"]>;
}) => {
  const { label, tone } = estilosTipoServicio[tipo];
  return (
    <Chip
      size="small"
      variant="outlined"
      label={label}
      sx={{ color: tones[tone].main, borderColor: tones[tone].main, bgcolor: tones[tone].bg }}
    />
  );
};

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

  // grupoLiquidacion.total ya viene calculado desde el backend (CON iva); el "antes de iva" no se guarda a
  // nivel de grupo, solo por liquidacion (ver valorLiquidacionAntesIva), asi que se suma aca
  const totalAntesIva =
    grupoLiquidacion.totalAntesIvaFiltrado ??
    grupoLiquidacion.liquidaciones.reduce(
      (acc, liquidacion) =>
        acc + Number(liquidacion.valorLiquidacionAntesIva ?? 0),
      0,
    );
  const totalGrupo = grupoLiquidacion.totalFiltrado ?? grupoLiquidacion.total;

  return (
    <>
      <div className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {grupoLiquidacion.liquidaciones.map((liquidacion) => (
            <Paper
              key={liquidacion.idLiquidacion}
              variant="outlined"
              className="flex flex-col p-3"
              sx={{
                cursor: isPending ? "wait" : "pointer",
                opacity: isPending ? 0.5 : 1,
                transition: "box-shadow .2s",
                "&:hover": { boxShadow: 2 },
              }}
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
              {liquidacion.ordenServicio ? (
                <>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Typography variant="body2" component="h3" sx={{ fontWeight: 600 }}>
                      {liquidacion.ordenServicio.ordenServicioId.descripcionId}
                    </Typography>
                    <OrderStateLabel state={liquidacion.ordenServicio.idEstadoOrdenServicio?.nombre || ""} />
                  </div>

                  <div className="flex flex-col items-start gap-1">
                    {liquidacion.tipoServicio && (
                      <TipoServicioBadge tipo={liquidacion.tipoServicio} />
                    )}
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {liquidacion.ordenServicio.idLocacion?.idCliente.nombre ||
                        liquidacion.ordenServicio.idCliente?.nombre}
                    </Typography>
                    {/* Monitoreo de alarmas no tiene puesto/locacion asociado (va directo a un cliente, ver
                        idCliente arriba), no hay nada que mostrar en esta linea */}
                    {liquidacion.ordenServicio.idLocacion && (
                      <Typography variant="caption" color="text.secondary">
                        {liquidacion.ordenServicio.idLocacion.nombre} -{" "}
                        {liquidacion.ordenServicio.idLocacion.direccion}
                      </Typography>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Typography variant="body2" component="h3" sx={{ fontWeight: 600 }}>
                      {liquidacion.adicional?.idTipoAdicional?.descripcion ?? `Adicional #${liquidacion.idAdicional}`}
                    </Typography>
                    {liquidacion.tipoServicio ? (
                      <TipoServicioBadge tipo={liquidacion.tipoServicio} />
                    ) : (
                      <Chip size="small" variant="outlined" label="Adicional" />
                    )}
                  </div>

                  <Typography variant="caption" sx={{ fontWeight: 500 }}>
                    {liquidacion.adicional?.idCliente?.nombre}
                  </Typography>
                </>
              )}

              {/* Valores de esta orden puntual (ya vienen en el objeto, no requiere otra consulta) */}
              <Box
                className="mt-auto flex items-center justify-between pt-2"
                sx={{ mt: 1, borderTop: 1, borderColor: "divider" }}
              >
                <Typography variant="caption" color="text.secondary">
                  Antes de IVA
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "success.main" }}>
                  {priceFormat(liquidacion.valorLiquidacionAntesIva)}
                </Typography>
              </Box>
            </Paper>
          ))}
        </div>
        {showTotal && (
          <div className="mt-4 flex items-baseline justify-end gap-6">
            <Typography variant="caption" color="text.secondary">
              Liquidación Total:{" "}
              <Box component="span" sx={{ fontWeight: 500, color: "text.primary" }}>
                {priceFormat(totalGrupo)}
              </Box>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total antes de IVA:{" "}
              <Box component="span" sx={{ fontSize: "1rem", fontWeight: 600, color: "success.main" }}>
                {priceFormat(totalAntesIva)}
              </Box>
            </Typography>
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
