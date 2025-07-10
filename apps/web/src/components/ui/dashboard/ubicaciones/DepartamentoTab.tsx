import { useState } from "react";
import type { Departamento } from "../../../../types";
import type { ColumnDef } from "@tanstack/react-table";
import Table from "../../../common/Table";
import { ButtonAction } from "../../../common/ButtonAction";
import { PlusIcon } from "lucide-react";
import { SimpleModal } from "../../../common/SimpleModal";

export const DepartamentoTab = () => {
  const [isDepartamentoModalOpen, setIsDepartamentoModalOpen] = useState(false);

  const handleShowModalAgregarDepartamento = () => {
    setIsDepartamentoModalOpen(true);
  };
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

  return (
    <>
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
      {/* Modal para agregar departamento */}
      <SimpleModal
        isOpen={isDepartamentoModalOpen}
        onClose={() => setIsDepartamentoModalOpen(false)}
        title="Agregar departamento"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Formulario para agregar un departamento
          </p>
        </div>
      </SimpleModal>
    </>
  );
};
