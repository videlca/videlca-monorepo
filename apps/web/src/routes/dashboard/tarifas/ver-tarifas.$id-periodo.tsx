import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";
import { PageHeader } from "../../../components/ui/common/PageHeader";
import { PeriodoFacturacionChip } from "../../../components/ui/dashboard/tarifas/PeriodoFacturacionChip";
import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import { ButtonAction } from "../../../components/common/ButtonAction";
import Table from "../../../components/common/Table";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalculateOutlinedIcon from "@mui/icons-material/CalculateOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import type { ColumnDef } from "@tanstack/react-table";
import type { Tarifa } from "../../../api/types/periodo";
import {
  useActualizarTarifa,
  useDescargarExcel,
  useEliminarTarifa,
  useEnviarExcelPorCorreo,
  usePeriodoById,
  useTarifas,
  useTipoTarifa,
} from "../../../api/queryFunctions/tarifas";
import { StateLabel } from "../../../components/common/StateLabel";
import { useMemo, useState } from "react";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { useForm } from "react-hook-form";
import type { UpdateTarifaDto } from "../../../api/dtos";
import { InputSelect } from "../../../components/common/InputSelect";
import { InputPrice } from "../../../components/common/InputPrice";
import { InputSelectStateBoolean } from "../../../components/common/InputSelectState";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { priceCalculate, priceFormat } from "../../../utils/PriceFormat";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";
import { EnvioCorreos } from "../../../components/ui/modals/EnvioCorreos";

