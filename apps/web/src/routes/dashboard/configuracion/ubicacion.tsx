import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { MapPin, PlusIcon } from "lucide-react";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Table from "../../../components/common/Table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { useModal } from "../../../hooks/useModal";
import type { Ciudad, Departamento, Pais, TableType } from "../../../types";

export const Route = createFileRoute("/dashboard/configuracion/ubicacion")({
  component: RouteComponent,
});

const ciudades: Ciudad[] = [
  {
    idCiudad: 1,
    descripcion: "Bogota",
    codigoCiudad: "BOG",
    estado: true,
    idDepartamento: {
      idDepartamento: 1,
      descripcion: "Cundinamarca",
      codigoDepartamento: "CUN",
      idPais: {
        idPais: 1,
        descripcion: "Colombia",
      },
    },
  },
];

const departamentos: Departamento[] = [
  {
    idDepartamento: 1,
    descripcion: "Cundinamarca",
    codigoDepartamento: "CUN",
    idPais: {
      idPais: 1,
      descripcion: "Colombia",
    },
  },
];

const paises: Pais[] = [
  {
    idPais: 1,
    descripcion: "Colombia",
  },
];

const columnsCiudades: ColumnDef<Ciudad>[] = [
  {
    header: "ID",
    accessorKey: "idCiudad",
  },
  {
    header: "Ciudad",
    accessorKey: "descripcion",
  },
  {
    header: "Departamento",
    accessorKey: "idDepartamento.descripcion",
  },
  {
    header: "Pais",
    accessorKey: "idDepartamento.idPais.descripcion",
  },
  {
    header: "Estado",
    accessorKey: "estado",
    cell: ({ row }) => {
      return (
        <span
          className={`rounded-full px-2 py-1 text-xs ${
            row.original.estado
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {row.original.estado ? "Activo" : "Inactivo"}
        </span>
      );
    },
  },
];

const columnsDepartamentos: ColumnDef<Departamento>[] = [
  {
    header: "ID",
    accessorKey: "idDepartamento",
  },
  {
    header: "Departamento",
    accessorKey: "descripcion",
  },
  {
    header: "Codigo departamento",
    accessorKey: "codigoDepartamento",
  },
  {
    header: "Pais",
    accessorKey: "idPais.descripcion",
  },
];

const columnsPaises: ColumnDef<Pais>[] = [
  {
    header: "ID",
    accessorKey: "idPais",
  },
  {
    header: "Pais",
    accessorKey: "descripcion",
  },
];

function RouteComponent() {
  const [activeTab, setActiveTab] = useState<TableType>("ciudades");
  const {
    showModal: showModalAgregarCiudad,
    hideModal: hideModalAgregarCiudad,
  } = useModal("agregar-ciudad-modal");
  const {
    showModal: showModalAgregarDepartamento,
    hideModal: hideModalAgregarDepartamento,
  } = useModal("agregar-departamento-modal");
  const { showModal: showModalAgregarPais, hideModal: hideModalAgregarPais } =
    useModal("agregar-pais-modal");

  const handleShowModalAgregarCiudad = () => {
    showModalAgregarCiudad(
      <div className="space-y-4">
        <p className="text-gray-600">Formulario para agregar una ciudad</p>
      </div>,
    );
  };

  const handleShowModalAgregarDepartamento = () => {
    showModalAgregarDepartamento(
      <div className="space-y-4">
        <p className="text-gray-600">Formulario para agregar un departamento</p>
      </div>,
    );
  };

  const handleShowModalAgregarPais = () => {
    showModalAgregarPais(
      <div className="space-y-4">
        <p className="text-gray-600">Formulario para agregar un pais</p>
      </div>,
    );
  };
  const tabs = [
    { id: "ciudades" as TableType, label: "Ciudades" },
    { id: "departamentos" as TableType, label: "Departamentos" },
    { id: "paises" as TableType, label: "Paises" },
  ];

  return (
    <Section>
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex cursor-pointer items-center space-x-2 border-b-2 px-1 py-4 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-col gap-8">
        {activeTab === "ciudades" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <ButtonAction
                Icon={PlusIcon}
                label="Agregar ciudad"
                onClick={handleShowModalAgregarCiudad}
              />
            </div>
            <Table
              data={ciudades}
              columns={columnsCiudades}
              enablePagination={true}
              pageSize={10}
              enableSorting={true}
            />
          </div>
        )}
        {activeTab === "departamentos" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <ButtonAction
                Icon={PlusIcon}
                label="Agregar departamento"
                onClick={handleShowModalAgregarDepartamento}
              />
            </div>
            <Table
              data={departamentos}
              columns={columnsDepartamentos}
              enablePagination={true}
              pageSize={10}
              enableSorting={true}
            />
          </div>
        )}
        {activeTab === "paises" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <ButtonAction
                Icon={PlusIcon}
                label="Agregar pais"
                onClick={handleShowModalAgregarPais}
              />
            </div>
            <Table
              data={paises}
              columns={columnsPaises}
              enablePagination={true}
              pageSize={10}
              enableSorting={true}
            />
          </div>
        )}
      </div>
    </Section>
  );
}
