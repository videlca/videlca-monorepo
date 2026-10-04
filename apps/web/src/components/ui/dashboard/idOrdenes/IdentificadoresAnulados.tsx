import FormLabel from "@mui/material/FormLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { muiRegister } from "../../../../utils/muiRegister";
import type { OrdenServicioIdAnulados } from "../../../../api/types/orden-servicio";
import { Section } from "../Section";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAnularIdOrdenServicio, useDeleteIdOrdenServicio, useGetIdsAnuladosOrdenServicio, useUpdateIdOrdenServicio } from "../../../../api/queryFunctions/orden-servicio/orden-servicio-id";
import { MoreActionsButton } from "../../common/MoreActionsButton";
import { ButtonAction } from "../../../common/ButtonAction";
import AddIcon from "@mui/icons-material/Add";
import Table from "../../../common/Table";
import { SimpleModal } from "../../../common/SimpleModal";
import { FormsModal } from "../../modals/FormsModal";
import { InputForm } from "../../../common/InputForm";
import { ConfirmarDelete } from "../../modals/ConfirmarDelete";
import type { ColumnDef } from "@tanstack/react-table";
import { usePrefijosTipoServicio } from "../../../../api/queryFunctions/servicios";
import { useServerPagination } from "../../../../hooks/useServerPagination";


