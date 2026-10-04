import type { LinkProps } from "@tanstack/react-router";
import AccountCircleOutlined from "@mui/icons-material/AccountCircleOutlined";
import AssignmentIndOutlined from "@mui/icons-material/AssignmentIndOutlined";
import AttachMoneyOutlined from "@mui/icons-material/AttachMoneyOutlined";
import BadgeOutlined from "@mui/icons-material/BadgeOutlined";
import BarChartOutlined from "@mui/icons-material/BarChartOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import DescriptionOutlined from "@mui/icons-material/DescriptionOutlined";
import EditCalendarOutlined from "@mui/icons-material/EditCalendarOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import MailOutlined from "@mui/icons-material/MailOutlined";
import PaidOutlined from "@mui/icons-material/PaidOutlined";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import SettingsApplicationsOutlined from "@mui/icons-material/SettingsApplicationsOutlined";
import TableChartOutlined from "@mui/icons-material/TableChartOutlined";
import TuneOutlined from "@mui/icons-material/TuneOutlined";
import VerifiedUserOutlined from "@mui/icons-material/VerifiedUserOutlined";

interface LinkSideBar {
  to: LinkProps["to"];
  description?: string;
  label: string;
  icon?: React.ReactNode;
}

interface LinksSideBar {
  dashboard: LinkSideBar[];
  configuracion: LinkSideBar[];
  clientes: LinkSideBar[];
  permisos: LinkSideBar[];
  personal: LinkSideBar[];
  usuarios: LinkSideBar[];
  programaciones: LinkSideBar[];
  tarifas: LinkSideBar[];
  "ordenes-servicio": LinkSideBar[];
  servicios: LinkSideBar[];
  liquidaciones: LinkSideBar[];
  "aprobacion-liquidaciones-ordenes": LinkSideBar[];
  "exportaciones-base-facturacion": LinkSideBar[];
}

