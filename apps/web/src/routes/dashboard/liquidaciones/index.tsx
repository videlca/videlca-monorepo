import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Section } from "../../../components/ui/dashboard/Section";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { PlusIcon, Search } from "lucide-react";
import { getYear, subYears } from "date-fns";
import { InputSelect } from "../../../components/common/InputSelect";

export const Route = createFileRoute("/dashboard/liquidaciones/")({
  component: RouteComponent,
});

interface ServiceOrder {
  id: string;
  cliente: string;
  puesto: string;
  fechaInicio: string;
  fechaFin: string;
  fechaCreacion: string;
  descripcion: string;
  estado: "pendiente" | "en_progreso" | "completado";
  tecnico: string;
}

interface OrderGroup {
  id: string;
  nombre: string;
  ordenes: ServiceOrder[];
  fechaCreacion: string;
}

function RouteComponent() {
  const [searchMonth, setSearchMonth] = useState("");
  const [searchYear, setSearchYear] = useState("");
  const [searchResults, setSearchResults] = useState<ServiceOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Datos de ejemplo para simular órdenes de servicio
  const mockOrders: ServiceOrder[] = [
    {
      id: "OS-001",
      cliente: "Empresa ABC S.A.",
      puesto: "Torre Norte - Piso 15",
      fechaInicio: "2024-01-15",
      fechaFin: "2024-01-20",
      fechaCreacion: "2024-01-10",
      descripcion: "Mantenimiento preventivo de sistemas de climatización",
      estado: "completado",
      tecnico: "Juan Pérez",
    },
    {
      id: "OS-002",
      cliente: "Corporación XYZ",
      puesto: "Edificio Central - Sala de Servidores",
      fechaInicio: "2024-01-22",
      fechaFin: "2024-01-25",
      fechaCreacion: "2024-01-18",
      descripcion: "Instalación de nuevo sistema de seguridad",
      estado: "en_progreso",
      tecnico: "María González",
    },
    {
      id: "OS-003",
      cliente: "Industrias DEF",
      puesto: "Planta de Producción - Área 3",
      fechaInicio: "2024-01-28",
      fechaFin: "2024-02-02",
      fechaCreacion: "2024-01-25",
      descripcion: "Reparación de maquinaria industrial",
      estado: "pendiente",
      tecnico: "Carlos Rodríguez",
    },
    {
      id: "OS-004",
      cliente: "Servicios GHI Ltda.",
      puesto: "Oficinas Administrativas - Piso 8",
      fechaInicio: "2024-02-05",
      fechaFin: "2024-02-08",
      fechaCreacion: "2024-02-01",
      descripcion: "Actualización de red de comunicaciones",
      estado: "pendiente",
      tecnico: "Ana Martínez",
    },
  ];

  const handleSearch = () => {
    setIsLoading(true);

    // Simular búsqueda con delay
    setTimeout(() => {
      const filtered = mockOrders.filter((order) => {
        const orderDate = new Date(order.fechaCreacion);
        const orderMonth = orderDate.getMonth() + 1;
        const orderYear = orderDate.getFullYear();

        const matchMonth =
          !searchMonth || orderMonth.toString() === searchMonth;
        const matchYear = !searchYear || orderYear.toString() === searchYear;

        return matchMonth && matchYear;
      });

      setSearchResults(filtered);
      setSelectedOrders([]);
      setIsLoading(false);
    }, 1000);
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId],
    );
  };

  const createGroup = () => {
    if (!groupName.trim() || selectedOrders.length === 0) return;

    const selectedOrdersData = searchResults.filter((order) =>
      selectedOrders.includes(order.id),
    );

    const newGroup: OrderGroup = {
      id: `GRP-${Date.now()}`,
      nombre: groupName,
      ordenes: selectedOrdersData,
      fechaCreacion: new Date().toISOString().split("T")[0],
    };

    const existingGroups = JSON.parse(
      localStorage.getItem("orderGroups") || "[]",
    );
    const updatedGroups = [...existingGroups, newGroup];
    localStorage.setItem("orderGroups", JSON.stringify(updatedGroups));

    setSelectedOrders([]);
    setGroupName("");

    alert(`Grupo "${groupName}" creado exitosamente`);
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "completado":
        return "bg-green-100 text-green-800 border-green-200";
      case "en_progreso":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pendiente":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

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

  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Filtros de Búsqueda</h2>
          <p className="mb-4 text-sm text-gray-500">
            Selecciona el mes y año para filtrar las órdenes de servicio.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-48 flex-1">
              <InputSelect
                label="Mes"
                placeholder="Selecciona un mes"
                id="searchMonth"
                value={searchMonth}
                onChange={(e) => setSearchMonth(e.target.value)}
                options={monthsOptions}
              />
            </div>

            <div className="min-w-48 flex-1">
              <InputSelect
                label="Año"
                placeholder="Selecciona un año"
                id="searchYear"
                value={searchYear}
                onChange={(e) => setSearchYear(e.target.value)}
                options={yearsOptions as { id: number; descripcion: string }[]}
              />
            </div>
            <ButtonAction
              onClick={handleSearch}
              disabled={isLoading}
              Icon={Search}
              label={isLoading ? "Buscando..." : "Buscar"}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4 rounded-lg border border-gray-300 bg-white p-6 shadow-sm">
          {/* Group Creation */}

          <div className="border-b border-gray-300 pb-4">
            <h3 className="mb-3 text-lg font-semibold">Crear Grupo</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Nombre del grupo"
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                disabled={selectedOrders.length === 0}
              />
              <ButtonAction
                onClick={createGroup}
                disabled={!groupName.trim()}
                Icon={PlusIcon}
                label="Crear Grupo"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Los grupos creados se pueden visualizar en la pestaña "Grupos de
              Órdenes"
            </p>
          </div>

          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Resultados ({searchResults.length} órdenes encontradas)
            </h2>
            {selectedOrders.length > 0 && (
              <span className="text-sm text-gray-500">
                {selectedOrders.length} seleccionadas
              </span>
            )}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((order) => (
              <div
                key={order.id}
                onClick={() => toggleOrderSelection(order.id)}
                className={`cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md ${
                  selectedOrders.includes(order.id)
                    ? "border-blue-400 bg-blue-100/40 shadow-sm"
                    : "border-gray-300 bg-white hover:border-gray-500"
                }`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900">{order.id}</h3>
                  <span
                    className={`rounded-full border px-2 py-1 text-xs ${getStatusColor(order.estado)}`}
                  >
                    {order.estado.replace("_", " ")}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-500">Cliente:</span>
                    <p className="text-gray-900">{order.cliente}</p>
                  </div>

                  <div>
                    <span className="font-medium text-gray-500">Puesto:</span>
                    <p className="text-gray-900">{order.puesto}</p>
                  </div>

                  <div className="border-border mt-2 grid grid-cols-2 gap-2 border-t pt-2">
                    <div>
                      <span className="font-medium text-gray-500">Inicio:</span>
                      <p className="text-gray-900">
                        {new Date(order.fechaInicio).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Fin:</span>
                      <p className="text-gray-900">
                        {new Date(order.fechaFin).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
