import { createFileRoute } from "@tanstack/react-router";
import type { TipoServicio } from "../../../api/types/servicio";
import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PlusIcon } from "lucide-react";
import { Section } from "../../../components/ui/dashboard/Section";
import Table, { type ServerFilterColumn } from "../../../components/common/Table";
import {
  useCreateTipoServicio,
  useDeleteTipoServicio,
  useFilterTipoServicio,
  useTipoServicios,
  useUpdateTipoServicio,
} from "../../../api/queryFunctions/servicios/tipo-servicio";
import { StateLabel } from "../../../components/common/StateLabel";
import { useState } from "react";
import {
  type CreateTipoServicioDto,
  type UpdateTipoServicioDto,
  TipoServicioFilterColumn,
  type FilterTipoServicioDto,
} from "../../../api/dtos";
import { useForm } from "react-hook-form";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { InputForm } from "../../../components/common/InputForm";
import { CheckboxForm } from "../../../components/common/CheckboxForm";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";
import { useServerPagination } from "../../../hooks/useServerPagination";

export const Route = createFileRoute("/dashboard/servicios/tipo-servicio")({
  component: RouteComponent,
});

function RouteComponent() {
  // Estados
  const [isOpenAddTipoServicio, setIsOpenAddTipoServicio] = useState(false);
  const [isOpenEditTipoServicio, setIsOpenEditTipoServicio] = useState(false);
  const [isOpenDeleteTipoServicio, setIsOpenDeleteTipoServicio] =
    useState(false);
  const [idTipoServicio, setIdTipoServicio] = useState(0);

  const [filteredTipoServicios, setFilteredTipoServicios] = useState<TipoServicio[] | null>(null);
  const [currentFilter, setCurrentFilter] = useState<FilterTipoServicioDto | undefined>(undefined);

  // Paginación server-side
  const { page, setPage, pageSize, setPageSize, paginationParams } = useServerPagination(5);

  // Queries y Mutaciones
  const { data: tipoServicios } = useTipoServicios(paginationParams);
  const { mutate: crearTipoServicio, isPending: isLoadingCrearTipoServicio } =
    useCreateTipoServicio();
  const { mutate: editarTipoServicio, isPending: isLoadingEditarTipoServicio } =
    useUpdateTipoServicio();
  const { mutate: eliminarTipoServicio } = useDeleteTipoServicio();
  const { mutate: filterTipoServicio, isPending: isFilteringTipoServicios } =
    useFilterTipoServicio();

  // Formularios
  const {
    register: registerCrear,
    handleSubmit: handleSubmitCrear,
    reset: resetCrear,
  } = useForm<CreateTipoServicioDto>({
    defaultValues: {
      nombre: "",
      descripcion: "",
      prefijo: "",
      requierePersonal: false,
    },
  });

  const {
    register: registerEditar,
    handleSubmit: handleSubmitEditar,
    reset: resetEditar,
  } = useForm<UpdateTipoServicioDto>({
    defaultValues: {
      nombre: "",
      descripcion: "",
      prefijo: "",
      requierePersonal: false,
      estado: false,
    },
  });

  const columns: ColumnDef<TipoServicio>[] = [
    {
      header: "ID",
      accessorKey: "idTipoServicio",
    },
    {
      header: "Nombre",
      accessorKey: "nombre",
    },
    {
      header: "Descripción",
      accessorKey: "descripcion",
    },
    {
      header: "Prefijo",
      accessorKey: "prefijo",
      cell: ({ row }) => {
        return <span className="capitalize">{row.original.prefijo}</span>;
      },
    },
    {
      header: "Requiere personal",
      cell: ({ row }) => {
        return <StateLabel state={row.original.requierePersonal} />;
      },
    },
    // {
    //   header: "Estado",
    //   cell: ({ row }) => {
    //     return <StateLabel state={row.original.estado} />;
    //   },
    // },
    // {
    //   header: "Acciones",
    //   cell: ({ row }) => (
    //     <MoreActionsButton
    //       menuId={`actions-${row.original.idTipoServicio}`}
    //       actions={[
    //         {
    //           label: "Editar",
    //           onClick: () => {
    //             setIsOpenEditTipoServicio(true);
    //             setIdTipoServicio(row.original.idTipoServicio);
    //             resetEditar({
    //               nombre: row.original.nombre,
    //               descripcion: row.original.descripcion,
    //               prefijo: row.original.prefijo,
    //               requierePersonal: row.original.requierePersonal,
    //               estado: row.original.estado,
    //             });
    //           },
    //         },
    //         {
    //           label: "Eliminar",
    //           onClick: () => {
    //             setIdTipoServicio(row.original.idTipoServicio);
    //             setIsOpenDeleteTipoServicio(true);
    //           },
    //           color: "red" as const,
    //         },
    //       ]}
    //     />
    //   ),
    // },
  ];
  return (
    <Section>
      {/* <div className="flex justify-end">
        <ButtonAction
          Icon={PlusIcon}
          label="Agregar Tipo de Servicio"
          onClick={() => {
            setIsOpenAddTipoServicio(true);
          }}
        />
      </div> */}
      <Table
        columns={columns}
        data={filteredTipoServicios ?? tipoServicios?.data?.data ?? []}
        // serverPagination={!filteredTipoServicios}
        // totalRows={
        //   filteredTipoServicios
        //     ? filteredTipoServicios.length
        //     : (tipoServicios?.data?.pagination?.total ?? 0)
        // }
        // currentPage={page}
        // onPageChange={setPage}
        // onPageSizeChange={(size) => {
        //   setPageSize(size);
        //   setPage(0);
        // }}
        enableSorting={false}
        enablePagination={false}
        // pageSize={pageSize}
        // enableFiltering={true}
        // filterColumns={[
        //   { label: "Nombre", value: TipoServicioFilterColumn.NOMBRE },
        //   { label: "Descripción", value: TipoServicioFilterColumn.DESCRIPCION },
        //   { label: "Prefijo", value: TipoServicioFilterColumn.PREFIJO },
        // ] satisfies ServerFilterColumn[]}
        // onServerFilter={(column, query) => {
        //   const filter = { column: column as TipoServicioFilterColumn, query, pagination: false };
        //   setCurrentFilter(filter);
        //   filterTipoServicio(
        //     filter,
        //     {
        //       onSuccess: (data) => {
        //         setFilteredTipoServicios(data.data?.data ?? []);
        //       },
        //     },
        //   );
        // }}
        // onServerFilterClear={() => {
        //   setFilteredTipoServicios(null);
        //   setCurrentFilter(undefined);
        // }}
        // serverFilterLoading={isFilteringTipoServicios}
      />
      <SimpleModal
        isOpen={isOpenAddTipoServicio}
        onClose={() => {
          setIsOpenAddTipoServicio(false);
          resetCrear();
        }}
        title="Agregar Tipo de Servicio"
      >
        <FormsModal
          onSubmit={handleSubmitCrear((data) => {
            crearTipoServicio(data, {
              onSuccess: () => {
                setIsOpenAddTipoServicio(false);
                resetCrear();
              },
            });
          })}
          isLoading={isLoadingCrearTipoServicio}
          onCancel={() => {
            setIsOpenAddTipoServicio(false);
            resetCrear();
          }}
          updating={false}
        >
          <div className="flex flex-col gap-2">
            <InputForm
              label="Nombre"
              id="nombre"
              type="text"
              required
              placeholder="Nombre"
              {...registerCrear("nombre")}
            />
            <InputForm
              label="Descripción"
              id="descripcion"
              type="text"
              required
              placeholder="Descripción"
              {...registerCrear("descripcion")}
            />
            <InputForm
              label="Prefijo"
              id="prefijo"
              type="text"
              required
              placeholder="Prefijo"
              {...registerCrear("prefijo")}
            />
            <CheckboxForm
              label="Requiere personal"
              id="requierePersonal"
              required={false}
              {...registerCrear("requierePersonal")}
            />
          </div>
        </FormsModal>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenEditTipoServicio}
        onClose={() => setIsOpenEditTipoServicio(false)}
        title="Editar Tipo de Servicio"
      >
        <FormsModal
          onSubmit={handleSubmitEditar((data) => {
            editarTipoServicio(
              {
                id: idTipoServicio,
                data: {
                  ...data,
                  estado: String(data.estado) === "true",
                },
              },
              {
                onSuccess: () => {
                  setIsOpenEditTipoServicio(false);
                  resetEditar();
                  if (currentFilter) {
                    filterTipoServicio(currentFilter, {
                      onSuccess: (filterData) => {
                        setFilteredTipoServicios(filterData.data?.data ?? []);
                      },
                    });
                  }
                },
              },
            );
          })}
          isLoading={isLoadingEditarTipoServicio}
          onCancel={() => {
            setIsOpenEditTipoServicio(false);
            resetEditar();
          }}
          updating={true}
        >
          <div className="flex flex-col gap-2">
            <InputForm
              label="Nombre"
              id="nombre"
              type="text"
              required={false}
              placeholder="Nombre"
              {...registerEditar("nombre")}
            />
            <InputForm
              label="Descripción"
              id="descripcion"
              type="text"
              required={false}
              placeholder="Descripción"
              {...registerEditar("descripcion")}
            />
            <InputForm
              label="Prefijo"
              id="prefijo"
              type="text"
              required={false}
              placeholder="Prefijo"
              {...registerEditar("prefijo")}
            />
            <InputSelectStateBoolean
              label="Estado"
              id="estado"
              placeholder="Estado"
              {...registerEditar("estado")}
            />
            <CheckboxForm
              label="Requiere personal"
              id="requierePersonal"
              required={false}
              {...registerEditar("requierePersonal")}
            />
          </div>
        </FormsModal>
      </SimpleModal>
      <ConfirmarDelete
        isOpenDelete={isOpenDeleteTipoServicio}
        text="¿Estás seguro de querer eliminar este tipo de servicio?"
        onDelete={() => {
          eliminarTipoServicio(idTipoServicio, {
            onSuccess: () => {
              setIsOpenDeleteTipoServicio(false);
              setIdTipoServicio(0);
            },
          });
        }}
        onClose={() => {
          setIsOpenDeleteTipoServicio(false);
          setIdTipoServicio(0);
        }}
      />
    </Section>
  );
}
