import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { format } from "date-fns";
import { useState } from "react";
import { usePermissions } from "../../../context/PermissionsContext";
import { EmptyState } from "../common/EmptyState";

export interface ObservacionItem {
  id: number;
  descripcion: string;
  fechaCreacion: string | Date;
  autor: { primerNombre: string; primerApellido: string };
}

const MAX_CARACTERES = 500;

const iniciales = (nombre?: string, apellido?: string) =>
  `${nombre?.charAt(0).toUpperCase() ?? ""}${apellido?.charAt(0).toUpperCase() ?? ""}`;

/** Lista de observaciones con formulario para agregar; la usan las observaciones de orden y de grupo */
export function ObservacionesPanel({
  observaciones,
  onCreate,
  createPending,
  onDelete,
  deletePending,
}: {
  observaciones: ObservacionItem[];
  onCreate: (descripcion: string, onSuccess: () => void) => void;
  createPending: boolean;
  onDelete: (id: number) => void;
  deletePending: boolean;
}) {
  const [newObservacion, setNewObservacion] = useState<string>("");
  const { currentUser } = usePermissions();
  const puedeEliminar = currentUser?.idRol.descripcion === "super-admin";

  return (
    <>
      {/* Comments List */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-6">
        {observaciones.length === 0 ? (
          <EmptyState
            icon={<ChatBubbleOutlineIcon />}
            title="No hay observaciones aún"
            description="Sé el primero en agregar una observación"
          />
        ) : (
          observaciones.map((observacion) => (
            <Paper
              key={observacion.id}
              variant="outlined"
              className="p-4"
              sx={{ bgcolor: "background.default" }}
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Avatar sx={{ width: 32, height: 32, fontSize: "0.875rem", bgcolor: "primary.main" }}>
                    {iniciales(observacion.autor.primerNombre, observacion.autor.primerApellido)}
                  </Avatar>
                  <div>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {`${observacion.autor.primerNombre} ${observacion.autor.primerApellido}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(observacion.fechaCreacion, "dd/MM/yyyy")}
                    </Typography>
                  </div>
                </div>
                {puedeEliminar && (
                  <Tooltip title="Eliminar observación">
                    <span>
                      <IconButton
                        color="error"
                        onClick={() => onDelete(observacion.id)}
                        disabled={deletePending}
                      >
                        {deletePending ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <DeleteOutlinedIcon fontSize="small" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </div>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                {observacion.descripcion}
              </Typography>
            </Paper>
          ))
        )}
      </div>

      {/* Add Observacion Form */}
      <Box className="flex gap-3 pt-6" sx={{ borderTop: 1, borderColor: "divider" }}>
        <Avatar sx={{ width: 32, height: 32, fontSize: "0.875rem", bgcolor: "success.main" }}>
          {iniciales(currentUser?.primerNombre, currentUser?.primerApellido)}
        </Avatar>
        <div className="flex-1">
          <TextField
            value={newObservacion}
            onChange={(e) => setNewObservacion(e.target.value)}
            placeholder="Agregar observación..."
            multiline
            rows={3}
            error={newObservacion.length > MAX_CARACTERES}
          />
          <div className="mt-3 flex items-center justify-between">
            <Typography
              variant="caption"
              color={newObservacion.length > MAX_CARACTERES ? "error" : "text.secondary"}
            >
              {newObservacion.length}/{MAX_CARACTERES} caracteres
            </Typography>
            <Button
              variant="contained"
              loading={createPending}
              disabled={!newObservacion.trim() || newObservacion.length > MAX_CARACTERES}
              onClick={() => onCreate(newObservacion.trim(), () => setNewObservacion(""))}
            >
              Agregar Observación
            </Button>
          </div>
        </div>
      </Box>
    </>
  );
}