export const linksSideBar: LinksSideBar = {
  dashboard: [
    {
      to: "/dashboard",
      label: "Dashboard",
      description: "dashboard",
      icon: <HomeOutlined />,
    },
  ],
  configuracion: [
    {
      to: "/dashboard/configuracion/estado-orden-servicio",
      label: "Estado Orden de Servicio",
      description: "estado-orden-servicio",
      icon: <SettingsApplicationsOutlined />,
    },
    {
      to: "/dashboard/configuracion/tipo-personales",
      label: "Tipo de Personal",
      description: "tipo-personal",
      icon: <PersonOutlined />,
    },
    {
      to: "/dashboard/configuracion/tipo-cliente",
      label: "Tipo de Cliente",
      description: "tipo-cliente",
      icon: <AccountCircleOutlined />,
    },
    {
      to: "/dashboard/configuracion/tipo-id",
      label: "Tipo de Identificación",
      description: "tipo-id",
      icon: <AssignmentIndOutlined />,
    },
    {
      to: "/dashboard/configuracion/ubicacion",
      label: "Ubicación",
      description: "ubicacion",
      icon: <PlaceOutlined />,
    },
    {
      to: "/dashboard/configuracion/tipo-contrato",
      label: "Tipo de Contrato",
      description: "tipo-contrato",
      icon: <DescriptionOutlined />,
    },
    {
      to: "/dashboard/configuracion/correos-default",
      label: "Correos de aplicación",
      description: "correos-por-defecto",
      icon: <MailOutlined />,
    },
  ],
  clientes: [
    {
      to: "/dashboard/clientes",
      label: "Clientes",
      description: "clientes",
      icon: <GroupsOutlined />,
    },
  ],
  permisos: [
    {
      to: "/dashboard/permisos/roles",
      label: "Roles",
      description: "roles",
      icon: <DescriptionOutlined />,
    },
    {
      to: "/dashboard/permisos/roles-permisos",
      label: "Roles y Permisos",
      description: "roles-permisos",
      icon: <VerifiedUserOutlined />,
    },
  ],
  personal: [
    {
      to: "/dashboard/personal",
      label: "Personal",
      description: "personal",
      icon: <BadgeOutlined />,
    },
  ],
  usuarios: [
    {
      to: "/dashboard/usuarios",
      label: "Usuarios",
      description: "usuarios",
      icon: <PersonOutlined />,
    },
  ],
  programaciones: [
    {
      to: "/dashboard/programaciones",
      label: "Programaciones",
      description: "programaciones",
      icon: <CalendarMonthOutlined />,
    },
  ],
  tarifas: [
    {
      to: "/dashboard/tarifas/periodo",
      label: "Tarifa",
      description: "tarifa",
      icon: <CalendarMonthOutlined />,
    },
    {
      to: "/dashboard/tarifas/tipo-tarifa",
      label: "Tipo de Tarifa",
      description: "tipo-tarifa",
      icon: <AttachMoneyOutlined />,
    },
    {
      to: "/dashboard/tarifas/comparativa-periodos",
      label: "Comparativa de Periodos",
      description: "comparativa-periodos",
      icon: <BarChartOutlined />,
    },
  ],
  "ordenes-servicio": [
    {
      to: "/dashboard/ordenes-servicio",
      label: "Ordenes de Servicio",
      description: "ordenes-de-servicio",
      icon: <Inventory2Outlined />,
    },
    {
      to: "/dashboard/ordenes-servicio/identificadores-orden-servicio",
      label: "Identificadores de Orden de Servicio",
      description: "identificadores",
      icon: <TuneOutlined />,
    },
    {
      to: "/dashboard/ordenes-servicio/adicionales",
      label: "Adicionales",
      description: "adicionales",
      icon: <PaidOutlined />,
    },
  ],
  servicios: [
    {
      to: "/dashboard/servicios",
      label: "Servicios",
      description: "servicios",
      icon: <TableChartOutlined />,
    },
    {
      to: "/dashboard/servicios/configurar-horarios",
      label: "Configurar Horarios",
      description: "configurar-horarios",
      icon: <EditCalendarOutlined />,
    },
    {
      to: "/dashboard/servicios/tipo-servicio",
      label: "Tipo de Servicio",
      description: "tipo-servicio",
      icon: <TableChartOutlined />,
    },
    {
      to: "/dashboard/servicios/tipo-horario",
      label: "Tipo de Horario",
      description: "tipo-horario",
      icon: <ScheduleOutlined />,
    },
  ],
  liquidaciones: [
    {
      to: "/dashboard/liquidaciones",
      label: "Liquidaciones",
      description: "liquidaciones",
      icon: <AttachMoneyOutlined />,
    },
    {
      to: "/dashboard/liquidaciones/historial",
      label: "Historial",
      description: "historial",
      icon: <DescriptionOutlined />,
    },
    {
      to: "/dashboard/liquidaciones/comparar-cliente",
      label: "Comparar cliente",
      description: "comparar-cliente",
      icon: <BarChartOutlined />,
    },
  ],
  "aprobacion-liquidaciones-ordenes": [
    {
      to: "/dashboard/aprobacion-liquidaciones-ordenes",
      label: "Aprobación de Liquidaciones de Ordenes",
      description: "aprobacion-liquidaciones-ordenes",
      icon: <DescriptionOutlined />,
    },
  ],
  "exportaciones-base-facturacion": [
    {
      to: "/dashboard/exportaciones-base-facturacion/consolidacion",
      label: "Consolidación",
      description: "consolidacion",
      icon: <DescriptionOutlined />,
    },
    {
      to: "/dashboard/exportaciones-base-facturacion/archivos-interfase",
      label: "Archivos de Interfase",
      description: "archivos-interfase",
      icon: <DescriptionOutlined />,
    },
    {
      to: "/dashboard/exportaciones-base-facturacion/anexo-facturacion",
      label: "Anexo de Facturación",
      description: "anexo-facturacion",
      icon: <DescriptionOutlined />,
    },
  ],
};
