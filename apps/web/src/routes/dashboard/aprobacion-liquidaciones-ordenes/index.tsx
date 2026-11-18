import Typography from "@mui/material/Typography";
import { GrupoLiquidacionCard } from "../../../components/common/GrupoLiquidacionCard";
import { TotalAntesIvaGrupos } from "../../../components/common/TotalAntesIvaGrupos";
import { EmptyState } from "../../../components/ui/common/EmptyState";
import { createFileRoute } from "@tanstack/react-router";
import CheckIcon from "@mui/icons-material/Check";
import CommentOutlinedIcon from "@mui/icons-material/CommentOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { useState } from "react";
import { Section } from "../../../components/ui/dashboard/Section";
import {
  useAprobarGrupoLiquidacion,
  useDescargarPdfLiquidacion,
  useDesintegrarGrupoLiquidacion,
  useEnviarCorreoArchivoLiquidacion,
  useEnviarPdfLiquidacion,
  useGenerarReporteArchivoLiquidacion,
  useGetGruposLiquidaciones,
} from "../../../api/queryFunctions/liquidaciones";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { EnvioCorreos } from "../../../components/ui/modals/EnvioCorreos";
import { ObservacionesGrupoOrdenes } from "../../../components/ui/modals/ObservacionesGrupoOrdenes";
import type { GruposLiquidaciones } from "../../../api/types";
import { useGetObservacionesGrupoOrdenServicio } from "../../../api/queryFunctions/orden-servicio/observaciones-grupo";
import ButtonOrdenes from "../../../components/common/ButtonOrdenes";
import { SectionCard } from "../../../components/ui/common/SectionCard";
import { InputSelect } from "../../../components/common/InputSelect";
import { FiltroTiposServicio } from "../../../components/common/FiltroTiposServicio";
import type { TipoServicioFiltro } from "../../../api/types/liquidaciones";
import { TIPOS_SERVICIO_FILTRO } from "../../../utils/tiposServicio";

export const Route = createFileRoute(
  "/dashboard/aprobacion-liquidaciones-ordenes/",
)({
  component: RouteComponent,
});

// "0" = sin filtro (InputSelect no permite limpiar la seleccion, asi que se ofrece como opcion)
const TODOS = "0";

const NOMBRES_MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// MES/AÑO QUE LIQUIDA EL GRUPO (no el de creacion): viene en la descripcion con formato fijo
// "liquidacion_{mes}_{anio}_{idGrupoLiquidacion}" (mismo criterio que el historial en el backend)
const mesAnioGrupo = (grupo: GruposLiquidaciones) => {
  const [, mes, anio] = (grupo.descripcion ?? "").split("_");
  return { mes: Number(mes) || 0, anio: Number(anio) || 0 };
};

// Opciones unicas por id, ordenadas por nombre
const opcionesUnicas = (pares: [number, string][]) =>
  Array.from(new Map(pares), ([id, descripcion]) => ({ id, descripcion })).sort(
    (a, b) => a.descripcion.localeCompare(b.descripcion),
  );

