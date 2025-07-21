import type { LinkProps } from "@tanstack/react-router";
import {
  CalendarIcon,
  ChartColumn,
  DollarSignIcon,
  FileArchive,
  FileCogIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  HomeIcon,
  IdCardIcon,
  LucideCircleUserRound,
  MapPinIcon,
  ShieldCheckIcon,
  UserIcon,
  UserPenIcon,
  UsersIcon,
} from "lucide-react";

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
  reportes: LinkSideBar[];
  "ordenes-de-servicio": LinkSideBar[];
  servicios: LinkSideBar[];
}

export const linksSideBar: LinksSideBar = {
  dashboard: [
    {
      to: "/dashboard",
      label: "Dashboard",
      description: "dashboard",
      icon: <HomeIcon className="h-6 w-6" />,
    },
  ],
  configuracion: [
    {
      to: "/dashboard/configuracion/estado-orden-servicio",
      label: "Estado Orden de Servicio",
      description: "estado-orden-servicio",
      icon: <FileCogIcon className="h-6 w-6" />,
    },
    {
      to: "/dashboard/configuracion/tipo-personal",
      label: "Tipo de Personal",
      description: "tipo-personal",
      icon: <UserIcon className="h-6 w-6" />,
    },
    {
      to: "/dashboard/configuracion/tipo-cliente",
      label: "Tipo de Cliente",
      description: "tipo-cliente",
      icon: <LucideCircleUserRound className="h-6 w-6" />,
    },
    {
      to: "/dashboard/configuracion/tipo-id",
      label: "Tipo de Identificación",
      description: "tipo-id",
      icon: <IdCardIcon className="h-6 w-6" />,
    },
    // {
    //   to: "/dashboard/configuracion/tipo-genero",
    //   label: "Tipo de Género",
    //   description: "tipo-genero",
    // },
    // {
    //   to: "/dashboard/configuracion/tipos-novedad",
    //   label: "Tipos de Novedad",
    //   description: "tipos-novedad",
    //   icon: <FileTextIcon className="h-6 w-6" />,
    // },
    {
      to: "/dashboard/configuracion/ubicacion",
      label: "Ubicación",
      description: "ubicacion",
      icon: <MapPinIcon className="h-6 w-6" />,
    },
  ],
  clientes: [
    {
      to: "/dashboard/clientes",
      label: "Clientes",
      description: "clientes",
      icon: <UsersIcon className="h-6 w-6" />,
    },
  ],
  permisos: [
    {
      to: "/dashboard/permisos",
      label: "Roles y Permisos",
      description: "roles-permisos",
      icon: <ShieldCheckIcon className="h-6 w-6" />,
    },
  ],
  personal: [
    {
      to: "/dashboard/personal",
      label: "Personal",
      description: "personal",
      icon: <UserPenIcon className="h-6 w-6" />,
    },
    {
      to: "/dashboard/personal/novedades",
      label: "Novedades",
      description: "novedades",
      icon: <FileTextIcon className="h-6 w-6" />,
    },
  ],
  usuarios: [
    {
      to: "/dashboard/usuarios",
      label: "Usuarios",
      description: "usuarios",
      icon: <UserIcon className="h-6 w-6" />,
    },
  ],
  programaciones: [
    {
      to: "/dashboard/programaciones",
      label: "Programaciones",
      description: "programaciones",
      icon: <CalendarIcon className="h-6 w-6" />,
    },
  ],
  tarifas: [
    {
      to: "/dashboard/tarifas",
      label: "Tarifas",
      description: "tarifas",
      icon: <DollarSignIcon className="h-6 w-6" />,
    },
  ],
  reportes: [
    {
      to: "/dashboard/reportes",
      label: "Reportes",
      description: "reportes",
      icon: <ChartColumn className="h-6 w-6" />,
    },
  ],
  "ordenes-de-servicio": [
    {
      to: "/dashboard/ordenes-de-servicio",
      label: "Ordenes de Servicio",
      description: "ordenes-de-servicio",
      icon: <FileArchive className="h-6 w-6" />,
    },
  ],
  servicios: [
    {
      to: "/dashboard/servicios",
      label: "Servicios",
      description: "servicios",
      icon: <FileSpreadsheetIcon className="h-6 w-6" />,
    },
  ],
};
