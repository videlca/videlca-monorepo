import { createFileRoute } from "@tanstack/react-router";
import { getYear, subYears } from "date-fns";
import { useState } from "react";
import {
  useEnviarCorreoArchivoLiquidacion,
  useGenerarReporteArchivoLiquidacion,
  useGetLiquidacionesPorMesHistorial,
} from "../../../api/queryFunctions/liquidaciones";
import { Section } from "../../../components/ui/dashboard/Section";
import { InputSelect } from "../../../components/common/InputSelect";
import { ButtonAction } from "../../../components/common/ButtonAction";
import {
  EyeOff,
  FileTextIcon,
  Mail,
  MessageSquareTextIcon,
  Search,
} from "lucide-react";
import { OrdenServicioCard } from "../../../components/common/OrdenServicioCard";
import { priceFormat } from "../../../utils/PriceFormat";
import { EnvioCorreos } from "../../../components/ui/modals/EnvioCorreos";
import { ObservacionesGrupoOrdenes } from "../../../components/ui/modals/ObservacionesGrupoOrdenes";
import type { GruposLiquidaciones } from "../../../api/types/liquidaciones";
import ButtonOrdenes from "../../../components/common/ButtonOrdenes";
import { useGetObservacionesGrupoOrdenServicio } from "../../../api/queryFunctions/orden-servicio/observaciones-grupo";

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