export const Route = createFileRoute(
  "/dashboard/tarifas/ver-tarifas/$id-periodo",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { "id-periodo": idPeriodoParam } = useParams({
    from: "/dashboard/tarifas/ver-tarifas/$id-periodo",
  });
  const { data: periodo } = usePeriodoById(Number(idPeriodoParam));
  // Estados
  const [isOpenSeeTarifa, setIsOpenSeeTarifa] = useState(false);
  const [isOpenEditTarifa, setIsOpenEditTarifa] = useState(false);
  const [isOpenDeleteTarifa, setIsOpenDeleteTarifa] = useState(false);
  const [tarifaSelected, setTarifaSelected] = useState<Tarifa | null>(null);
  const [isOpenSendExcel, setIsOpenSendExcel] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Queries y Mutaciones
  const { data: tarifas } = useTarifas(Number(idPeriodoParam));
  const { data: tiposTarifa } = useTipoTarifa();
  const { mutate: eliminarTarifa } = useEliminarTarifa();
  const { mutate: actualizarTarifa, isPending: isLoadingActualizarTarifa } =
    useActualizarTarifa();

  // Generacion de archivos
  const {
    mutate: enviarExcelPorCorreo,
    isPending: isLoadingEnviarExcelPorCorreo,
  } = useEnviarExcelPorCorreo();
  const { mutate: descargarExcel } = useDescargarExcel();

  // Formularios
  const {
    register,
    control,
    handleSubmit,
    reset,
  } = useForm<UpdateTarifaDto>({
    defaultValues: {
      idPeriodo: Number(idPeriodoParam),
      idServicio: 0,
      idTipoTarifa: 0,
      precioAntesIva: 0,
      aui: 0,
      costosDirectos: 0,
      seguroVida: 0,
      costosDirectosSeguroVida: 0,
      iva: 0,
      precioTotal: 0,
      estado: false,
    },
  });

  const onSubmitUpdate = (data: UpdateTarifaDto) => {
    const { iva, precioTotal, precioAntesIva, costosDirectosSeguroVida } =
      priceCalculate(
        Number(data.costosDirectos),
        Number(data.seguroVida),
        Number(data.aui),
      );
    actualizarTarifa(
      {
        id: tarifaSelected?.idTarifa || 0,
        data: {
          ...data,
          idTipoTarifa: Number(data.idTipoTarifa),
          iva,
          precioTotal,
          precioAntesIva,
          costosDirectosSeguroVida,
          estado: String(data.estado) === "true",
        },
      },
      {
        onSuccess: () => {
          setIsOpenEditTarifa(false);
          setTarifaSelected(null);
        },
      },
    );
  };

  const handleDownloadExcel = (idPeriodo: number) => {
    descargarExcel(idPeriodo);
  };

  const columns: ColumnDef<Tarifa>[] = [
    {
      header: "Servicio",
      accessorKey: "idServicio.codigo",
      cell: ({ row }) => {
        return (
          <div className="flex flex-col text-left">
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {row.original.idServicio?.codigo || "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {row.original.idServicio?.descripcion || "-"}
            </Typography>
          </div>
        );
      },
    },
    {
      header: "Periodo",
      accessorKey: "idPeriodo.nombre",
      cell: ({ row }) => {
        return (
          <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "nowrap", textAlign: "left" }}>
            {row.original.idPeriodo?.nombre || "-"}
          </Typography>
        );
      },
    },
    {
      header: "Seguro de vida",
      accessorKey: "seguroVida",
      cell: ({ row }) => {
        return (
          <Precio>
            {priceFormat(row.original.seguroVida || 0)}
          </Precio>
        );
      },
    },
    {
      header: "AUI",
      accessorKey: "aui",
      cell: ({ row }) => {
        return (
          <Precio>
            {priceFormat(row.original.aui || 0)}
          </Precio>
        );
      },
    },
    {
      header: "Costos directos",
      accessorKey: "costosDirectos",
      cell: ({ row }) => {
        return (
          <Precio>
            {priceFormat(row.original.costosDirectos || 0)}
          </Precio>
        );
      },
    },
    {
      header: "Costos directos + seguro de vida",
      accessorKey: "costosDirectosSeguroVida",
      cell: ({ row }) => {
        return (
          <Precio>
            {priceFormat(row.original.costosDirectosSeguroVida || 0)}
          </Precio>
        );
      },
    },
    {
      header: "Precio sin IVA",
      accessorKey: "precioAntesIva",
      cell: ({ row }) => {
        return (
          <Precio>
            {priceFormat(row.original.precioAntesIva || 0)}
          </Precio>
        );
      },
    },
    {
      header: "IVA",
      accessorKey: "iva",
      cell: ({ row }) => {
        return (
          <Precio>
            {priceFormat(row.original.iva || 0)}
          </Precio>
        );
      },
    },
    {
      header: "Precio total",
      accessorKey: "precioTotal",
      cell: ({ row }) => {
        return (
          <Precio>
            {priceFormat(row.original.precioTotal || 0)}
          </Precio>
        );
      },
    },
    {
      header: "Acciones",
      cell: ({ row }) => {
        return (
          <MoreActionsButton
            menuId={`actions-${row.original.idTarifa}`}
            actions={[
              {
                label: "Ver",
                onClick: () => {
                  setIsOpenSeeTarifa(true);
                  setTarifaSelected(row.original);
                },
              },
            ]}
          />
        );
      },
    },
  ];

  const serviciosData = useMemo(
    () => Object.entries(tarifas?.data || []),
    [tarifas?.data],
  );
  const hasServicios = serviciosData.length > 0;

  return (
    <Section>
      <PageHeader
        title={
          <>
            Periodo {periodo?.data?.anioInicio}
            <PeriodoFacturacionChip activo={!!periodo?.data?.periodoActivoFacturacion} />
          </>
        }
        description={periodo?.data?.nombre}
        actions={
          <>
              <ButtonAction
                Icon={ArrowBackIcon}
                label="Volver"
                color="blue-light"
                type="button"
                onClick={() => {
                  navigate({
                    to: "/dashboard/tarifas/periodo",
                  });
                }}
              />
              {hasServicios && (
                <>
                  <ButtonAction
                    Icon={TableChartOutlinedIcon}
                    label="Descargar Excel"
                    onClick={() => {
                      handleDownloadExcel(Number(idPeriodoParam));
                    }}
                    color="green-light"
                  />
                  <ButtonAction
                    Icon={MailOutlinedIcon}
                    label="Enviar por correo"
                    onClick={() => {
                      setIsOpenSendExcel(true);
                    }}
                    color="yellow-light"
                  />
                </>
              )}
              <ButtonAction
                Icon={SettingsOutlinedIcon}
                label="Configurar Servicios para este periodo"
                onClick={() => {
                  navigate({
                    to: "/dashboard/tarifas/configurar-servicios/$id-periodo",
                    params: {
                      "id-periodo": idPeriodoParam,
                    },
                  });
                }}
              />
          </>
        }
      />

      <div className="flex flex-col gap-6">
        {!hasServicios ? (
          <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
            <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
              No hay tarifas configuradas para este periodo.
            </Typography>
          </Paper>
        ) : (
          serviciosData.map(([key, value]: [string, any]) => {
            const isCollapsed = collapsedGroups.has(key);
            return (
              <div key={key} className="flex flex-col gap-2">
                <ButtonBase
                  className="flex items-center gap-1 self-start"
                  sx={{ borderRadius: 1, px: 0.5 }}
                  onClick={() => {
                    setCollapsedGroups((prev) => {
                      const next = new Set(prev);
                      if (next.has(key)) {
                        next.delete(key);
                      } else {
                        next.add(key);
                      }
                      return next;
                    });
                  }}
                >
                  {isCollapsed ? (
                    <ChevronRightIcon color="primary" />
                  ) : (
                    <ExpandMoreIcon color="primary" />
                  )}
                  <Typography variant="h4" component="h2" color="primary">
                    {key}
                  </Typography>
                </ButtonBase>
                {!isCollapsed && (
                  <Table
                    columns={columns}
                    data={value || []}
                    pageSize={200}
                    enablePagination={false}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* TODO: mostrar datos de la tarifa */}
      <SimpleModal
        isOpen={isOpenSeeTarifa}
        onClose={() => setIsOpenSeeTarifa(false)}
        title="Ver detalles de la tarifa"
        size="2xl"
      >
        <div className="flex flex-col gap-6">
          <DetalleSeccion icon={<CalculateOutlinedIcon />} titulo="Información General">
            <Campo label="ID Tarifa" valor={tarifaSelected?.idTarifa} />
            <Campo
              label="Fecha Creación"
              valor={
                tarifaSelected?.fechaCreacion
                  ? new Date(tarifaSelected.fechaCreacion).toLocaleString("es-ES")
                  : "-"
              }
            />
            <Campo label="Tipo de Tarifa" valor={tarifaSelected?.idTipoTarifa?.nombre || "-"} />
            <Campo
              label="Última Actualización"
              valor={
                tarifaSelected?.fechaActualizacion
                  ? new Date(tarifaSelected.fechaActualizacion).toLocaleString("es-ES")
                  : "-"
              }
            />
            <Campo
              label="Estado"
              valor={<SiNoChip valor={!!tarifaSelected?.estado} si="Activa" no="Inactiva" />}
            />
          </DetalleSeccion>

          <DetalleSeccion icon={<CalendarMonthOutlinedIcon />} titulo="Periodo">
            <Campo label="Nombre" valor={tarifaSelected?.idPeriodo?.nombre || "-"} />
            <Campo
              label="Mes Inicio"
              valor={`${tarifaSelected?.idPeriodo?.mesInicio}/${tarifaSelected?.idPeriodo?.anioInicio}`}
            />
            <Campo
              label="Fecha Inicio"
              valor={
                tarifaSelected?.idPeriodo?.fechaInicio
                  ? new Date(tarifaSelected.idPeriodo.fechaInicio).toLocaleDateString("es-ES")
                  : "-"
              }
            />
            <Campo
              label="Mes Fin"
              valor={`${tarifaSelected?.idPeriodo?.mesFin}/${tarifaSelected?.idPeriodo?.anioFin}`}
            />
            <Campo
              label="Fecha Fin"
              valor={
                tarifaSelected?.idPeriodo?.fechaFin
                  ? new Date(tarifaSelected.idPeriodo.fechaFin).toLocaleDateString("es-ES")
                  : "-"
              }
            />
            <Campo
              label="Activo para Facturación"
              valor={<SiNoChip valor={!!tarifaSelected?.idPeriodo?.periodoActivoFacturacion} />}
            />
          </DetalleSeccion>

          <DetalleSeccion icon={<SettingsOutlinedIcon />} titulo="Servicio">
            <Campo label="Código" valor={tarifaSelected?.idServicio?.codigo || "-"} />
            <Campo
              label="Tipo de Horario"
              valor={tarifaSelected?.idServicio?.idTipoHorarioDescripcion?.nombre || "-"}
            />
            <Campo label="Descripción" valor={tarifaSelected?.idServicio?.descripcion || "-"} />
            <Campo
              label="Estado del Servicio"
              valor={<SiNoChip valor={!!tarifaSelected?.idServicio?.estado} si="Activo" no="Inactivo" />}
            />
            <Campo
              label="Tipo de Servicio"
              valor={tarifaSelected?.idServicio?.idTipoServicio?.descripcion || "-"}
            />
            <Campo
              label="Tipo de Duración"
              valor={tarifaSelected?.idServicio?.idTipoDuracion?.descripcion || "-"}
            />
          </DetalleSeccion>

          <div>
            <Typography variant="h5" component="h3" className="flex items-center gap-2" sx={{ mb: 1.5 }}>
              <AttachMoneyIcon color="primary" fontSize="small" />
              Precios
            </Typography>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <PrecioTile label="Precio Sin IVA" valor={priceFormat(tarifaSelected?.precioAntesIva || 0)} />
              <PrecioTile label="IVA (19%)" valor={priceFormat(tarifaSelected?.iva || 0)} />
              <PrecioTile label="Precio Total" valor={priceFormat(tarifaSelected?.precioTotal || 0)} total />
            </div>
          </div>
        </div>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenEditTarifa}
        onClose={() => {
          setIsOpenEditTarifa(false);
          setTarifaSelected(null);
        }}
        title="Editar Tarifa"
        size="xl"
      >
        <FormsModal
          updating={true}
          onCancel={() => {
            setIsOpenEditTarifa(false);
            setTarifaSelected(null);
          }}
          isLoading={isLoadingActualizarTarifa}
          onSubmit={handleSubmit(onSubmitUpdate)}
        >
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Selección de Periodo y Servicio */}
              <div className="flex flex-col gap-4">
                <Typography variant="h5" component="h3" sx={{ pb: 1, borderBottom: 1, borderColor: "divider" }}>
                  Periodo y Servicio
                </Typography>
                <InputSelect
                  label="Tipo de tarifa"
                  options={
                    (Array.isArray(tiposTarifa?.data)
                      ? tiposTarifa.data
                      : (tiposTarifa?.data as any)?.data || []
                    ).map((tipo: any) => ({
                      id: tipo.idTipoTarifa,
                      descripcion: tipo.nombre,
                    })) || []
                  }
                  placeholder="Seleccione un tipo de tarifa"
                  id="idTipoTarifa"
                  control={control}
                  name="idTipoTarifa"
                  valueAsNumber
                />
                <InputSelectStateBoolean
                  label="Estado"
                  id="estado"
                  placeholder="Seleccione un estado"
                  {...register("estado")}
                />
              </div>

              {/* Información de Precios */}
              <div className="flex flex-col gap-4">
                <Typography variant="h5" component="h3" sx={{ pb: 1, borderBottom: 1, borderColor: "divider" }}>
                  Información de Precios
                </Typography>
                <InputPrice
                  size="full"
                  label="Costos Directos:"
                  id="costosDirectos"
                  {...register("costosDirectos")}
                />
                <InputPrice
                  size="full"
                  label="Seguro de Vida:"
                  id="seguroVida"
                  {...register("seguroVida")}
                />
                <InputPrice
                  size="full"
                  label="AUI:"
                  id="aui"
                  {...register("aui")}
                />
              </div>
            </div>
          </div>
        </FormsModal>
      </SimpleModal>

      <EnvioCorreos
        isOpen={isOpenSendExcel}
        setIsOpen={setIsOpenSendExcel}
        id={Number(idPeriodoParam)}
        mutationEmail={enviarExcelPorCorreo}
        envioCorreoPending={isLoadingEnviarExcelPorCorreo}
      />

      <ConfirmarDelete
        isOpenDelete={isOpenDeleteTarifa}
        text="¿Estás seguro de querer eliminar esta tarifa?"
        onDelete={() => {
          eliminarTarifa(tarifaSelected?.idTarifa || 0, {
            onSuccess: () => {
              setIsOpenDeleteTarifa(false);
              setTarifaSelected(null);
            },
          });
        }}
        onClose={() => setIsOpenDeleteTarifa(false)}
      />
    </Section>
  );
}

const Precio = ({ children }: { children: ReactNode }) => (
  <Typography
    variant="body2"
    sx={{ fontWeight: 500, whiteSpace: "nowrap", color: "success.dark" }}
  >
    {children}
  </Typography>
);

const SiNoChip = ({
  valor,
  si = "Sí",
  no = "No",
}: {
  valor: boolean;
  si?: string;
  no?: string;
}) => (
  <Chip size="small" color={valor ? "success" : "error"} variant="outlined" label={valor ? si : no} />
);

const DetalleSeccion = ({
  icon,
  titulo,
  children,
}: {
  icon: ReactNode;
  titulo: string;
  children: ReactNode;
}) => (
  <div>
    <Typography
      variant="h5"
      component="h3"
      className="flex items-center gap-2"
      sx={{ mb: 1.5, "& svg": { color: "primary.main", fontSize: 20 } }}
    >
      {icon}
      {titulo}
    </Typography>
    <div className="grid grid-cols-1 gap-x-4 gap-y-1 md:grid-cols-2">{children}</div>
  </div>
);

const Campo = ({ label, valor }: { label: string; valor: ReactNode }) => (
  <Typography variant="body2" color="text.secondary" component="div" className="flex items-center gap-1">
    <Box component="span" sx={{ fontWeight: 500, color: "text.primary" }}>
      {label}:
    </Box>{" "}
    {valor}
  </Typography>
);

const PrecioTile = ({
  label,
  valor,
  total = false,
}: {
  label: string;
  valor: string;
  total?: boolean;
}) => (
  <Box
    className="rounded-lg p-4"
    sx={{
      border: 1,
      borderColor: total ? "success.light" : "primary.light",
      bgcolor: (t) => alpha(total ? t.palette.success.main : t.palette.primary.main, 0.06),
    }}
  >
    <Typography variant="body2" sx={{ fontWeight: 500 }}>
      {label}
    </Typography>
    <Typography
      variant="h2"
      component="p"
      sx={{ whiteSpace: "nowrap", color: total ? "success.main" : "primary.main" }}
    >
      {valor}
    </Typography>
  </Box>
);
