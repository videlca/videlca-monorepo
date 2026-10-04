import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { toast } from "sonner";
import type { CreateCorreoDto } from "../../api/dtos/clientes";
import { useEstadoOrden } from "../../api/queryFunctions/configuracion";
import { ButtonAction } from "./ButtonAction";
import { InputForm } from "./InputForm";

interface ConfiguracionCorreoProps {
  correos: CreateCorreoDto[];
  onCorreosChange: (correos: CreateCorreoDto[]) => void;
}

const emptyInput = { nombre: "", apellido: "", correo: "" };

export function ConfiguracionCorreo({
  correos,
  onCorreosChange,
}: ConfiguracionCorreoProps) {
  const [correoInput, setCorreoInput] = useState(emptyInput);
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());

  const { data: estadosOrdenServicio } = useEstadoOrden();
  const estadosActivos =
    estadosOrdenServicio?.data?.data?.filter((estado) => estado.estado) ?? [];

  const toggleEmailStates = (email: string) => {
    setExpandedEmails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(email)) {
        newSet.delete(email);
      } else {
        newSet.add(email);
      }
      return newSet;
    });
  };

  const handleAddCorreo = () => {
    if (correoInput.nombre.trim() === "") {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    if (correoInput.apellido.trim() === "") {
      toast.error("El apellido no puede estar vacío");
      return;
    }

    if (correoInput.correo.trim() === "") {
      toast.error("El correo electrónico no puede estar vacío");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoInput.correo)) {
      toast.error("Por favor ingrese un correo electrónico válido");
      return;
    }

    if (correos.some((c) => c.email === correoInput.correo.trim())) {
      toast.error("Este correo electrónico ya está configurado");
      return;
    }

    onCorreosChange([
      ...correos,
      {
        email: correoInput.correo.trim(),
        nombre: correoInput.nombre.trim(),
        apellido: correoInput.apellido.trim(),
        estados: [],
      },
    ]);
    setCorreoInput(emptyInput);
  };

  const handleEstadoChange = (
    email: string,
    idEstadoOrdenServicio: number,
    checked: boolean,
  ) => {
    onCorreosChange(
      correos.map((c) =>
        c.email === email
          ? {
              ...c,
              estados: checked
                ? [...c.estados, idEstadoOrdenServicio]
                : c.estados.filter((id) => id !== idEstadoOrdenServicio),
            }
          : c,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Formulario para añadir correos */}
      <Box
        className="flex flex-col gap-4 rounded-lg p-4"
        sx={{
          bgcolor: "background.default",
          border: 1,
          borderColor: "divider",
        }}
      >
        <InputForm
          label="Primer nombre responsable*"
          placeholder="Primer nombre responsable"
          type="text"
          id="primerNombreResponsable"
          value={correoInput.nombre}
          onChange={(e) =>
            setCorreoInput({ ...correoInput, nombre: e.target.value })
          }
        />
        <InputForm
          label="Apellido*"
          placeholder="Apellido"
          type="text"
          id="apellido"
          value={correoInput.apellido}
          onChange={(e) =>
            setCorreoInput({ ...correoInput, apellido: e.target.value })
          }
        />
        <InputForm
          label="Correo*"
          placeholder="Correo"
          type="email"
          id="correo"
          value={correoInput.correo}
          onChange={(e) =>
            setCorreoInput({ ...correoInput, correo: e.target.value })
          }
        />
        <div className="flex items-center justify-between gap-4">
          <Typography variant="body2" color="text.secondary">
            Presione el botón de "Añadir" para agregar un nuevo correo a la
            lista
          </Typography>
          <ButtonAction
            Icon={AddIcon}
            label="Añadir"
            type="button"
            onClick={handleAddCorreo}
          />
        </div>
      </Box>

      {/* Lista de correos configurados */}
      {correos.map((correo) => {
        const expanded = expandedEmails.has(correo.email);
        return (
          <Paper
            key={correo.email}
            variant="outlined"
            className="flex flex-col px-4 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {correo.email}
              </Typography>
              <div className="flex gap-1">
                <Tooltip
                  title={
                    expanded ? "Ocultar estados" : "Estados de notificación"
                  }
                >
                  <IconButton onClick={() => toggleEmailStates(correo.email)}>
                    <ExpandMore
                      fontSize="small"
                      sx={{
                        transition: "transform .2s",
                        transform: expanded ? "rotate(180deg)" : "none",
                      }}
                    />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Quitar correo">
                  <IconButton
                    color="error"
                    onClick={() =>
                      onCorreosChange(
                        correos.filter((c) => c.email !== correo.email),
                      )
                    }
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            </div>
            <Collapse in={expanded}>
              <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>
                Estados de Notificación{" "}
                <Typography
                  component="span"
                  variant="caption"
                  color="text.secondary"
                >
                  ({correo.estados.length} seleccionados)
                </Typography>
              </Typography>
              <div className="grid grid-cols-2 gap-2 py-2">
                {estadosActivos.map((estado) => (
                  <FormControlLabel
                    key={estado.idEstadoOrdenServicio}
                    sx={{ alignItems: "flex-start", m: 0 }}
                    control={
                      <Checkbox
                        size="small"
                        sx={{ pt: 0.25 }}
                        checked={(correo.estados || []).includes(
                          estado.idEstadoOrdenServicio,
                        )}
                        onChange={(e) =>
                          handleEstadoChange(
                            correo.email,
                            estado.idEstadoOrdenServicio,
                            e.target.checked,
                          )
                        }
                      />
                    }
                    label={
                      <div>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, textTransform: "capitalize" }}
                        >
                          {estado.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {estado.descripcion}
                        </Typography>
                      </div>
                    }
                  />
                ))}
              </div>
            </Collapse>
          </Paper>
        );
      })}
      {correos.length === 0 && (
        <Paper
          variant="outlined"
          sx={{
            py: 5,
            textAlign: "center",
            color: "text.secondary",
            bgcolor: "background.default",
          }}
        >
          <Typography variant="body2">No hay correos configurados</Typography>
        </Paper>
      )}
    </div>
  );
}
