import AttachMoneyOutlined from "@mui/icons-material/AttachMoneyOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FactCheckOutlined from "@mui/icons-material/FactCheckOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import BadgeOutlined from "@mui/icons-material/BadgeOutlined";
import LogoutOutlined from "@mui/icons-material/LogoutOutlined";
import ManageAccountsOutlined from "@mui/icons-material/ManageAccountsOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import ShieldOutlined from "@mui/icons-material/ShieldOutlined";
import TableChartOutlined from "@mui/icons-material/TableChartOutlined";
import Box from "@mui/material/Box";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { SvgIconComponent } from "@mui/icons-material";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { linksSideBar } from "../../../LinkPages";
import { usePermissions } from "../../../context/PermissionsContext";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  expandedMenus: string[];
  onMenuToggle: (menuId: string) => void;
  onLogout: () => void;
}

const WIDTH = 256;
const COLLAPSED_WIDTH = 64;

const allNavigationItems: {
  id: keyof typeof linksSideBar;
  label: string;
  icon: SvgIconComponent;
}[] = [
  { id: "dashboard", label: "Dashboard", icon: HomeOutlined },
  { id: "usuarios", label: "Usuarios", icon: ManageAccountsOutlined },
  { id: "permisos", label: "Permisos", icon: ShieldOutlined },
  { id: "configuracion", label: "Configuración", icon: SettingsOutlined },
  { id: "clientes", label: "Clientes", icon: GroupsOutlined },
  { id: "personal", label: "Personal", icon: BadgeOutlined },
  {
    id: "programaciones",
    label: "Programaciones",
    icon: CalendarMonthOutlined,
  },
  { id: "servicios", label: "Servicios", icon: TableChartOutlined },
  { id: "tarifas", label: "Tarifas", icon: AttachMoneyOutlined },
  {
    id: "ordenes-servicio",
    label: "Ordenes de Servicio",
    icon: DescriptionOutlined,
  },
  { id: "liquidaciones", label: "Liquidaciones", icon: AttachMoneyOutlined },
  {
    id: "aprobacion-liquidaciones-ordenes",
    label: "Aprobación de Liquidaciones de Ordenes",
    icon: FactCheckOutlined,
  },
  {
    id: "exportaciones-base-facturacion",
    label: "Exportaciones Base de Facturación",
    icon: TableChartOutlined,
  },
];

const itemSx = {
  color: "inherit",
  "&:hover": { bgcolor: alpha("#fff", 0.12) },
  "&.Mui-selected, &.Mui-selected:hover": { bgcolor: alpha("#fff", 0.2) },
};

export function Sidebar({
  collapsed,
  onToggle,
  expandedMenus,
  onMenuToggle,
  onLogout,
}: SidebarProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { hasPermission, isSuperAdmin } = usePermissions();

  const navigationItems = allNavigationItems
    .filter((item) => isSuperAdmin || hasPermission(item.id))
    .map((item) => ({ ...item, subItems: linksSideBar[item.id] }));

  const isActive = (to: string) =>
    pathname === to || (to !== "/dashboard" && pathname.startsWith(`${to}/`));

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? COLLAPSED_WIDTH : WIDTH,
        flexShrink: 0,
        transition: (t) => t.transitions.create("width"),
        "& .MuiDrawer-paper": {
          position: "relative",
          width: collapsed ? COLLAPSED_WIDTH : WIDTH,
          overflowX: "hidden",
          transition: (t) => t.transitions.create("width"),
          bgcolor: "primary.main",
          color: "primary.contrastText",
          border: "none",
        },
      }}
    >
      <Box
        sx={{
          minHeight: 80,
          px: collapsed ? 1 : 3,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
        }}
      >
        {!collapsed && (
          <div>
            <Typography variant="h3" component="p" sx={{ fontWeight: 700 }}>
              SOFIA
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.75 }}>
              Panel Administrativo
            </Typography>
          </div>
        )}
        <IconButton
          onClick={onToggle}
          color="inherit"
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
        </IconButton>
      </Box>
      <Divider sx={{ borderColor: alpha("#fff", 0.15) }} />

      <List component="nav" sx={{ flex: 1, overflowY: "auto", py: 1 }}>
        {navigationItems.map((item) => {
          const hasSubmenu = item.subItems.length > 1;
          const open = expandedMenus.includes(item.id) && !collapsed;
          return (
            <Box component="li" key={item.id} sx={{ listStyle: "none" }}>
              <Tooltip title={collapsed ? item.label : ""} placement="right">
                <ListItemButton
                  sx={{ ...itemSx, px: collapsed ? 2.5 : 3 }}
                  selected={
                    !hasSubmenu && isActive(item.subItems[0].to as string)
                  }
                  onClick={() => {
                    if (!hasSubmenu) {
                      navigate({ to: item.subItems[0].to });
                    } else if (collapsed) {
                      // Contraído no hay espacio para el submenú: expandir y abrirlo
                      onToggle();
                      if (!expandedMenus.includes(item.id))
                        onMenuToggle(item.id);
                    } else {
                      onMenuToggle(item.id);
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
                    <item.icon fontSize="small" />
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: { variant: "body2", sx: { fontWeight: 500 } },
                      }}
                    />
                  )}
                  {hasSubmenu && !collapsed && (
                    <ExpandMore
                      fontSize="small"
                      sx={{
                        transition: "transform .2s",
                        transform: open ? "rotate(180deg)" : "none",
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
              {hasSubmenu && (
                <Collapse in={open} unmountOnExit>
                  <List disablePadding>
                    {item.subItems.map((subItem) => (
                      <ListItemButton
                        key={subItem.to}
                        selected={subItem.to === pathname}
                        onClick={() => navigate({ to: subItem.to })}
                        sx={{ ...itemSx, pl: 8.5, py: 0.75 }}
                      >
                        <ListItemText
                          primary={subItem.label}
                          slotProps={{ primary: { variant: "body2" } }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>

      <Divider sx={{ borderColor: alpha("#fff", 0.15) }} />
      <List sx={{ py: 1 }}>
        <Tooltip title={collapsed ? "Cerrar Sesión" : ""} placement="right">
          <ListItemButton
            onClick={onLogout}
            sx={{ ...itemSx, px: collapsed ? 2.5 : 3 }}
          >
            <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>
              <LogoutOutlined fontSize="small" />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Cerrar Sesión"
                slotProps={{
                  primary: { variant: "body2", sx: { fontWeight: 500 } },
                }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </List>
    </Drawer>
  );
}
