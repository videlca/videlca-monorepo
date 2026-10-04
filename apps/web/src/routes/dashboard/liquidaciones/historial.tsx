import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { SectionCard } from "../../../components/ui/common/SectionCard";
import { GrupoLiquidacionCard } from "../../../components/common/GrupoLiquidacionCard";
import { EmptyState } from "../../../components/ui/common/EmptyState";
import { createFileRoute } from "@tanstack/react-router";
import { getYear, subYears } from "date-fns";
import { useState } from "react";
import {
  useDescargarPdfLiquidacion,
  useEnviarCorreoArchivoLiquidacion,
  useEnviarPdfLiquidacion,
  useGenerarReporteArchivoLiquidacion,
  useGetLiquidacionesPorMesHistorial,
} from "../../../api/queryFunctions/liquidaciones";
import { Section } from "../../../components/ui/dashboard/Section";
import { InputSelect } from "../../../components/common/InputSelect";
import { ButtonAction } from "../../../components/common/ButtonAction";
import CommentOutlinedIcon from "@mui/icons-material/CommentOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { priceFormat } from "../../../utils/PriceFormat";
import { EnvioCorreos } from "../../../components/ui/modals/EnvioCorreos";
import { ObservacionesGrupoOrdenes } from "../../../components/ui/modals/ObservacionesGrupoOrdenes";
import type {
  GruposLiquidaciones,
  TipoServicioFiltro,
} from "../../../api/types/liquidaciones";
import ButtonOrdenes from "../../../components/common/ButtonOrdenes";
import { useGetObservacionesGrupoOrdenServicio } from "../../../api/queryFunctions/orden-servicio/observaciones-grupo";
import { useClientes } from "../../../api/queryFunctions/clientes";
import { FiltroTiposServicio } from "../../../components/common/FiltroTiposServicio";
import {
  serializarTiposServicio,
  TIPOS_SERVICIO_FILTRO,
} from "../../../utils/tiposServicio";

export const Route = createFileRoute("/dashboard/liquidaciones/historial")({
  component: RouteComponent,
});

const monthsOptions = [
  { id: 1, descripcion: "Enero" },
  { id: 2, descripcion: "Febrero" },
  { id: 3, descripcion: "Marzo" },
  { id: 4, descripcion: "Abril" },
  { id: 5, descripcion: "Mayo" },
  { id: 6, descripcion: "Junio" },
  { id: 7, descripcion: "Julio" },
  { id: 8, descripcion: "Agosto" },
  { id: 9, descripcion: "Septiembre" },
  { id: 10, descripcion: "Octubre" },
  { id: 11, descripcion: "Noviembre" },
  { id: 12, descripcion: "Diciembre" },
];

const yearsOptions = Array.from({ length: 10 }, (_, i) => {
  const year = getYear(subYears(new Date(), i));
  return { id: year, descripcion: year.toString() };
});

const currentYear = getYear(new Date()).toString();
const currentMonth = (new Date().getMonth() + 1).toString();

// "0" = sin filtro de cliente (InputSelect no permite limpiar la seleccion, asi que se ofrece como opcion)
const TODOS_LOS_CLIENTES = "0";

