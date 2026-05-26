import type { OrdenServicio, OrdenServicioId } from "../../../../api/types/orden-servicio";
import { Section } from "../Section";
import { useState } from "react";
import { useGetIdsOrdenServicio } from "../../../../api/queryFunctions/orden-servicio/orden-servicio-id";
import { useGetOrdenServicioById } from "../../../../api/queryFunctions/orden-servicio";
import { MoreActionsButton } from "../../common/MoreActionsButton";
import Table from "../../../common/Table";
import type { ColumnDef } from "@tanstack/react-table";
import { OrdenDetalles } from "../../modals/OrdenDetalles";


export function IdentificadoresEmitidos() {
    const [isOpenDetails, setIsOpenDetails] = useState(false);
    const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrdenServicio | null>(null);

    // Queries y mutaciones
    const { data: idsOrdenServicio } = useGetIdsOrdenServicio();
    const { mutate: getOrdenServicio } = useGetOrdenServicioById();

    const columns: ColumnDef<OrdenServicioId>[] = [
        {
            header: "Identificador",
            accessorKey: "descripcionId",
            cell: ({ row }) => {
                return (
                    <span className="font-medium whitespace-nowrap text-gray-700">
                        {row.original.descripcionId}
                    </span>
                );
            },
        },
        {
            header: "Fecha de Creación",
            accessorKey: "fechaCreacion",
            cell: ({ row }) => {
                return (
                    <span className="text-sm whitespace-nowrap text-gray-500">
                        {row.original.fechaCreacion}
                    </span>
                );
            },
        },
        {
            header: "Acciones",
            accessorKey: "acciones",
            cell: ({ row }) => (
                <MoreActionsButton
                    menuId={`actions-${row.original.idOrdenServicioId}`}
                    actions={[
                        {
                            label: "Ver Orden",
                            onClick: () => {
                                getOrdenServicio(Number(row.original.idOrdenServicioId), {
                                    onSuccess: (data) => {
                                        setSelectedOrderDetail(data.data as OrdenServicio);
                                        setIsOpenDetails(true);
                                    }
                                });
                            },
                        },
                    ]}
                />
            ),
        },
    ];
    return (
        <Section>
            <div className="flex flex-col gap-8">
                <Table
                    columns={columns}
                    data={idsOrdenServicio?.data || []}
                    pageSize={5}
                    enableFiltering={false}
                    enablePagination={true}
                />
            </div>

            <OrdenDetalles
                isOpenDetails={isOpenDetails}
                setIsOpenDetails={setIsOpenDetails}
                selectedOrderDetail={selectedOrderDetail || ({} as OrdenServicio)}
                setSelectedOrderDetail={setSelectedOrderDetail}
            />
        </Section>
    );
}