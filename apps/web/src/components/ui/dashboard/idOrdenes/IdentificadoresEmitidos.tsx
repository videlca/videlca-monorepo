import type { OrdenServicio, OrdenServicioId } from "../../../../api/types/orden-servicio";
import { Section } from "../Section";
import { useState } from "react";
import { useGetIdsOrdenServicio } from "../../../../api/queryFunctions/orden-servicio/orden-servicio-id";
import { useGetOrdenServicioById } from "../../../../api/queryFunctions/orden-servicio";
import { MoreActionsButton } from "../../common/MoreActionsButton";
import Table from "../../../common/Table";
import type { ColumnDef } from "@tanstack/react-table";
import { OrdenDetalles } from "../../modals/OrdenDetalles";
import { useServerPagination } from "../../../../hooks/useServerPagination";


export function IdentificadoresEmitidos() {
    const [isOpenDetails, setIsOpenDetails] = useState(false);
    const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrdenServicio | null>(null);

    // Paginación server-side
    const { page, setPage, pageSize, setPageSize, paginationParams } = useServerPagination(5);

    // Queries y mutaciones
    const { data: idsOrdenServicio } = useGetIdsOrdenServicio(paginationParams);
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
                                if (row.original.ordenServicio?.idOrdenServicio) {
                                    getOrdenServicio(Number(row.original.ordenServicio.idOrdenServicio), {
                                        onSuccess: (data) => {
                                            setSelectedOrderDetail(data.data as OrdenServicio);
                                            setIsOpenDetails(true);
                                        }
                                    });
                                }
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
                    data={idsOrdenServicio?.data?.data || []}
                    serverPagination={true}
                    totalRows={idsOrdenServicio?.data?.pagination?.total ?? 0}
                    currentPage={page}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(0);
                    }}
                    pageSize={pageSize}
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