function RouteComponent() {
  const [searchMonth, setSearchMonth] = useState<string>(currentMonth);
  const [searchYear, setSearchYear] = useState<string>(currentYear);
  const [searchCliente, setSearchCliente] =
    useState<string>(TODOS_LOS_CLIENTES);
  const [searchTipos, setSearchTipos] = useState<TipoServicioFiltro[]>(
    TIPOS_SERVICIO_FILTRO,
  );
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isOpenEmail, setIsOpenEmail] = useState(false);
  const [isOpenPdf, setIsOpenPdf] = useState(false);
  const [groupIdPdfSelected, setGroupIdPdfSelected] = useState<number | null>(
    null,
  );
  const [groupIdSelected, setGroupIdSelected] = useState<number | null>(null);
  const [isOpenObservacionesModal, setIsOpenObservacionesModal] =
    useState(false);
  const [groupLiquidacionSelected, setGroupLiquidacionSelected] =
    useState<GruposLiquidaciones | null>(null);
  const { data: observacionesQueryData } =
    useGetObservacionesGrupoOrdenServicio(
      groupLiquidacionSelected?.idGrupoLiquidacion as number,
    );
  // Queries y mutaciones
  // Todos los clientes (no solo activos): el historial puede incluir clientes que ya fueron desactivados
  const { data: clientes } = useClientes();
  const clientesOptions = [
    { id: Number(TODOS_LOS_CLIENTES), descripcion: "Todos los clientes" },
    ...(clientes?.data?.data?.map((cliente) => ({
      id: cliente.idCliente,
      descripcion: cliente.nombre,
    })) ?? []),
  ];

  const {
    data: liquidaciones,
    isLoading: isLoadingLiquidaciones,
    refetch: refetchLiquidaciones,
  } = useGetLiquidacionesPorMesHistorial(
    Number(searchYear),
    Number(searchMonth),
    isSearching,
    Number(searchCliente) || undefined,
    serializarTiposServicio(searchTipos),
  );

  const liquidacionesData: GruposLiquidaciones[] = Array.isArray(
    liquidaciones?.data,
  )
    ? liquidaciones.data
    : [];

  // Archivos de liquidaciones
  const { mutate: generarReporteArchivoLiquidacion } =
    useGenerarReporteArchivoLiquidacion();
  const {
    mutate: enviarCorreoArchivoLiquidacion,
    isPending: enviarCorreoArchivoLiquidacionPending,
  } = useEnviarCorreoArchivoLiquidacion();
  const {
    mutate: descargarPdfLiquidacion,
    isPending: descargarPdfLiquidacionPending,
  } = useDescargarPdfLiquidacion();
  const {
    mutate: enviarPdfLiquidacion,
    isPending: enviarPdfLiquidacionPending,
  } = useEnviarPdfLiquidacion();

  const handleGenerarReporteLiquidacion = (groupId: number) => {
    generarReporteArchivoLiquidacion(groupId);
  };

  const handleEnviarCorreoLiquidacion = (groupId: number) => {
    setIsOpenEmail(true);
    setGroupIdSelected(groupId);
  };

  const handleDescargarPdfLiquidacion = (groupId: number) => {
    if (descargarPdfLiquidacionPending) return;
    descargarPdfLiquidacion(groupId);
  };

  const handleEnviarPdfLiquidacion = (groupId: number) => {
    setIsOpenPdf(true);
    setGroupIdPdfSelected(groupId);
  };

  // Totales facturados de TODOS los grupos encontrados para el mes filtrado (independiente de cuales grupos
  // esten ocultos via hiddenGroups, que es solo un toggle visual). "Antes de IVA" no se guarda a nivel de
  // grupo, solo por liquidacion (valorLiquidacionAntesIva), por eso se suma primero por grupo y luego entre
  // todos los grupos; "Liquidación Total" ya viene calculado por grupo (group.total, CON iva)
  const totalAntesIvaGeneral = liquidacionesData.reduce(
    (acc, group) =>
      acc +
      Number(
        group.totalAntesIvaFiltrado ??
          (group.liquidaciones ?? []).reduce(
            (accGrupo, liquidacion) =>
              accGrupo + Number(liquidacion.valorLiquidacionAntesIva ?? 0),
            0,
          ),
      ),
    0,
  );

  const totalLiquidacionGeneral = liquidacionesData.reduce(
    (acc, group) => acc + Number(group.totalFiltrado ?? group.total ?? 0),
    0,
  );

  return (
    <Section>
      <SectionCard
        title="Filtros de Búsqueda"
        description="Para ver el historial de liquidaciones, selecciona el mes y año de la liquidación. Opcionalmente, filtra por cliente y tipo de servicio."
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-48 flex-1">
            <InputSelect
              label="Año"
              placeholder="Selecciona un año"
              id="searchYear"
              value={searchYear}
              onChange={(e) => {
                setSearchYear(e.target.value);
                setIsSearching(false);
              }}
              options={yearsOptions as { id: number; descripcion: string }[]}
            />
          </div>
          <div className="min-w-48 flex-1">
            <InputSelect
              label="Mes"
              placeholder="Selecciona un mes"
              id="searchMonth"
              value={searchMonth}
              onChange={(e) => {
                setSearchMonth(e.target.value);
                setIsSearching(false);
              }}
              options={monthsOptions}
            />
          </div>
          <div className="min-w-48 flex-1">
            <InputSelect
              label="Cliente"
              placeholder="Selecciona un cliente"
              id="searchCliente"
              value={searchCliente}
              onChange={(e) => {
                setSearchCliente(e.target.value);
                setIsSearching(false);
              }}
              options={clientesOptions}
            />
          </div>
          <FiltroTiposServicio
            value={searchTipos}
            onChange={(tipos) => {
              setSearchTipos(tipos);
              setIsSearching(false);
            }}
          />
          <ButtonAction
            onClick={() => {
              setIsSearching(true);
              refetchLiquidaciones();
            }}
            disabled={isLoadingLiquidaciones}
            Icon={SearchIcon}
            label={isLoadingLiquidaciones ? "Buscando..." : "Buscar"}
          />
        </div>
      </SectionCard>

      {isSearching &&
        !isLoadingLiquidaciones &&
        liquidacionesData.length === 0 && (
          <EmptyState
            icon={<DescriptionOutlinedIcon />}
            title="No se encontraron órdenes de servicio"
          />
        )}

      {isSearching &&
      !isLoadingLiquidaciones &&
      liquidacionesData.length > 0 ? (
        <>
          <Typography variant="h3" component="h2">
            Resultados ({liquidacionesData.length} grupos encontrados)
          </Typography>

          <Paper
            variant="outlined"
            className="flex flex-wrap items-center justify-end gap-6 p-4"
          >
            <Typography variant="body2" color="text.secondary">
              Total antes de IVA:{" "}
              <Box
                component="span"
                sx={{ fontWeight: 500, color: "text.primary" }}
              >
                {priceFormat(totalAntesIvaGeneral)}
              </Box>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Liquidación Total:{" "}
              <Box
                component="span"
                sx={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "success.main",
                }}
              >
                {priceFormat(totalLiquidacionGeneral)}
              </Box>
            </Typography>
          </Paper>

          <div className="flex flex-col gap-4">
            {liquidacionesData.map((group) => (
              <GrupoLiquidacionCard
                key={group.idGrupoLiquidacion}
                group={group}
                actions={
                  <>
                    <ButtonOrdenes
                      onClick={() => {
                        setIsOpenObservacionesModal(true);
                        setGroupLiquidacionSelected(group);
                      }}
                      color="green"
                      icon={<CommentOutlinedIcon />}
                    >
                      Observaciones
                    </ButtonOrdenes>
                    <ButtonOrdenes
                      onClick={() =>
                        handleGenerarReporteLiquidacion(
                          group.idGrupoLiquidacion,
                        )
                      }
                      color="blue"
                      icon={<DescriptionOutlinedIcon />}
                    >
                      Generar reporte
                    </ButtonOrdenes>
                    <ButtonOrdenes
                      onClick={() =>
                        handleEnviarCorreoLiquidacion(group.idGrupoLiquidacion)
                      }
                      color="amber"
                      icon={<MailOutlinedIcon />}
                    >
                      Enviar correo
                    </ButtonOrdenes>
                    <ButtonOrdenes
                      onClick={() =>
                        handleDescargarPdfLiquidacion(group.idGrupoLiquidacion)
                      }
                      color="red"
                      icon={<FileDownloadOutlinedIcon />}
                    >
                      Descargar PDF
                    </ButtonOrdenes>
                    <ButtonOrdenes
                      onClick={() =>
                        handleEnviarPdfLiquidacion(group.idGrupoLiquidacion)
                      }
                      color="purple"
                      icon={<SendOutlinedIcon />}
                    >
                      Enviar PDF
                    </ButtonOrdenes>
                  </>
                }
              />
            ))}
          </div>
        </>
      ) : null}

      <ObservacionesGrupoOrdenes
        isOpenObservaciones={isOpenObservacionesModal}
        setIsOpenObservaciones={(isOpen) => {
          setIsOpenObservacionesModal(isOpen);
          if (!isOpen) {
            setGroupIdSelected(null);
          }
        }}
        selectedOrderDetail={
          groupLiquidacionSelected || ({} as GruposLiquidaciones)
        }
        setSelectedOrderDetail={setGroupLiquidacionSelected}
        observacionesQueryData={observacionesQueryData?.data?.data || []}
      />

      <EnvioCorreos
        isOpen={isOpenEmail}
        setIsOpen={setIsOpenEmail}
        id={groupIdSelected as number}
        mutationEmail={enviarCorreoArchivoLiquidacion}
        envioCorreoPending={enviarCorreoArchivoLiquidacionPending}
      />

      <EnvioCorreos
        isOpen={isOpenPdf}
        setIsOpen={setIsOpenPdf}
        id={groupIdPdfSelected as number}
        mutationEmail={enviarPdfLiquidacion}
        envioCorreoPending={enviarPdfLiquidacionPending}
      />
    </Section>
  );
}
