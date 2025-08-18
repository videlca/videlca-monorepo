import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { Section } from "../../../components/ui/dashboard/Section";
import {
  ArrowLeftIcon,
  ChevronDown,
  PlusIcon,
  Search,
  UserCheck,
  X,
} from "lucide-react";
import { usePeriodoById } from "../../../api/queryFunctions/tarifas/periodo";
import {
  useServiciosByPeriodo,
  useTipoServicios,
} from "../../../api/queryFunctions/servicios";
import { InputPrice } from "../../../components/common/InputPrice";
import { InputSelect } from "../../../components/common/InputSelect";
import type { Servicio } from "../../../api/types/servicio";
import { useState } from "react";
import { useGuardarTarifas } from "../../../api/queryFunctions/tarifas/tarifa";
import { useTipoTarifa } from "../../../api/queryFunctions/tarifas";
import type { CreateTarifaDto } from "../../../api/dtos/tarifas";
import { toast } from "sonner";
import { priceCalculate, priceFormat } from "../../../utils/PriceFormat";
import type { Tarifa } from "../../../api/types/periodo";

// Interfaz para manejar servicios configurados localmente
interface ServicioConfigurado
  extends Omit<
    Tarifa,
    | "idTarifa"
    | "idPeriodo"
    | "idTipoTarifa"
    | "estado"
    | "fechaCreacion"
    | "fechaActualizacion"
  > {
  idTipoTarifa: number | null;
  precioAntesIva: number;
  iva: number;
  precioTotal: number;
  costosDirectos: number;
  seguroVida: number;
  costosDirectosSeguroVida: number;
  aui: number;
}

