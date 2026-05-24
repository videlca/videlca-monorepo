import {
  BarChart3,
  Calendar,
  CheckSquareIcon,
  ChevronRight,
  DollarSign,
  FileSpreadsheetIcon,
  FileText,
  HomeIcon,
  LogOut,
  Menu,
  Settings,
  Shield,
  User2,
  UserCog2,
  Users,
} from "lucide-react";
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

export function Sidebar({
  collapsed,
  onToggle,
  expandedMenus,
  onMenuToggle,
  onLogout,
}: SidebarProps) {
  const navigate = useNavigate();
  const pathname = useLocation();
  const { hasPermission, isSuperAdmin } = usePermissions();

  const allNavigationItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: HomeIcon,
      subItems: linksSideBar.dashboard,
      requiredPermission: "dashboard",
    },
    {
      id: "usuarios",
      label: "Usuarios",
      icon: UserCog2,
      subItems: linksSideBar.usuarios,
      requiredPermission: "usuarios",
    },
    {
      id: "permisos",
      label: "Permisos",
      icon: Shield,
      subItems: linksSideBar.permisos,
      requiredPermission: "permisos",
    },
    {
      id: "configuracion",
      label: "Configuración",
      icon: Settings,
      subItems: linksSideBar.configuracion,
      requiredPermission: "configuracion",
    },
    {
      id: "clientes",
      label: "Clientes",
      icon: Users,
      subItems: linksSideBar.clientes,
      requiredPermission: "clientes",
    },
    {
      id: "personal",
      label: "Personal",
      icon: User2,
      subItems: linksSideBar.personal,
      requiredPermission: "personal",
    },
    {
      id: "programaciones",
      label: "Programaciones",
      icon: Calendar,
      subItems: linksSideBar.programaciones,
      requiredPermission: "programaciones",
    },
    {
      id: "servicios",
      label: "Servicios",
      icon: FileSpreadsheetIcon,
      subItems: linksSideBar.servicios,
      requiredPermission: "servicios",
    },
    {
      id: "tarifas",
      label: "Tarifas",
      icon: DollarSign,
      subItems: linksSideBar.tarifas,
      requiredPermission: "tarifas",
    },
    {
      id: "ordenes-servicio",
      label: "Ordenes de Servicio",
      icon: FileText,
      subItems: linksSideBar["ordenes-servicio"],
      requiredPermission: "ordenes-servicio",
    },
    {
      id: "liquidaciones",
      label: "Liquidaciones",
      icon: DollarSign,
      subItems: linksSideBar.liquidaciones,
      requiredPermission: "liquidaciones",
    },
    {
      id: "aprobacion-liquidaciones-ordenes",
      label: "Aprobación de Liquidaciones de Ordenes",
      icon: CheckSquareIcon,
      subItems: linksSideBar["aprobacion-liquidaciones-ordenes"],
      requiredPermission: "aprobacion-liquidaciones-ordenes",
    },
    {
      id: "exportaciones-base-facturacion",
      label: "Exportaciones Base de Facturación",
      icon: FileSpreadsheetIcon,
      subItems: linksSideBar["exportaciones-base-facturacion"],
      requiredPermission: "exportaciones-base-facturacion",
    },
  ];

  // Filtrar los elementos de navegación basados en los permisos
  const navigationItems = allNavigationItems.filter(
    (item) => isSuperAdmin || hasPermission(item.requiredPermission || ""),
  );

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-64"} flex min-h-screen flex-col bg-blue-600 text-white transition-all duration-300 ease-in-out`}
    >
      <div
        className={`${collapsed ? "p-2" : "p-6"} flex min-h-[80px] items-center justify-between border-b border-blue-500`}
      >
        <div className={`${collapsed ? "hidden" : "block"} flex-1`}>
          <h1 className="text-xl font-bold">GEVID</h1>
          <p className="text-sm text-blue-200">Panel Administrativo</p>
        </div>
        <button
          onClick={onToggle}
          className={`flex-shrink-0 rounded p-2 transition-colors hover:bg-blue-500 ${collapsed ? "mx-auto" : ""}`}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <nav className="scrollbar-thin scrollbar-track-blue-700 scrollbar-thumb-blue-400 hover:scrollbar-thumb-blue-300 flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li
              key={item.id}
              className={`${
                // TODO: Verificar modulos de personal, hay un bug donde marca el "tipo-personales" y "personal"
                // pathname.pathname.includes(item.id) &&
                item.subItems.length < 1 && item.id !== "dashboard"
                  ? "bg-blue-500"
                  : ""
                }`}
            >
              <div>
                <button
                  onClick={() => {
                    if (item.subItems.length > 1) {
                      onMenuToggle(item.id);
                    } else {
                      navigate({
                        to: item.subItems[0].to,
                      });
                    }
                  }}
                  className={`flex w-full items-center justify-between px-6 py-3 text-left transition-colors hover:bg-blue-500`}
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center">
                    <item.icon className="mr-3 h-5 w-5" />
                    <span className={`${collapsed ? "hidden" : "block"}`}>
                      {item.label}
                    </span>
                  </div>
                  {item.subItems.length > 1 && !collapsed && (
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${expandedMenus.includes(item.id) ? "rotate-90" : ""}`}
                    />
                  )}
                </button>

                {item.subItems.length > 1 &&
                  expandedMenus.includes(item.id) &&
                  !collapsed && (
                    <ul className="mt-1 ml-6 space-y-1">
                      {item.subItems.map((subItem) => (
                        <li
                          key={subItem.to}
                          className={` ${subItem.to === pathname.pathname
                              ? "border-l-2 border-blue-300 bg-blue-500/40"
                              : ""
                            }`}
                        >
                          <button
                            onClick={() =>
                              navigate({
                                to: subItem.to,
                              })
                            }
                            className={`flex w-full items-center px-6 py-2 text-left text-sm transition-colors hover:bg-blue-500`}
                          >
                            <span className="ml-2">{subItem.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            </li>
          ))}
        </ul>
      </nav>

      <div className={`${collapsed ? "p-2" : "p-4"} border-t border-blue-500`}>
        <button
          onClick={onLogout}
          className="flex w-full items-center rounded px-2 py-3 text-left transition-colors hover:bg-blue-500"
          title={collapsed ? "Cerrar Sesión" : ""}
        >
          <LogOut className="mr-3 h-5 w-5" />
          <span className={`${collapsed ? "hidden" : "block"}`}>
            Cerrar Sesión
          </span>
        </button>
      </div>
    </aside>
  );
}