export function IdentificadoresAnulados() {
    const [isOpenAdd, setIsOpenAdd] = useState(false);
    const [isOpenEdit, setIsOpenEdit] = useState(false);
    const [isOpenDelete, setIsOpenDelete] = useState(false);

    const [idOrdenServicioId, setIdOrdenServicioId] = useState<number | null>(
        null,
    );

    const {
        register: registerAdd,
        handleSubmit: handleSubmitAdd,
        reset: resetAdd,
    } = useForm<{ descripcionId: string; motivo?: string, consecutivo: string }>({
        defaultValues: {
            descripcionId: "",
            motivo: "",
            consecutivo: "",
        },
    });

    const {
        register: registerEdit,
        handleSubmit: handleSubmitEdit,
        reset: resetEdit,
        setValue: setValueEdit,
    } = useForm<{ descripcionId: string; motivo?: string, consecutivo: string }>({
        defaultValues: {
            descripcionId: "",
            consecutivo: "",
            motivo: "",
        },
    });

    // Paginación server-side
    const { page, setPage, pageSize, setPageSize, paginationParams } = useServerPagination(5);

    // Queries y mutaciones
    const { data: prefijosQuery } = usePrefijosTipoServicio();
    const { data: idsOrdenServicio } = useGetIdsAnuladosOrdenServicio(paginationParams);
    const {
        mutate: anularIdOrdenServicio,
        isPending: isAnulandoIdOrdenServicio,
    } = useAnularIdOrdenServicio();
    const {
        mutate: updateIdOrdenServicio,
        isPending: isUpdatingIdOrdenServicio,
    } = useUpdateIdOrdenServicio();
    const { mutate: deleteIdOrdenServicio } = useDeleteIdOrdenServicio();


    const columns: ColumnDef<OrdenServicioIdAnulados>[] = [
        {
            header: "Identificador",
            accessorKey: "descripcionId",
            cell: ({ row }) => {
                return (
                    <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: "nowrap" }}>
                        {row.original.descripcionId}
                    </Typography>
                );
            },
        },
        {
            header: "Motivo",
            accessorKey: "motivo",
            cell: ({ row }) => {
                return (
                    <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: "nowrap" }}>
                        {row.original.motivo}
                    </Typography>
                );
            },
        },
        {
            header: "Fecha de Creación",
            accessorKey: "fechaCreacion",
            cell: ({ row }) => {
                return (
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                        {row.original.fechaCreacion}
                    </Typography>
                );
            },
        },
        {
            header: "Acciones",
            accessorKey: "acciones",
            cell: ({ row }) => (
                <MoreActionsButton
                    menuId={`actions-${row.original.id}`}
                    actions={[
                        {
                            label: "Editar",
                            onClick: () => {
                                setIsOpenEdit(true);
                                setIdOrdenServicioId(row.original.id);
                                const prefijo = row.original.descripcionId.includes("-")
                                    ? row.original.descripcionId.split("-")[0]
                                    : row.original.descripcionId;
                                const consecutivo = row.original.consecutivo
                                    ? row.original.consecutivo.toString()
                                    : (row.original.descripcionId.split("-")[1] || "");
                                setValueEdit("descripcionId", prefijo);
                                setValueEdit("consecutivo", consecutivo);
                                setValueEdit("motivo", row.original.motivo || "");
                            },
                        },
                        {
                            label: "Eliminar",
                            onClick: () => {
                                setIsOpenDelete(true);
                                setIdOrdenServicioId(row.original.id);
                                console.log(row.original.id)
                            },
                            color: "red" as const,
                        },
                    ]}
                />
            ),
        },
    ];
    return (
        <Section>
            <div className="flex flex-col gap-8">
                <div className="flex justify-end">
                    <ButtonAction
                        Icon={AddIcon}
                        label="Anular identificador"
                        onClick={() => {
                            setIsOpenAdd(true);
                        }}
                    />
                </div>
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

            <SimpleModal
                isOpen={isOpenAdd}
                onClose={() => setIsOpenAdd(false)}
                title="Ingresar identificador de orden de servicio a anular"
                size="md"
            >
                <FormsModal
                    onSubmit={handleSubmitAdd((data) => {
                        anularIdOrdenServicio(
                            {
                                descripcionId: `${data.descripcionId}-${data.consecutivo}`,
                                consecutivo: Number(data.consecutivo || 0),
                                motivo: data.motivo
                            },
                            {
                                onSuccess: (data) => {
                                    if (data.status === 200 || data.status === 201) {
                                        setIsOpenAdd(false);
                                        resetAdd();
                                    }
                                },
                            },
                        );
                    })}
                    isLoading={isAnulandoIdOrdenServicio}
                    onCancel={() => {
                        setIsOpenAdd(false);
                        resetAdd();
                    }}
                    updating={false}
                >
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <FormLabel htmlFor="descripcionId" required sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                                Identificador de orden de servicio a anular
                            </FormLabel>
                            <div className="flex flex-row items-center gap-2">
                                <TextField
                                    select
                                    id="descripcionId"
                                    required
                                    {...muiRegister(registerAdd("descripcionId"))}
                                    slotProps={{ select: { native: true } }}
                                >
                                    <option value="">Seleccione un prefijo</option>
                                    {prefijosQuery?.data?.data?.map((prefijo) => (
                                        <option key={prefijo.prefijo} value={prefijo.prefijo}>
                                            {prefijo.prefijo}
                                        </option>
                                    )) || []}
                                </TextField>
                                <Typography color="text.secondary">-</Typography>
                                <TextField
                                    type="number"
                                    id="consecutivo"
                                    {...muiRegister(registerAdd("consecutivo"))}
                                />
                            </div>
                        </div>
                        <InputForm
                            type="text"
                            id="motivo"
                            label="Motivo"
                            placeholder="Motivo de anulación de orden de servicio"
                            required
                            {...registerAdd("motivo")}
                        />
                    </div>
                </FormsModal>
            </SimpleModal>

            <SimpleModal
                isOpen={isOpenEdit}
                onClose={() => setIsOpenEdit(false)}
                title="Editar identificador de orden de servicio"
            >
                <FormsModal
                    onSubmit={handleSubmitEdit((data) => {
                        updateIdOrdenServicio(
                            { id: idOrdenServicioId || 0, data: { descripcionId: `${data.descripcionId}-${data.consecutivo}`, consecutivo: Number(data.consecutivo || 0), motivo: data.motivo } },
                            {
                                onSuccess: (data) => {
                                    if (data.status === 200 || data.status === 201) {
                                        setIsOpenEdit(false);
                                        resetEdit();
                                    }
                                },
                            },
                        );
                    })}
                    isLoading={isUpdatingIdOrdenServicio}
                    onCancel={() => {
                        setIsOpenEdit(false);
                        resetEdit();
                    }}
                    updating={true}
                >
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1">
                            <FormLabel htmlFor="descripcionIdEdit" required sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                                Identificador de orden de servicio
                            </FormLabel>
                            <div className="flex flex-row items-center gap-2">
                                <TextField
                                    select
                                    id="descripcionIdEdit"
                                    required
                                    {...muiRegister(registerEdit("descripcionId"))}
                                    slotProps={{ select: { native: true } }}
                                >
                                    <option value="">Seleccione un prefijo</option>
                                    {prefijosQuery?.data?.data?.map((prefijo) => (
                                        <option key={prefijo.prefijo} value={prefijo.prefijo}>
                                            {prefijo.prefijo}
                                        </option>
                                    )) || []}
                                </TextField>
                                <Typography color="text.secondary">-</Typography>
                                <TextField
                                    type="number"
                                    id="consecutivoEdit"
                                    {...muiRegister(registerEdit("consecutivo"))}
                                />
                            </div>
                        </div>
                        <InputForm
                            type="text"
                            id="motivo"
                            label="Motivo"
                            placeholder="Motivo de anulación de orden de servicio"
                            required
                            {...registerEdit("motivo")}
                        />
                    </div>
                </FormsModal>
            </SimpleModal>

            <ConfirmarDelete
                isOpenDelete={isOpenDelete}
                text="¿Estás seguro de querer eliminar este identificador de orden de servicio?"
                onDelete={() => {
                    deleteIdOrdenServicio(
                        { id: idOrdenServicioId || 0 },
                        {
                            onSuccess: (data) => {
                                if (data.status === 200 || data.status === 201) {
                                    setIsOpenDelete(false);
                                }
                            },
                        },
                    );
                }}
                onClose={() => setIsOpenDelete(false)}
            />
        </Section>
    );
}