export const Route = createFileRoute(
  "/dashboard/tarifas/configurar-servicios/$id-periodo",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { "id-periodo": idPeriodoParam } = useParams({
    from: "/dashboard/tarifas/configurar-servicios/$id-periodo",
  });

  // Estados
  const [serviciosConfigurados, setServiciosConfigurados] = useState<
    ServicioConfigurado[]
  >([]);
  const [servicioEnEdicion, setServicioEnEdicion] = useState<number | null>(
    null,
  );
  const [mostrarSoloSeleccionados, setMostrarSoloSeleccionados] =
    useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipoServicio, setFiltroTipoServicio] = useState<number | null>(
    null,
  );

  // Queries y mutaciones
  const { data: periodo } = usePeriodoById(Number(idPeriodoParam));
  const { data: servicios } = useServiciosByPeriodo(Number(idPeriodoParam));
  const { data: tiposServicios } = useTipoServicios();
  const { data: tiposTarifa } = useTipoTarifa();
  const { mutate: guardarTarifas, isPending: isLoadingGuardarTarifas } =
    useGuardarTarifas();

  // Función para verificar si un servicio está configurado
  const isServicioConfigurado = (idServicio: number) => {
    return serviciosConfigurados.some(
      (sc) => sc.idServicio.idServicio === idServicio,
    );
  };

  // Función para obtener la configuración de un servicio
  const getServicioConfigurado = (idServicio: number) => {
    return serviciosConfigurados.find(
      (sc) => sc.idServicio.idServicio === idServicio,
    );
  };

  // Función para agregar/actualizar un servicio configurado
  const actualizarServicioConfigurado = (
    servicio: Servicio,
    campo: keyof Omit<ServicioConfigurado, "idServicio">,
    valor: number | null,
  ) => {
    setServiciosConfigurados((prev) => {
      const existeIndex = prev.findIndex(
        (sc) => sc.idServicio.idServicio === servicio.idServicio,
      );

      if (existeIndex >= 0) {
        // Actualizar servicio existente en la lista de servicios configurados y sus precios
        const updated = [...prev];
        const servicioActual = updated[existeIndex];

        if (
          campo === "costosDirectos" ||
          campo === "seguroVida" ||
          campo === "aui"
        ) {
          // Actualizar el campo específico y recalcular precios
          const updatedServicio = {
            ...servicioActual,
            [campo]: valor ?? 0,
          };

          const { iva, precioTotal, precioAntesIva, costosDirectosSeguroVida } =
            priceCalculate(
              updatedServicio.costosDirectos,
              updatedServicio.seguroVida,
              updatedServicio.aui,
            );
          updated[existeIndex] = {
            ...updatedServicio,
            precioAntesIva,
            iva,
            precioTotal,
            costosDirectosSeguroVida,
          };
        } else {
          updated[existeIndex] = {
            ...servicioActual,
            [campo]: valor,
          };
        }

        return updated;
      } else {
        // Agregar nuevo servicio a la lista de servicios configurados
        const { iva, precioTotal, precioAntesIva, costosDirectosSeguroVida } =
          priceCalculate(0, 0, 0);

        return [
          ...prev,
          {
            idServicio: servicio,
            idTipoTarifa: campo === "idTipoTarifa" ? (valor as number) : null,
            precioAntesIva,
            iva,
            precioTotal,
            costosDirectos: 0,
            seguroVida: 0,
            costosDirectosSeguroVida,
            aui: 0,
          },
        ];
      }
    });
  };

  // Función para remover un servicio configurado
  const removerServicioConfigurado = (idServicio: number) => {
    setServiciosConfigurados((prev) =>
      prev.filter((sc) => sc.idServicio.idServicio !== idServicio),
    );
    setServicioEnEdicion(null);
  };

  // Función para enviar las tarifas al endpoint
  const handleAgregarServiciosSeleccionados = () => {
    if (serviciosConfigurados.length === 0) {
      toast.error("No hay servicios configurados para agregar");
      return;
    }

    // Validar que todos los servicios tengan datos completos
    const serviciosCompletos = serviciosConfigurados.filter(
      (sc) => sc.idTipoTarifa !== null && sc.precioAntesIva > 0,
    );

    if (serviciosCompletos.length === 0) {
      toast.error(
        "Debe configurar completamente al menos un servicio (tipo de tarifa y precio base)",
      );
      return;
    }

    // Crear el DTO para enviar al endpoint
    const tarifasData: CreateTarifaDto[] = serviciosCompletos.map((sc) => ({
      idPeriodo: Number(idPeriodoParam),
      idServicio: sc.idServicio.idServicio,
      idTipoTarifa: sc.idTipoTarifa!,
      precioAntesIva: sc.precioAntesIva,
      costosDirectos: sc.costosDirectos,
      seguroVida: sc.seguroVida,
      costosDirectosSeguroVida: sc.costosDirectosSeguroVida,
      aui: sc.aui,
      iva: sc.iva,
      precioTotal: sc.precioTotal,
    }));

    guardarTarifas(
      {
        idPeriodo: Number(idPeriodoParam),
        tarifas: tarifasData,
      },
      {
        onSuccess: () => {
          navigate({
            to: "/dashboard/tarifas/ver-tarifas/$id-periodo",
            params: {
              "id-periodo": idPeriodoParam as string,
            },
          });
        },
      },
    );
  };

  // Filtrar servicios según búsqueda y filtros
  const serviciosFiltrados =
    servicios?.data?.filter((servicio) => {
      const matchSearch =
        !searchTerm ||
        servicio.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servicio.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        servicio.idTipoServicio?.descripcion
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchTipo =
        !filtroTipoServicio ||
        servicio.idTipoServicio?.idTipoServicio === filtroTipoServicio;

      const matchSeleccionados =
        !mostrarSoloSeleccionados || isServicioConfigurado(servicio.idServicio);

      return matchSearch && matchTipo && matchSeleccionados;
    }) || [];

  // TODO: Buscar servicios disponibles para asignar a un periodo

  return (
    <Section>
      <div className="flex items-center justify-between gap-8">
        <div className="flex w-full flex-col gap-2">
          <h1 className="text-3xl font-bold">
            {" "}
            Periodo {periodo?.data?.anioInicio}{" "}
            <span
              className={`ml-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                periodo?.data?.periodoActivoFacturacion
                  ? "bg-green-200 text-green-700"
                  : "bg-red-200 text-red-700"
              }`}
            >
              {periodo?.data?.periodoActivoFacturacion
                ? "Activo para facturación"
                : "Inactivo para facturación"}
            </span>
          </h1>
          <h1 className="text-base font-semibold text-gray-600">
            {periodo?.data?.nombre}
          </h1>
        </div>
        <div className="flex justify-end gap-2">
          <ButtonAction
            Icon={ArrowLeftIcon}
            label="Volver"
            onClick={() => {
              navigate({
                to: "/dashboard/tarifas/periodo",
              });
            }}
          />
          <ButtonAction
            Icon={PlusIcon}
            label="Agregar Servicios seleccionados"
            onClick={handleAgregarServiciosSeleccionados}
            disabled={isLoadingGuardarTarifas}
          />
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium text-gray-700">
                Servicios Configurados: {serviciosConfigurados.length}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mostrarSoloSeleccionados"
              checked={mostrarSoloSeleccionados}
              onChange={(e) => setMostrarSoloSeleccionados(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="mostrarSoloSeleccionados"
              className="text-sm text-gray-700"
            >
              Mostrar solo seleccionados
            </label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar servicios por código, descripción o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="relative w-48">
            <select
              value={filtroTipoServicio || ""}
              onChange={(e) =>
                setFiltroTipoServicio(
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Todos los tipos</option>
              {tiposServicios?.data?.map((tipo) => (
                <option key={tipo.idTipoServicio} value={tipo.idTipoServicio}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Lista de servicios configurados */}
      {serviciosConfigurados.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900">
              Servicios Configurados
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Servicios listos para ser agregados al período
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {serviciosConfigurados.map((sc) => (
              <div key={sc.idServicio.idServicio} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-1 items-center gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-3">
                        <span className="font-medium text-gray-900">
                          {sc.idServicio.codigo}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          {sc.idServicio.idTipoServicio?.descripcion}
                        </span>
                        {sc.idServicio.idTipoServicio?.requierePersonal && (
                          <UserCheck className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <p className="mb-2 text-sm text-gray-600">
                        {sc.idServicio.descripcion}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-semibold capitalize">
                          Tipo de Tarifa:{" "}
                          {
                            tiposTarifa?.data?.find(
                              (t) => t.idTipoTarifa === sc.idTipoTarifa,
                            )?.nombre
                          }
                        </span>
                        <span className="font-semibold">
                          Precio Antes de IVA: {priceFormat(sc.precioAntesIva)}
                        </span>
                        <span className="font-semibold">
                          IVA: {priceFormat(sc.iva)}
                        </span>
                        <span className="font-semibold">
                          Total: {priceFormat(sc.precioTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      removerServicioConfigurado(sc.idServicio.idServicio)
                    }
                    className="ml-4 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            Servicios Disponibles
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Seleccione los servicios que estarán disponibles en el periodo y
            configure sus precios
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {serviciosFiltrados.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No hay servicios disponibles con los filtros aplicados
            </div>
          ) : (
            serviciosFiltrados.map((item) => {
              const servicioConfig = getServicioConfigurado(item.idServicio);
              const isEnEdicion = servicioEnEdicion === item.idServicio;

              return (
                <div key={item.idServicio} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center gap-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isServicioConfigurado(item.idServicio)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setServicioEnEdicion(item.idServicio);
                            } else {
                              removerServicioConfigurado(item.idServicio);
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-3">
                          <span className="font-medium text-gray-900">
                            {item.codigo}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            {item.idTipoServicio?.descripcion}
                          </span>
                          {item.idTipoServicio?.requierePersonal && (
                            <UserCheck className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <p className="mb-6 text-sm text-gray-600">
                          {item.descripcion}
                        </p>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {(isEnEdicion || servicioConfig) && (
                            <>
                              <div className="space-y-2">
                                <InputSelect
                                  label="Tipo de tarifa:"
                                  options={
                                    tiposTarifa?.data?.map((tipo) => ({
                                      id: tipo.idTipoTarifa,
                                      descripcion: tipo.nombre,
                                    })) || []
                                  }
                                  placeholder="Selecciona un tipo de tarifa"
                                  id={`tipoTarifa-${item.idServicio}`}
                                  value={
                                    servicioConfig?.idTipoTarifa?.toString() ||
                                    ""
                                  }
                                  onChange={(e) => {
                                    actualizarServicioConfigurado(
                                      item,
                                      "idTipoTarifa",
                                      Number(e.target.value),
                                    );
                                  }}
                                />
                                <InputPrice
                                  label="Costos Directos:"
                                  size="full"
                                  value={
                                    servicioConfig?.costosDirectos.toString() ||
                                    ""
                                  }
                                  onChange={(e) => {
                                    actualizarServicioConfigurado(
                                      item,
                                      "costosDirectos",
                                      Number(e.target.value),
                                    );
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <InputPrice
                                  label="Seguro de Vida:"
                                  size="full"
                                  value={
                                    servicioConfig?.seguroVida?.toString() || ""
                                  }
                                  onChange={(e) => {
                                    actualizarServicioConfigurado(
                                      item,
                                      "seguroVida",
                                      Number(e.target.value),
                                    );
                                  }}
                                />
                                <InputPrice
                                  label="AUI:"
                                  size="full"
                                  value={servicioConfig?.aui?.toString() || ""}
                                  onChange={(e) => {
                                    actualizarServicioConfigurado(
                                      item,
                                      "aui",
                                      Number(e.target.value),
                                    );
                                  }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Section>
  );
}