function RouteComponent() {
  const [hiddenGroups, setHiddenGroups] = useState<Set<number>>(new Set());
  const [searchMonth, setSearchMonth] = useState<string>(currentMonth);
  const [searchYear, setSearchYear] = useState<string>(currentYear);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isOpenEmail, setIsOpenEmail] = useState(false);
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
  const {
    data: liquidaciones,
    isLoading: isLoadingLiquidaciones,
    refetch: refetchLiquidaciones,
  } = useGetLiquidacionesPorMesHistorial(
    Number(searchYear),
    Number(searchMonth),
    isSearching,
  );

  const liquidacionesData = Array.isArray(liquidaciones?.data)
    ? liquidaciones.data
    : Array.isArray(liquidaciones?.data?.data)
      ? liquidaciones.data.data
      : [];

  // Archivos de liquidaciones
  const { mutate: generarReporteArchivoLiquidacion } =
    useGenerarReporteArchivoLiquidacion();
  const {
    mutate: enviarCorreoArchivoLiquidacion,
    isPending: enviarCorreoArchivoLiquidacionPending,
  } = useEnviarCorreoArchivoLiquidacion();

  const toggleHideOrders = (groupId: number) => {
    const newHidden = new Set(hiddenGroups);
    if (newHidden.has(groupId)) {
      newHidden.delete(groupId);
    } else {
      newHidden.add(groupId);
    }
    setHiddenGroups(newHidden);
  };

  const handleGenerarReporteLiquidacion = (groupId: number) => {
    generarReporteArchivoLiquidacion(groupId);
  };

  const handleEnviarCorreoLiquidacion = (groupId: number) => {
    setIsOpenEmail(true);
    setGroupIdSelected(groupId);
  };

  // Totales facturados de TODOS los grupos encontrados para el mes filtrado (independiente de cuales grupos
  // esten ocultos via hiddenGroups, que es solo un toggle visual). "Antes de IVA" no se guarda a nivel de
  // grupo, solo por liquidacion (valorLiquidacionAntesIva), por eso se suma primero por grupo y luego entre
  // todos los grupos; "Liquidación Total" ya viene calculado por grupo (group.total, CON iva)
  const totalAntesIvaGeneral = liquidacionesData.reduce(
    (acc, group) =>
      acc +
      (group.liquidaciones ?? []).reduce(
        (accGrupo, liquidacion) => accGrupo + Number(liquidacion.valorLiquidacionAntesIva ?? 0),
        0,
      ),
    0,
  );

  const totalLiquidacionGeneral = liquidacionesData.reduce(
    (acc, group) => acc + Number(group.total ?? 0),
    0,
  );

  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Filtros de Búsqueda</h2>
          <p className="mb-4 text-sm text-gray-500">
            Para ver el historial de liquidaciones, selecciona el mes y año de
            la liquidación.
          </p>
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
            <ButtonAction
              onClick={() => {
                setIsSearching(true);
                refetchLiquidaciones();
              }}
              disabled={isLoadingLiquidaciones}
              Icon={Search}
              label={isLoadingLiquidaciones ? "Buscando..." : "Buscar"}
            />
          </div>
        </div>
      </div>

      {isSearching && !isLoadingLiquidaciones && liquidacionesData.length === 0 && (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
            <FileTextIcon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No se encontraron órdenes de servicio
          </h3>
        </div>
      )}

      {isSearching && !isLoadingLiquidaciones && liquidacionesData.length > 0 ? (
        <>
          <div className="mb-4 flex justify-between">
            <div className="mb-2 flex-col items-start justify-between gap-2">
              <h2 className="text-xl font-semibold">
                Resultados ({liquidacionesData.length} grupos encontrados)
              </h2>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap items-center justify-end gap-6 rounded-lg border border-gray-300 bg-white p-4 shadow-sm">
            <span className="text-sm text-gray-600">
              Total antes de IVA:{" "}
              <span className="font-medium text-gray-700">
                {priceFormat(totalAntesIvaGeneral)}
              </span>
            </span>
            <span className="text-sm text-gray-600">
              Liquidación Total:{" "}
              <span className="text-base font-semibold text-green-600">
                {priceFormat(totalLiquidacionGeneral)}
              </span>
            </span>
          </div>

          <div className="space-y-4">
            {liquidacionesData.map((group) => (
              <div
                key={group.idGrupoLiquidacion}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              >
                <div className="border-b border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex w-full flex-col items-center justify-between gap-4 md:flex-row md:gap-0">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Descripción:</span>{" "}
                        {group.descripcion} <br />
                        <span className="font-medium">Órdenes:</span>{" "}
                        {group.liquidaciones?.length || 0}
                        <br />
                        <span className="font-medium">Creado:</span>{" "}
                        {group.fechaCreacion ? new Date(group.fechaCreacion).toLocaleDateString("es-ES") : ""}
                      </div>
                      <div className="flex flex-wrap items-center gap-0 md:gap-4">
                        <ButtonOrdenes
                          onClick={() =>
                            toggleHideOrders(group.idGrupoLiquidacion)
                          }
                          color="gray"
                          title={
                            hiddenGroups.has(group.idGrupoLiquidacion)
                              ? "Mostrar órdenes"
                              : "Ocultar órdenes"
                          }
                        >
                          <EyeOff className="mr-1 h-4 w-4" />
                          {hiddenGroups.has(group.idGrupoLiquidacion)
                            ? "Mostrar"
                            : "Ocultar"}
                        </ButtonOrdenes>
                        <ButtonOrdenes
                          onClick={() => {
                            setIsOpenObservacionesModal(true);
                            setGroupLiquidacionSelected(group);
                          }}
                          color="green"
                        >
                          <MessageSquareTextIcon className="mr-1 h-4 w-4" />
                          Observaciones
                        </ButtonOrdenes>
                        <ButtonOrdenes
                          onClick={() =>
                            handleGenerarReporteLiquidacion(
                              group.idGrupoLiquidacion,
                            )
                          }
                          color="blue"
                        >
                          <FileTextIcon className="mr-1 h-4 w-4" />
                          Generar reporte
                        </ButtonOrdenes>
                        <ButtonOrdenes
                          onClick={() =>
                            handleEnviarCorreoLiquidacion(
                              group.idGrupoLiquidacion,
                            )
                          }
                          color="amber"
                        >
                          <Mail className="mr-1 h-4 w-4" />
                          Enviar correo
                        </ButtonOrdenes>
                      </div>
                    </div>
                  </div>
                </div>

                {!hiddenGroups.has(group.idGrupoLiquidacion) && (
                  <OrdenServicioCard
                    key={group.idGrupoLiquidacion}
                    grupoLiquidacion={group}
                    showTotal={true}
                  />
                )}
              </div>
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
    </Section>
  );
}
