import Typography from "@mui/material/Typography";
import { GrupoLiquidacionCard } from "../../../components/common/GrupoLiquidacionCard";
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

export const Route = createFileRoute(
  "/dashboard/aprobacion-liquidaciones-ordenes/",
)({
  component: RouteComponent,
});

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
        {groups?.data?.length === 0 ? (
          <EmptyState
            icon={<DescriptionOutlinedIcon />}
            title="No hay grupos creados"
            description="Crea tu primer grupo desde la pantalla de búsqueda de órdenes"
          />
        ) : (
          <div className="flex flex-col gap-4">
            {groups?.data?.map((group) => (
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