function RouteComponent() {
  const [isOpenDeleteModal, setIsOpenDeleteModal] = useState(false);
  const [groupIdSelected, setGroupIdSelected] = useState<number | null>(null);
  const [isOpenEmail, setIsOpenEmail] = useState(false);
  const [isOpenPdf, setIsOpenPdf] = useState(false);
  const [groupIdPdfSelected, setGroupIdPdfSelected] = useState<number | null>(
    null,
  );
  const [isOpenObservaciones, setIsOpenObservaciones] = useState(false);
  const [selectedGroupOrder, setSelectedGroupOrder] =
    useState<GruposLiquidaciones | null>(null);
  // Queries y mutaciones
  const { data: groups } = useGetGruposLiquidaciones();

  // FILTROS. Se aplican sobre los grupos pendientes ya cargados (sin boton de buscar). Como se aprueba el grupo
  // completo, el filtro de tipo de servicio NO quita ordenes del grupo: muestra los grupos que tienen al menos una
  // orden de los tipos elegidos, con todas sus ordenes (vigilancia incluye los adicionales)
  const [filtroAnio, setFiltroAnio] = useState<string>(TODOS);
  const [filtroMes, setFiltroMes] = useState<string>(TODOS);
  const [filtroTipoCliente, setFiltroTipoCliente] = useState<string>(TODOS);
  const [filtroCliente, setFiltroCliente] = useState<string>(TODOS);
  const [filtroTiposServicio, setFiltroTiposServicio] = useState<
    TipoServicioFiltro[]
  >(TIPOS_SERVICIO_FILTRO);

  const todosLosGrupos = groups?.data ?? [];

  // Opciones sacadas de los mismos grupos pendientes: solo años/meses/tipos/clientes que tienen algo por aprobar
  const aniosOptions = [
    { id: Number(TODOS), descripcion: "Todos los años" },
    ...Array.from(new Set(todosLosGrupos.map((g) => mesAnioGrupo(g).anio).filter(Boolean)))
      .sort((a, b) => b - a)
      .map((anio) => ({ id: anio, descripcion: String(anio) })),
  ];
  const mesesOptions = [
    { id: Number(TODOS), descripcion: "Todos los meses" },
    ...Array.from(
      new Set(
        todosLosGrupos
          .map(mesAnioGrupo)
          .filter(({ anio }) => filtroAnio === TODOS || anio === Number(filtroAnio))
          .map(({ mes }) => mes)
          .filter((mes) => mes >= 1 && mes <= 12),
      ),
    )
      .sort((a, b) => a - b)
      .map((mes) => ({ id: mes, descripcion: NOMBRES_MESES[mes - 1] })),
  ];

  const tiposClienteOptions = [
    { id: Number(TODOS), descripcion: "Todos los tipos" },
    ...opcionesUnicas(
      todosLosGrupos.flatMap((grupo): [number, string][] =>
        grupo.idCliente?.idTipoCliente
          ? [[grupo.idCliente.idTipoCliente.idTipoCliente, grupo.idCliente.idTipoCliente.descripcion]]
          : [],
      ),
    ),
  ];
  const clientesOptions = [
    { id: Number(TODOS), descripcion: "Todos los clientes" },
    ...opcionesUnicas(
      todosLosGrupos.flatMap((grupo): [number, string][] =>
        grupo.idCliente &&
        (filtroTipoCliente === TODOS ||
          grupo.idCliente.idTipoCliente?.idTipoCliente === Number(filtroTipoCliente))
          ? [[grupo.idCliente.idCliente, grupo.idCliente.nombre]]
          : [],
      ),
    ),
  ];

  const tieneTipoServicio = (grupo: GruposLiquidaciones) =>
    filtroTiposServicio.length === TIPOS_SERVICIO_FILTRO.length ||
    grupo.liquidaciones.some((liquidacion) =>
      filtroTiposServicio.includes(
        liquidacion.tipoServicio === "monitoreo" ? "monitoreo" : "vigilancia",
      ),
    );

  const gruposFiltrados = todosLosGrupos.filter(
    (grupo) =>
      (filtroAnio === TODOS || mesAnioGrupo(grupo).anio === Number(filtroAnio)) &&
      (filtroMes === TODOS || mesAnioGrupo(grupo).mes === Number(filtroMes)) &&
      (filtroTipoCliente === TODOS ||
        grupo.idCliente?.idTipoCliente?.idTipoCliente === Number(filtroTipoCliente)) &&
      (filtroCliente === TODOS || grupo.idCliente?.idCliente === Number(filtroCliente)) &&
      tieneTipoServicio(grupo),
  );

  const hayFiltros =
    filtroAnio !== TODOS ||
    filtroMes !== TODOS ||
    filtroTipoCliente !== TODOS ||
    filtroCliente !== TODOS ||
    filtroTiposServicio.length !== TIPOS_SERVICIO_FILTRO.length;
  const { data: observacionesQueryData } =
    useGetObservacionesGrupoOrdenServicio(
      (selectedGroupOrder?.idGrupoLiquidacion as number) || 0,
    );
  const { mutate: aprobarGrupoLiquidacion } = useAprobarGrupoLiquidacion();
  const { mutate: desintegrarGrupoLiquidacion } =
    useDesintegrarGrupoLiquidacion();

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

  const handleAprobar = (groupId: number) => {
    aprobarGrupoLiquidacion(groupId);
  };

  const handleDesintegrar = (groupId: number) => {
    setGroupIdSelected(groupId);
    setIsOpenDeleteModal(true);
  };

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
  return (
    <Section>
      <div className="flex flex-col gap-8">
        <Typography variant="body2" color="text.secondary">
          Selecciona un grupo para aprobar la liquidación de las órdenes.
        </Typography>
        {todosLosGrupos.length > 0 && (
          <SectionCard
            title="Filtros"
            description="Filtra los grupos pendientes por el mes y año que liquidan, tipo de cliente, cliente y tipo de servicio. Con un tipo de servicio se muestran los grupos que tienen al menos una orden de ese tipo, con todas sus órdenes."
          >
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-48 flex-1">
                <InputSelect
                  label="Año"
                  placeholder="Selecciona un año"
                  id="filtroAnio"
                  value={filtroAnio}
                  onChange={(e) => {
                    const anio = e.target.value;
                    setFiltroAnio(anio);
                    // Si el mes elegido no tiene grupos pendientes en ese año, se vuelve a "Todos los meses"
                    if (
                      anio !== TODOS &&
                      filtroMes !== TODOS &&
                      !todosLosGrupos.some(
                        (g) =>
                          mesAnioGrupo(g).anio === Number(anio) &&
                          mesAnioGrupo(g).mes === Number(filtroMes),
                      )
                    ) {
                      setFiltroMes(TODOS);
                    }
                  }}
                  options={aniosOptions}
                />
              </div>
              <div className="min-w-48 flex-1">
                <InputSelect
                  label="Mes"
                  placeholder="Selecciona un mes"
                  id="filtroMes"
                  value={filtroMes}
                  onChange={(e) => setFiltroMes(e.target.value)}
                  options={mesesOptions}
                />
              </div>
              <div className="min-w-48 flex-1">
                <InputSelect
                  label="Tipo cliente"
                  placeholder="Selecciona un tipo de cliente"
                  id="filtroTipoCliente"
                  value={filtroTipoCliente}
                  onChange={(e) => {
                    const tipo = e.target.value;
                    setFiltroTipoCliente(tipo);
                    // Si el cliente elegido no es de este tipo, se vuelve a "Todos los clientes"
                    const grupoCliente = todosLosGrupos.find(
                      (g) => g.idCliente?.idCliente === Number(filtroCliente),
                    );
                    if (
                      tipo !== TODOS &&
                      grupoCliente &&
                      grupoCliente.idCliente?.idTipoCliente?.idTipoCliente !== Number(tipo)
                    ) {
                      setFiltroCliente(TODOS);
                    }
                  }}
                  options={tiposClienteOptions}
                />
              </div>
              <div className="min-w-48 flex-1">
                <InputSelect
                  label="Cliente"
                  placeholder="Selecciona un cliente"
                  id="filtroCliente"
                  value={filtroCliente}
                  onChange={(e) => setFiltroCliente(e.target.value)}
                  options={clientesOptions}
                />
              </div>
              <FiltroTiposServicio
                value={filtroTiposServicio}
                onChange={setFiltroTiposServicio}
              />
            </div>
          </SectionCard>
        )}
        {groups?.data?.length === 0 ? (
          <EmptyState
            icon={<DescriptionOutlinedIcon />}
            title="No hay grupos creados"
            description="Crea tu primer grupo desde la pantalla de búsqueda de órdenes"
          />
        ) : hayFiltros && todosLosGrupos.length > 0 && gruposFiltrados.length === 0 ? (
          <EmptyState
            icon={<DescriptionOutlinedIcon />}
            title="No hay grupos pendientes con estos filtros"
          />
        ) : (
          <div className="flex flex-col gap-4">
            {hayFiltros && todosLosGrupos.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                Mostrando {gruposFiltrados.length} de {todosLosGrupos.length} grupos pendientes
              </Typography>
            )}
            {/* Total antes de IVA de los grupos pendientes visibles (con los filtros aplicados) */}
            {gruposFiltrados.length > 0 && <TotalAntesIvaGrupos grupos={gruposFiltrados} />}
            {gruposFiltrados.map((group) => (
              <GrupoLiquidacionCard
                key={group.idGrupoLiquidacion}
                group={group}
                actions={
                  <>
                    <ButtonOrdenes
                      onClick={() => {
                        setIsOpenObservaciones(true);
                        setSelectedGroupOrder(group);
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
                    <ButtonOrdenes
                      onClick={() => handleAprobar(group.idGrupoLiquidacion)}
                      color="green"
                      icon={<CheckIcon />}
                    >
                      Aprobar
                    </ButtonOrdenes>
                    <ButtonOrdenes
                      onClick={() =>
                        handleDesintegrar(group.idGrupoLiquidacion)
                      }
                      color="red"
                      icon={<DeleteOutlinedIcon />}
                    >
                      Desintegrar
                    </ButtonOrdenes>
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>

      <ObservacionesGrupoOrdenes
        isOpenObservaciones={isOpenObservaciones}
        setIsOpenObservaciones={(isOpen) => {
          setIsOpenObservaciones(isOpen);
          if (!isOpen) {
            setGroupIdSelected(null);
          }
        }}
        selectedOrderDetail={selectedGroupOrder || ({} as GruposLiquidaciones)}
        setSelectedOrderDetail={setSelectedGroupOrder}
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

      <ConfirmarDelete
        isOpenDelete={isOpenDeleteModal}
        text="¿Estás seguro de querer desintegrar este grupo de liquidación?"
        onDelete={() => {
          desintegrarGrupoLiquidacion(groupIdSelected as number, {
            onSuccess: () => {
              setIsOpenDeleteModal(false);
              setGroupIdSelected(null);
            },
          });
        }}
        onClose={() => {
          setIsOpenDeleteModal(false);
          setGroupIdSelected(null);
        }}
      />
    </Section>
  );
}
