import {
  createFileRoute,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { Section } from "../../../components/ui/dashboard/Section";
import {
  ArrowLeftIcon,
  Calculator,
  ChevronDown,
  Clock,
  PlusIcon,
  Search,
  UserCheck,
} from "lucide-react";
import { usePeriodoById } from "../../../api/queryFunctions/tarifas/periodo";
import {
  useServicios,
  useTipoServicios,
} from "../../../api/queryFunctions/servicios";
import { InputPrice } from "../../../components/common/InputPrice";
import { InputSelect } from "../../../components/common/InputSelect";
import type { Servicio } from "../../../api/types/servicio";
import { useState } from "react";

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
  const [itemSeleccionado, setItemSeleccionado] = useState<Servicio | null>(
    null,
  );
  const [mostrarSoloSeleccionados, setMostrarSoloSeleccionados] =
    useState(false);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState<
    Servicio[]
  >([]);

  // Queries y mutaciones
  const { data: periodo } = usePeriodoById(Number(idPeriodoParam));
  const { data: servicios } = useServicios();
  const { data: tiposServicios } = useTipoServicios();

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
            onClick={() => {}}
          />
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span className="text-sm font-medium text-gray-700">
                Servicios Seleccionados: 1
              </span>
            </div>
            {/* <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">
                        Total Estimado: $ {totalPrecioEstimado.toLocaleString("es-ES")}
                      </span>
                    </div> */}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mostrarSoloSeleccionados"
              // checked={mostrarSoloSeleccionados}
              // onChange={(e) => setMostrarSoloSeleccionados(e.target.checked)}
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
                // value={searchTerm}
                // onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="relative w-48">
            <select
              // value={filtroTipoServicio || ""}
              // onChange={(e) => setFiltroTipoServicio(e.target.value ? Number(e.target.value) : null)}
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
          {servicios?.data?.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No hay servicios disponibles
            </div>
          ) : (
            servicios?.data?.map((item) => (
              <div key={item.idServicio} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-1 items-center gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={
                          itemSeleccionado?.idServicio === item.idServicio
                        }
                        onChange={(e) => {
                          if (
                            itemSeleccionado?.idServicio === item.idServicio
                          ) {
                            setItemSeleccionado(null);
                          } else {
                            setItemSeleccionado(item);
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
                          <UserCheck
                            className="h-4 w-4 text-blue-500"
                            // title="Requiere Personal"
                          />
                        )}
                      </div>
                      <p className="mb-2 text-sm text-gray-600">
                        {item.descripcion}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {itemSeleccionado?.idServicio === item.idServicio && (
                      <div className="flex items-center gap-2">
                        <InputSelect
                          label="Tipo de tarifa:"
                          options={[]}
                          placeholder="Selecciona un tipo de tarifa"
                          id="tipoTarifa"
                          value={""}
                          onChange={(value) => {
                            console.log(value);
                          }}
                        />
                        <InputPrice
                          label="Precio Base:"
                          value={0}
                          onChange={(value) => {
                            console.log(value);
                          }}
                        />
                        <InputPrice
                          label="Precio Base:"
                          value={0}
                          onChange={(value) => {
                            console.log(value);
                          }}
                        />
                        <InputPrice
                          label="Precio Base:"
                          value={0}
                          onChange={(value) => {
                            console.log(value);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Section>
  );
}
