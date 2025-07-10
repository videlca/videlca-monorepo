import { PlusIcon } from "lucide-react";
import { ButtonAction } from "../../../common/ButtonAction";
import Table from "../../../common/Table";
import type { ColumnDef } from "@tanstack/react-table";
import type { Ciudad } from "../../../../types";
import { useState } from "react";
import { SimpleModal } from "../../../common/SimpleModal";

export const CiudadTab = () => {
  const [isCiudadModalOpen, setIsCiudadModalOpen] = useState(false);
  const handleShowModalAgregarCiudad = () => {
    setIsCiudadModalOpen(true);
  };
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
  return (
    <>
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

      {/* Modal para agregar ciudad */}
      <SimpleModal
        isOpen={isCiudadModalOpen}
        onClose={() => setIsCiudadModalOpen(false)}
        title="Agregar ciudad"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Formulario para agregar una ciudad</p>
        </div>
      </SimpleModal>
    </>
  );
};
