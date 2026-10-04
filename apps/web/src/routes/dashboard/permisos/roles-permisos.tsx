import { createFileRoute } from "@tanstack/react-router";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useEffect, useState } from "react";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import { ButtonAction } from "../../../components/common/ButtonAction";
import {
  useGetRolesWithPermissions,
  useUpdateRole,
} from "../../../api/queryFunctions/permisos";
import { useGetModulos } from "../../../api/queryFunctions/permisos/modulos";
import type { Rol } from "../../../api/types";

export const Route = createFileRoute("/dashboard/permisos/roles-permisos")({
  component: RouteComponent,
});

function RouteComponent() {
  const [selectedRole, setSelectedRole] = useState<Rol | null>(null);
  const [grantedModules, setGrantedModules] = useState<string[]>([]);
  const [originalGrantedModules, setOriginalGrantedModules] = useState<
    string[]
  >([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  useEffect(() => {
    setGrantedModules([
      ...(selectedRole?.permissions?.map((p) => p.id.toString()) || []),
    ]);
    setOriginalGrantedModules([
      ...(selectedRole?.permissions?.map((p) => p.id.toString()) || []),
    ]);
    setHasChanges(false);
  }, [selectedRole]);

  useEffect(() => {
    const hasChanged =
      JSON.stringify(grantedModules.sort()) !==
      JSON.stringify(originalGrantedModules.sort());
    setHasChanges(hasChanged);
  }, [grantedModules, originalGrantedModules]);

  const toggleModuleAccess = (moduleId: string) => {
    setGrantedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId],
    );
  };

  const grantAllModules = () => {
    setGrantedModules(modulosData?.data?.data?.map((m) => m.id.toString()) || []);
  };

  const revokeAllModules = () => {
    setGrantedModules([]);
  };

  // queries y mutaciones
  const { data: rolesData } = useGetRolesWithPermissions();
  const { data: modulosData } = useGetModulos();

  const { mutate: updateRole } = useUpdateRole();

  const handleSavePermissions = () => {
    updateRole(
      {
        id: selectedRole?.id || 0,
        data: {
          permissionsIds: grantedModules.map((m) => parseInt(m)),
        },
      },
      {
        onSuccess: () => {
          setHasChanges(false);
          setShowSaveConfirm(false);
          setOriginalGrantedModules([...grantedModules]);
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Paper variant="outlined" className="p-4">
            <Typography variant="h5" component="h3" className="flex items-center gap-2" sx={{ mb: 2 }}>
              <GroupsOutlinedIcon fontSize="small" />
              Roles del Sistema
            </Typography>
            <List disablePadding className="flex flex-col gap-2">
              {rolesData?.data?.data?.map((role) => {
                const roleModuleCount =
                  selectedRole?.id === role.id
                    ? grantedModules.length
                    : role.permissions?.length || 0;
                return (
                  <ListItemButton
                    key={role.nombreRol}
                    selected={selectedRole?.id === role.id}
                    onClick={() =>
                      setSelectedRole({
                        id: role.id,
                        nombreRol: role.nombreRol,
                        descripcion: role.descripcion,
                        estado: role.estado,
                        permissions: role.permissions,
                      })
                    }
                    sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}
                  >
                    <ListItemText
                      primary={role.nombreRol}
                      secondary={`${roleModuleCount} de ${modulosData?.data?.data?.length} módulos`}
                      slotProps={{ primary: { sx: { fontWeight: 500 } } }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Paper>
        </div>

        <div className="lg:col-span-3">
          {selectedRole && (
            <Paper variant="outlined">
              <Box className="p-6" sx={{ borderBottom: 1, borderColor: "divider" }}>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <Typography variant="h3" component="h2">
                      Acceso a Módulos: {selectedRole?.nombreRol}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {grantedModules.length} de {modulosData?.data?.data?.length}{" "}
                      módulos
                    </Typography>
                  </div>
                  <Chip
                    label={hasChanges ? "Cambios pendientes" : "Guardado"}
                    color={hasChanges ? "warning" : "success"}
                    variant="outlined"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={grantAllModules}
                  >
                    Otorgar Todos
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={revokeAllModules}
                  >
                    Revocar Todos
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveOutlinedIcon />}
                    onClick={() => setShowSaveConfirm(true)}
                    disabled={!hasChanges}
                    sx={{ ml: "auto" }}
                  >
                    Guardar Cambios
                  </Button>
                </div>
              </Box>

              <div className="grid grid-cols-1 gap-3 p-6 md:grid-cols-2 lg:grid-cols-3">
                {modulosData?.data?.data?.map((module) => {
                  const hasAccess = grantedModules.includes(
                    module.id.toString(),
                  );

                  return (
                    <Paper
                      key={module.id}
                      variant="outlined"
                      sx={{
                        px: 1,
                        borderColor: hasAccess ? "success.main" : "divider",
                        bgcolor: (t) =>
                          hasAccess ? alpha(t.palette.success.main, 0.08) : "background.paper",
                      }}
                    >
                      <FormControlLabel
                        sx={{ width: "100%", m: 0, py: 0.5 }}
                        control={
                          <Checkbox
                            color="success"
                            checked={hasAccess}
                            onChange={() => toggleModuleAccess(module.id.toString())}
                          />
                        }
                        label={
                          <Typography sx={{ fontWeight: 500, textTransform: "capitalize" }}>
                            {module.nombre}
                          </Typography>
                        }
                      />
                    </Paper>
                  );
                })}
              </div>
            </Paper>
          )}
          {!selectedRole && (
            <Paper variant="outlined" sx={{ py: 10, textAlign: "center" }}>
              <Typography variant="h4" component="h2" color="text.secondary">
                Seleccione un rol para ver los permisos
              </Typography>
            </Paper>
          )}
        </div>
      </div>

      <Dialog
        open={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle className="flex items-center gap-2">
          <ShieldOutlinedIcon color="primary" />
          Confirmar Cambios de Acceso
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            ¿Está seguro de que desea guardar los cambios de acceso a módulos
            para el rol "{selectedRole?.nombreRol}"?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setShowSaveConfirm(false)}
          >
            Cancelar
          </Button>
          <ButtonAction
            label="Confirmar y Guardar"
            onClick={handleSavePermissions}
            Icon={CheckIcon}
            type="button"
          />
        </DialogActions>
      </Dialog>
    </div>
  );
}
