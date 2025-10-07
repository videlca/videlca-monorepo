import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import Table from "../../../components/common/Table";
import { useCorreosDefault } from "../../../api/queryFunctions/configuracion/correos-defecto";
import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PlusIcon } from "lucide-react";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { useState } from "react";
import { ConfiguracionCorreosDefault } from "../../../components/common/ConfiguracionCorreosDefault";
import type { CreateCorreoDefaultDto } from "../../../api/dtos";

export const Route = createFileRoute(
  "/dashboard/configuracion/correos-default",
)({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados
  const [isOpenAddCorreoDefault, setIsOpenAddCorreoDefault] = useState(false);

  const { data: correosDefault } = useCorreosDefault();

  const columns: ColumnDef<CreateCorreoDefaultDto>[] = [
    {
      accessorKey: "descripcion",
      header: "Descripción",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "estados",
      header: "Estados",
      cell: ({ row }) => {
        return (
          <span className="capitalize">
            {row.original.estados.map((estado) => estado.nombre).join(", ")}
          </span>
        );
      },
    },
    {
      accessorKey: "estadosApp",
      header: "Estados App",
      cell: ({ row }) => {
        return (
          <span className="capitalize">
            {row.original.estadosApp.map((estado) => estado.nombre).join(", ")}
          </span>
        );
      },
    },
  ];

  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="flex justify-end">
          <ButtonAction
            Icon={PlusIcon}
            label="Agregar correo por defecto"
            onClick={() => {
              setIsOpenAddCorreoDefault(true);
            }}
          />
        </div>
        <Table
          data={correosDefault?.data || []}
          columns={columns}
          enablePagination={true}
          pageSize={5}
          enableSorting={false}
          enableFiltering={true}
        />
      </div>
      <SimpleModal
        isOpen={isOpenAddCorreoDefault}
        onClose={() => {
          setIsOpenAddCorreoDefault(false);
        }}
        title="Agregar correo por defecto"
        size="3xl"
      >
        <ConfiguracionCorreosDefault
          setIsOpenAddCorreoDefault={setIsOpenAddCorreoDefault}
        />
      </SimpleModal>
    </Section>
  );
}
