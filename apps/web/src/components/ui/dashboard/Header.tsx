import AccountCircleOutlined from "@mui/icons-material/AccountCircleOutlined";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useGetUsuarioByCookie } from "../../../api/queryFunctions/usuarios";

export function Header() {
  const { data: usuario } = useGetUsuarioByCookie();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const navigate = useNavigate();
  const nombre = usuario?.data?.primerNombre;

  const handleProfileClick = () => {
    navigate({ to: "/dashboard/perfil-usuario" });
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar sx={{ justifyContent: "flex-end" }}>
        <Button
          color="secondary"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          endIcon={
            <KeyboardArrowDown
              sx={{
                transition: "transform .2s",
                transform: anchorEl ? "rotate(180deg)" : "none",
              }}
            />
          }
          sx={{ gap: 1 }}
        >
          {nombre}
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: "primary.main",
              fontSize: "0.875rem",
            }}
          >
            {nombre?.charAt(0).toUpperCase()}
          </Avatar>
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={handleProfileClick}>
            <ListItemIcon>
              <AccountCircleOutlined fontSize="small" />
            </ListItemIcon>
            Perfil de Usuario
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
