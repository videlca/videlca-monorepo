import type { LinkProps } from "@tanstack/react-router";

interface LinkSideBar {
  to: LinkProps["to"];
  description?: string;
  label: string;
}

interface LinksSideBar {
  configuracion: LinkSideBar[];
  clientes: LinkSideBar[];
  permisos: LinkSideBar[];
  personal: LinkSideBar[];
  usuarios: LinkSideBar[];
}

export const linksSideBar: LinksSideBar = {
  configuracion: [
    {
      to: "/dashboard/configuracion/orden-servicio",
      label: "Orden de Servicio",
      description: "orden-servicio",
    },
    {
      to: "/dashboard/configuracion/tipo-personal",
      label: "Tipo de Personal",
      description: "tipo-personal",
    },
    {
      to: "/dashboard/configuracion/tipo-cliente",
      label: "Tipo de Cliente",
      description: "tipo-cliente",
    },
    {
      to: "/dashboard/configuracion/tipo-id",
      label: "Tipo de Identificación",
      description: "tipo-id",
    },
    {
      to: "/dashboard/configuracion/tipo-genero",
      label: "Tipo de Género",
      description: "tipo-genero",
    },
    {
      to: "/dashboard/configuracion/tipos-novedad",
      label: "Tipos de Novedad",
      description: "tipos-novedad",
    },
    {
      to: "/dashboard/configuracion/ubicacion",
      label: "Ubicación",
      description: "ubicacion",
    },
  ],
  clientes: [
    {
      to: "/dashboard/clientes",
      label: "Clientes",
      description: "clientes",
    },
    {
      to: "/dashboard/clientes/locaciones",
      label: "Locaciones",
      description: "locaciones",
    },
    {
      to: "/dashboard/clientes/segmentacion",
      label: "Segmentación",
      description: "segmentacion",
    },
    {
      to: "/dashboard/clientes/sub-segmentacion",
      label: "Sub-Segmentación",
      description: "sub-segmentacion",
    },
  ],
  permisos: [
    {
      to: "/dashboard/permisos",
      label: "Roles y Permisos",
      description: "roles-permisos",
    },
  ],
  personal: [
    {
      to: "/dashboard/personal",
      label: "Personal",
      description: "personal",
    },
    {
      to: "/dashboard/personal/novedades",
      label: "Novedades",
      description: "novedades",
    },
  ],
  usuarios: [
    {
      to: "/dashboard/usuarios",
      label: "Usuarios",
      description: "usuarios",
    },
  ],
};
