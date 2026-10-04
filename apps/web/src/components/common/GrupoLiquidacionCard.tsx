import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";
import type { GruposLiquidaciones } from "../../api/types";
import ButtonOrdenes from "./ButtonOrdenes";
import { OrdenServicioCard } from "./OrdenServicioCard";

/** Grupo de liquidación: cabecera (cliente, descripción, conteo, acciones) y sus órdenes plegables */
export function GrupoLiquidacionCard({
  group,
  actions,
}: {
  group: GruposLiquidaciones;
  actions?: ReactNode;
}) {
  const [hidden, setHidden] = useState(false);

  return (
    <Paper variant="outlined" sx={{ overflow: "hidden" }}>
      <Box
        className="flex flex-col items-center justify-between gap-4 p-4 md:flex-row"
        sx={{ bgcolor: "background.default", borderBottom: 1, borderColor: "divider" }}
      >
        <div>
          <Typography
            variant="h3"
            sx={{
              pb: 1,
              mb: 1,
              borderBottom: 1,
              borderColor: "divider",
              ...(!group.idCliente?.nombre && {
                color: "text.disabled",
                fontStyle: "italic",
              }),
            }}
          >
            {group.idCliente?.nombre || "Sin cliente"}
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div">
            <strong>Descripción:</strong> {group.descripcion}
            <br />
            <strong>Órdenes:</strong> {group.liquidaciones?.length || 0}
            <br />
            <strong>Creado:</strong>{" "}
            {group.fechaCreacion
              ? new Date(group.fechaCreacion).toLocaleDateString("es-ES")
              : ""}
          </Typography>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
          <ButtonOrdenes
            onClick={() => setHidden(!hidden)}
            color="gray"
            title={hidden ? "Mostrar órdenes" : "Ocultar órdenes"}
            icon={hidden ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
          >
            {hidden ? "Mostrar" : "Ocultar"}
          </ButtonOrdenes>
          {actions}
        </div>
      </Box>

      {!hidden && <OrdenServicioCard grupoLiquidacion={group} showTotal={true} />}
    </Paper>
  );
}
