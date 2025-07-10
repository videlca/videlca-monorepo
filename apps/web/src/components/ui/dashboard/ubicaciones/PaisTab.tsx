import { useState } from "react";
import type { Pais } from "../../../../types";
import { ButtonAction } from "../../../common/ButtonAction";
import { SimpleModal } from "../../../common/SimpleModal";
import Table from "../../../common/Table";
import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon } from "lucide-react";

export const PaisTab = () => {
  const [isPaisModalOpen, setIsPaisModalOpen] = useState(false);

  const handleShowModalAgregarPais = () => {
    setIsPaisModalOpen(true);
  };
  const paises: Pais[] = [
    {
      idPais: 1,
      descripcion: "Colombia",
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
  return (
    <>
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
      {/* Modal para agregar país */}
      <SimpleModal
        isOpen={isPaisModalOpen}
        onClose={() => setIsPaisModalOpen(false)}
        title="Agregar país"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Formulario para agregar un país</p>
        </div>
      </SimpleModal>
    </>
  );
};
