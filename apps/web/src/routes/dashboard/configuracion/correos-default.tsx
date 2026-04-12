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

// Type for the API response which includes populated relations
type CorreoDefaultResponse = Omit<
  CreateCorreoDefaultDto,
  "estados" | "estadosApp"
> & {
  estados: Array<{
    idEstadoOrdenServicio: number;
    nombre: string;
    descripcion: string;
  }>;
  estadosApp: Array<{
    idEstadoApp: number;
    nombre: string;
    descripcion: string;
  }>;
};

export const Route = createFileRoute(
  "/dashboard/configuracion/correos-default",
)({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados
  const [isOpenAddCorreoDefault, setIsOpenAddCorreoDefault] = useState(false);
  const [correosPendientes, setCorreosPendientes] = useState<
    CreateCorreoDefaultDto[]
  >([]);

  const { data: correosDefault } = useCorreosDefault();

  const handleAddCorreoDefault = () => {
    setIsOpenAddCorreoDefault(true);
    // Transform API response to CreateCorreoDefaultDto format
    const apiData = correosDefault?.data as unknown as CorreoDefaultResponse[];
    const transformedData: CreateCorreoDefaultDto[] =
      apiData?.map((correo) => ({
        descripcion: correo.descripcion,
        email: correo.email,
        estados: correo.estados.map((e) => e.idEstadoOrdenServicio),
        estadosApp: correo.estadosApp.map((e) => e.idEstadoApp),
      })) || [];
    setCorreosPendientes(transformedData);
  };

  const columns: ColumnDef<CorreoDefaultResponse>[] = [
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
            label="Agregar/Editar correos por defecto"
            onClick={() => {
              handleAddCorreoDefault();
            }}
          />
        </div>
        <Table
          data={
            (correosDefault?.data as unknown as CorreoDefaultResponse[]) || []
          }
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
          correosPendientes={correosPendientes}
          setCorreosPendientes={setCorreosPendientes}
          onSaveSuccess={() => {
            setCorreosPendientes([]);
          }}
        />
      </SimpleModal>
    </Section>
  );
}
