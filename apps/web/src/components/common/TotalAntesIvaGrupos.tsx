import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { GruposLiquidaciones } from "../../api/types";
import { priceFormat } from "../../utils/PriceFormat";

// Total antes de IVA de un grupo: el "antes de iva" no se guarda a nivel de grupo, solo por liquidacion
// (valorLiquidacionAntesIva), asi que se suma aca (o se usa el ya filtrado por tipo de servicio si viene)
export const totalAntesIvaGrupo = (grupo: GruposLiquidaciones) =>
  Number(
    grupo.totalAntesIvaFiltrado ??
      (grupo.liquidaciones ?? []).reduce(
        (acc, liquidacion) => acc + Number(liquidacion.valorLiquidacionAntesIva ?? 0),
        0,
      ),
  );

// RESUMEN CON EL TOTAL ANTES DE IVA DE TODOS LOS GRUPOS RECIBIDOS (historial y aprobacion de liquidaciones)
export const TotalAntesIvaGrupos = ({ grupos }: { grupos: GruposLiquidaciones[] }) => {
  const total = grupos.reduce((acc, grupo) => acc + totalAntesIvaGrupo(grupo), 0);

  return (
    <Paper
      variant="outlined"
      className="flex flex-wrap items-center justify-end gap-6 p-4"
    >
      <Typography
        variant="h5"
        component="p"
        sx={{ fontWeight: 700, color: "text.primary" }}
      >
        Total antes de IVA:{" "}
        <Box component="span" sx={{ fontWeight: 700, color: "success.main" }}>
          {priceFormat(total)}
        </Box>
      </Typography>
    </Paper>
  );
};
