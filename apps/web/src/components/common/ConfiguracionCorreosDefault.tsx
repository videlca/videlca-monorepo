import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { ButtonAction } from "./ButtonAction";
import { InputForm } from "./InputForm";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { toast } from "sonner";
import type { CreateCorreoDefaultDto } from "../../api/dtos/configuracion";
import { useEstadoOrden } from "../../api/queryFunctions/configuracion";
import { useEstadosApp } from "../../api/queryFunctions/configuracion/estado-app";
import { useCreateCorreoDefault } from "../../api/queryFunctions/configuracion/correos-defecto";

export function ConfiguracionCorreosDefault({
  setIsOpenAddCorreoDefault,
  correosPendientes,
  setCorreosPendientes: _setCorreosPendientes,
  onSaveSuccess: _onSaveSuccess,
}: {
  setIsOpenAddCorreoDefault: (isOpen: boolean) => void;
  correosPendientes: CreateCorreoDefaultDto[];
  setCorreosPendientes: (correos: CreateCorreoDefaultDto[]) => void;
  onSaveSuccess: () => void;
}) {
  const [correos, setCorreos] =
    useState<CreateCorreoDefaultDto[]>(correosPendientes);
  const [correoInput, setCorreoInput] = useState<CreateCorreoDefaultDto>({
    descripcion: "",
    email: "",
    estados: [],
    estadosApp: [],
  });
  // Auto-expand all existing emails to show their configured states
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(
    new Set(correosPendientes.map((c) => c.email)),
  );

  const { data: estadosOrdenServicio } = useEstadoOrden();
  const { data: estadosApp } = useEstadosApp();
  const { mutate: createCorreoDefault, isPending: isCreatingCorreoDefault } =
    useCreateCorreoDefault();

  // Sync correos state when correosPendientes changes
  useEffect(() => {
    setCorreos(correosPendientes);
    setExpandedEmails(new Set(correosPendientes.map((c) => c.email)));
  }, [correosPendientes]);

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
    // Validate required fields
    if (correoInput.descripcion.trim() === "") {
      toast.error("La descripción no puede estar vacía");
      return;
    }

    if (correoInput.email.trim() === "") {
      toast.error("El correo electrónico no puede estar vacío");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoInput.email)) {
      toast.error("Por favor ingrese un correo electrónico válido");
      return;
    }

    // Check if email already exists
    if (
      correos?.some(
        (correoGroup) => correoGroup.email === correoInput.email.trim(),
      )
    ) {
      toast.error("Este correo electrónico ya está configurado");
      return;
    }

    const newCorreo: CreateCorreoDefaultDto = {
      email: correoInput.email.trim(),
      descripcion: correoInput.descripcion.trim(),
      estados: [],
      estadosApp: [],
    };

    setCorreos([...correos, newCorreo]);
    // Auto-expand the newly added email
    setExpandedEmails((prev) => new Set([...prev, newCorreo.email]));
    setCorreoInput({
      descripcion: "",
      email: "",
      estados: [],
      estadosApp: [],
    });
  };

  const handleConfirmAndSaveChanges = () => {
    createCorreoDefault(
      {
        correos: [...correos],
      },
      {
        onSuccess: () => {
          setCorreos([]);
          setCorreoInput({
            descripcion: "",
            email: "",
            estados: [],
            estadosApp: [],
          });
          setExpandedEmails(new Set());
          setIsOpenAddCorreoDefault(false);
        },
      },
    );
  };

  const handleRemoveCorreo = (email: string) => {
    setCorreos(correos.filter((correoGroup) => correoGroup.email !== email));
    // Also remove from expanded state
    setExpandedEmails((prev) => {
      const newSet = new Set(prev);
      newSet.delete(email);
      return newSet;
    });
  };

  const handleEstadoChange = (
    email: string,
    idEstadoOrdenServicio: number,
    checked: boolean,
  ) => {
    setCorreos(
      correos?.map((correoGroup) =>
        correoGroup.email === email
          ? {
            ...correoGroup,
            estados: checked
              ? [...(correoGroup.estados || []), idEstadoOrdenServicio]
              : (correoGroup.estados || []).filter(
                (id) => id !== idEstadoOrdenServicio,
              ),
          }
          : correoGroup,
      ),
    );
  };

  const handleEstadoAppChange = (
    email: string,
    idEstadoApp: number,
    checked: boolean,
  ) => {
    setCorreos(
      correos.map((correoGroup) =>
        correoGroup.email === email
          ? {
            ...correoGroup,
            estadosApp: checked
              ? [...(correoGroup.estadosApp || []), idEstadoApp]
              : (correoGroup.estadosApp || []).filter(
                (id) => id !== idEstadoApp,
              ),
          }
          : correoGroup,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Formulario para añadir correos */}
      <Box
        className="flex flex-col gap-4 rounded-lg p-4"
        sx={{ bgcolor: "background.default", border: 1, borderColor: "divider" }}
      >
        <InputForm
          label="Descripción*"
          placeholder="Descripción del correo"
          type="text"
          id="descripcion"
          value={correoInput.descripcion}
          onChange={(e) =>
            setCorreoInput({
              ...correoInput,
              descripcion: e.target.value,
            })
          }
        />
        <InputForm
          label="Correo*"
          placeholder="Correo electrónico"
          type="email"
          id="email"
          value={correoInput.email}
          onChange={(e) =>
            setCorreoInput({
              ...correoInput,
              email: e.target.value,
            })
          }
        />
        <Typography variant="body2" color="text.secondary">
          Presione el botón de "Añadir" para agregar un nuevo correo a la lista
        </Typography>
        <div className="flex justify-end gap-2">
          <ButtonAction
            Icon={AddIcon}
            label="Añadir"
            type="button"
            color="blue-light"
            onClick={handleAddCorreo}
          />
          <ButtonAction
            Icon={CheckIcon}
            label="Confirmar y guardar cambios"
            type="button"
            onClick={handleConfirmAndSaveChanges}
            disabled={isCreatingCorreoDefault}
          />
        </div>
      </Box>

      {/* Lista de correos configurados */}
      <div className="flex h-full flex-col gap-2 overflow-y-auto">
        {correos.map((correo) => {
          const expanded = expandedEmails.has(correo.email);
          return (
            <Paper
              key={correo.email}
              variant="outlined"
              className="flex flex-col px-4 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {correo.email}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {correo.descripcion}
                  </Typography>
                </div>
                <div className="flex gap-1">
                  <Tooltip title={expanded ? "Ocultar estados" : "Estados de notificación"}>
                    <IconButton onClick={() => toggleEmailStates(correo.email)}>
                      <ExpandMoreIcon
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
                      onClick={() => handleRemoveCorreo(correo.email)}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
              <Collapse in={expanded}>
                <Typography variant="body2" sx={{ fontWeight: 500, mt: 1 }}>
                  Estados de Notificación{" "}
                  <Typography component="span" variant="caption" color="text.secondary">
                    (
                    {(correo.estados || []).length +
                      (correo.estadosApp || []).length}{" "}
                    seleccionados)
                  </Typography>
                </Typography>
                <div className="grid grid-cols-2 gap-2 py-2">
                  {estadosOrdenServicio?.data?.data
                    ?.filter((estado) => estado.estado) // Solo estados activos
                    .map((estado) => (
                      <EstadoCheckbox
                        key={estado.nombre}
                        nombre={estado.nombre}
                        descripcion={estado.descripcion}
                        checked={(correo.estados || []).includes(
                          estado.idEstadoOrdenServicio,
                        )}
                        onChange={(checked) =>
                          handleEstadoChange(
                            correo.email,
                            estado.idEstadoOrdenServicio,
                            checked,
                          )
                        }
                      />
                    ))}
                </div>
                <Divider />
                <div className="grid grid-cols-2 gap-2 py-2">
                  {estadosApp?.data?.data?.map((estado) => (
                    <EstadoCheckbox
                      key={estado.nombre}
                      nombre={estado.nombre}
                      descripcion={estado.descripcion}
                      checked={(correo.estadosApp || []).includes(
                        estado.idEstadoApp,
                      )}
                      onChange={(checked) =>
                        handleEstadoAppChange(
                          correo.email,
                          estado.idEstadoApp,
                          checked,
                        )
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
            sx={{ py: 5, textAlign: "center", color: "text.secondary", bgcolor: "background.default" }}
          >
            <Typography variant="body2">No hay correos configurados</Typography>
          </Paper>
        )}
      </div>
    </div>
  );
}

function EstadoCheckbox({
  nombre,
  descripcion,
  checked,
  onChange,
}: {
  nombre: string;
  descripcion?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <FormControlLabel
      sx={{ alignItems: "flex-start", m: 0 }}
      control={
        <Checkbox
          size="small"
          sx={{ pt: 0.25 }}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
      }
      label={
        <div>
          <Typography variant="body2" sx={{ fontWeight: 500, textTransform: "capitalize" }}>
            {nombre}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {descripcion}
          </Typography>
        </div>
      }
    />
  );
}
