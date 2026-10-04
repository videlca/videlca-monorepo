import { useMemo, useState } from "react";
import { Section } from "../Section";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import MailOutlinedIcon from "@mui/icons-material/MailOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import type { TipoDocumento } from "../../../../api/dtos/exportaciones";
import type { ApiResponse, GruposLiquidaciones } from "../../../../api/types";
import { EnvioCorreos } from "../../modals/EnvioCorreos";
import type { UseMutateFunction } from "@tanstack/react-query";
import type { EnviarCorreoDto } from "../../../../api/dtos/common";
import ButtonOrdenes from "../../../common/ButtonOrdenes";
import { GrupoLiquidacionCard } from "../../../common/GrupoLiquidacionCard";
import { EmptyState } from "../../common/EmptyState";

export function OrdenesTab({
  tipo,
  data,
  handleFileAction,
  mutationEmail,
  envioCorreoPending,
}: {
  tipo: TipoDocumento;
  data: GruposLiquidaciones[];
  handleFileAction: (idGrupoLiquidacion: number) => void;
  mutationEmail: UseMutateFunction<
    ApiResponse<any>,
    Error,
    { id: number; data: EnviarCorreoDto }
  >;
  envioCorreoPending: boolean;
}) {
  const [isOpenEmail, setIsOpenEmail] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number>(0);

  const acciones = useMemo(() => {
    return {
      consolidacion_orden: {
        label: "Generar Consolidación",
        icon: <TableChartOutlinedIcon />,
      },
      generacion_interfase: {
        label: "Generar Archivo de Interfase",
        icon: <DescriptionOutlinedIcon />,
      },
      generacion_anexo: {
        label: "Generar Anexo de Facturación",
        icon: <PaidOutlinedIcon />,
      },
    };
  }, [tipo]);

  const accion = acciones[tipo as keyof typeof acciones] || null;

  return (
    <Section>
      <div className="flex flex-col gap-4">
        {data.length === 0 ? (
          <EmptyState
            icon={<DescriptionOutlinedIcon />}
            title="No hay grupos creados"
            description="Crea tu primer grupo desde la pantalla de búsqueda de órdenes"
          />
        ) : (
          data.map((group) => (
            <GrupoLiquidacionCard
              key={group.idGrupoLiquidacion}
              group={group}
              actions={
                <>
                  <ButtonOrdenes
                    color="green"
                    icon={<MailOutlinedIcon />}
                    onClick={() => {
                      setIsOpenEmail(true);
                      setSelectedOrderId(group.idGrupoLiquidacion);
                    }}
                  >
                    Enviar correo
                  </ButtonOrdenes>
                  <ButtonOrdenes
                    color="green"
                    icon={accion?.icon}
                    onClick={() => handleFileAction(group.idGrupoLiquidacion)}
                  >
                    {accion?.label}
                  </ButtonOrdenes>
                </>
              }
            />
          ))
        )}
      </div>

      <EnvioCorreos
        isOpen={isOpenEmail}
        setIsOpen={setIsOpenEmail}
        id={selectedOrderId}
        mutationEmail={mutationEmail}
        envioCorreoPending={envioCorreoPending}
      />
    </Section>
  );
}
