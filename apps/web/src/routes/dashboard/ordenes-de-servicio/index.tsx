import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import {
  Building2,
  Calendar,
  Check,
  ChevronDown,
  EyeIcon,
  FileText,
  Mail,
  MapPin,
  PencilIcon,
  Phone,
  PlusIcon,
  Search,
  Trash2,
  TrashIcon,
  User,
  Users,
  Users2,
  XIcon,
} from "lucide-react";
import Table from "../../../components/common/Table";
import { StateLabel } from "../../../components/common/StateLabel";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/ordenes-de-servicio/")({
  component: RouteComponent,
});

interface OrdenesDeServicio {
  idEstadoOrdenServicio: number;
  localizacion: {
    idLocalizacion: number;
    nombre: string;
    direccion: string;
  };
  servicio: string;
  personal: {
    idPersonal: number;
    nombre: string;
    apellido: string;
  }[];
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

const locations = [
  {
    id: 1,
    name: "Centro Comercial Plaza Mayor",
    company: "Inversiones Plaza S.A.S",
    address: "Calle 123 #45-67, Bogotá",
    contact: "María González",
    phone: "+57 301 234 5678",
  },
  {
    id: 2,
    name: "Edificio Corporativo Torre Norte",
    company: "Corporación Norte Ltda",
    address: "Carrera 15 #85-32, Bogotá",
    contact: "Carlos Rodríguez",
    phone: "+57 302 345 6789",
  },
  {
    id: 3,
    name: "Conjunto Residencial Los Pinos",
    company: "Administración Los Pinos",
    address: "Calle 67 #23-45, Medellín",
    contact: "Ana Martínez",
    phone: "+57 303 456 7890",
  },
];

const serviceCategories = [
  { id: "control-acceso", name: "Control de Acceso" },
  { id: "videovigilancia", name: "Videovigilancia" },
  { id: "patrullaje", name: "Patrullaje" },
  { id: "supervision", name: "Supervisión" },
  { id: "eventos", name: "Eventos" },
];

const services = [
  {
    id: 1,
    name: "Control de Acceso 24/7",
    description: "Servicio de control de acceso las 24 horas del día",
    category: "control-acceso",
    price: 150000,
  },
  {
    id: 2,
    name: "Control de Acceso Diurno",
    description: "Servicio de control de acceso en horario diurno",
    category: "control-acceso",
    price: 80000,
  },
  {
    id: 3,
    name: "Videovigilancia Remota",
    description: "Monitoreo remoto de cámaras de seguridad",
    category: "videovigilancia",
    price: 200000,
  },
  {
    id: 4,
    name: "Videovigilancia en Sitio",
    description: "Monitoreo presencial de cámaras de seguridad",
    category: "videovigilancia",
    price: 120000,
  },
  {
    id: 5,
    name: "Patrullaje Perimetral",
    description: "Servicio de patrullaje en perímetro de la instalación",
    category: "patrullaje",
    price: 120000,
  },
  {
    id: 6,
    name: "Patrullaje Vehicular",
    description: "Servicio de patrullaje vehicular en la zona",
    category: "patrullaje",
    price: 180000,
  },
  {
    id: 7,
    name: "Supervisión de Seguridad",
    description: "Supervisión y coordinación de personal de seguridad",
    category: "supervision",
    price: 180000,
  },
  {
    id: 8,
    name: "Supervisión Nocturna",
    description: "Supervisión especializada en horario nocturno",
    category: "supervision",
    price: 220000,
  },
  {
    id: 9,
    name: "Seguridad para Eventos",
    description: "Servicio especializado para eventos y actividades especiales",
    category: "eventos",
    price: 250000,
  },
  {
    id: 10,
    name: "Seguridad VIP",
    description: "Servicio de seguridad personalizada para eventos VIP",
    category: "eventos",
    price: 350000,
  },
];

const employees = [
  {
    id: 1,
    name: "Juan Carlos Pérez López",
    position: "Supervisor de Seguridad",
    email: "juan.perez@gevid.com",
    phone: "+57 310 123 4567",
    skills: ["Control de Acceso", "Videovigilancia", "Supervisión"],
  },
  {
    id: 2,
    name: "María Elena Rodríguez",
    position: "Agente de Seguridad",
    email: "maria.rodriguez@gevid.com",
    phone: "+57 311 234 5678",
    skills: ["Patrullaje", "Control de Acceso"],
  },
  {
    id: 3,
    name: "Carlos Alberto Gómez",
    position: "Técnico en Videovigilancia",
    email: "carlos.gomez@gevid.com",
    phone: "+57 312 345 6789",
    skills: ["Videovigilancia", "Eventos"],
  },
];

function RouteComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpenDetails, setIsOpenDetails] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);

  // Form states
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedServiceCategory, setSelectedServiceCategory] =
    useState<string>("");
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [staffQuantity, setStaffQuantity] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isIndefinite, setIsIndefinite] = useState(false);
  const [timeRanges, setTimeRanges] = useState([
    { id: 1, startTime: "08:00", endTime: "12:00" },
    { id: 2, startTime: "13:00", endTime: "17:00" },
  ]);
  const [assignedEmployees, setAssignedEmployees] = useState<any[]>([]);

  const [selectedEmployeeForSlot, setSelectedEmployeeForSlot] = useState<{
    [key: number]: number;
  }>({});

  // Sample data for order details modal
  const [selectedOrderDetail, setSelectedOrderDetail] = useState({
    locationDetails: {
      nombre: "Centro Comercial Plaza Mayor",
      empresa: "Inversiones Plaza S.A.S",
      direccion: "Calle 123 #45-67, Bogotá D.C.",
      primerNombreResponsable: "María González",
      telefono: "+57 301 234 5678",
      email: "maria.gonzalez@plazamayor.com",
    },
    serviceDetails: {
      nombre: "Control de Acceso 24/7",
      idServicio: "control-acceso",
      precio: 150000,
      descripcion:
        "Servicio de control de acceso las 24 horas del día los 7 días de la semana",
      categoria: "Control de Acceso",
    },
    fechaInicio: "2024-01-15",
    fechaFin: "",
    isIndefinite: true,
    cantidadPersonal: 3,
    horarios: [
      { id: 1, horaInicio: "06:00", horaFin: "14:00" },
      { id: 2, horaInicio: "14:00", horaFin: "22:00" },
      { id: 3, horaInicio: "22:00", horaFin: "06:00" },
    ],
    personal: [
      {
        idPersonal: 1,
        primerNombre: "Juan Carlos",
        primerApellido: "Pérez López",
        email: "juan.perez@videlca.com",
        telefono: "+57 310 123 4567",
        idRol: "Supervisor de Seguridad",
        idTipoPersonal: "Supervisor",
        notas:
          "Responsable del turno diurno, experiencia en manejo de equipos de seguridad",
        habilidades: [
          "Control de Acceso",
          "Videovigilancia",
          "Supervisión",
          "Manejo de Personal",
        ],
      },
      {
        idPersonal: 2,
        primerNombre: "María Elena",
        primerApellido: "Rodríguez Silva",
        email: "maria.rodriguez@videlca.com",
        telefono: "+57 311 234 5678",
        idRol: "Agente de Seguridad",
        idTipoPersonal: "Agente",
        notas: "Especializada en control de acceso y atención al cliente",
        habilidades: [
          "Control de Acceso",
          "Atención al Cliente",
          "Primeros Auxilios",
        ],
      },
      {
        idPersonal: 3,
        primerNombre: "Carlos Alberto",
        primerApellido: "Gómez Herrera",
        email: "carlos.gomez@videlca.com",
        telefono: "+57 312 345 6789",
        idRol: "Agente de Seguridad",
        idTipoPersonal: "Agente Nocturno",
        notas: "Especializado en turnos nocturnos y vigilancia perimetral",
        habilidades: ["Patrullaje Nocturno", "Control de Acceso", "Vigilancia"],
      },
    ],
    estado: "Activo",
    fechaCreacion: "2024-01-10",
    observaciones:
      "Orden de servicio para centro comercial de alto tráfico. Requiere personal con experiencia en manejo de multitudes y protocolos de emergencia.",
  });

  // Filter services by category
  const filteredServices = selectedServiceCategory
    ? services.filter((service) => service.category === selectedServiceCategory)
    : [];

  const resetForm = () => {
    setSelectedLocation(null);
    setSelectedServiceCategory("");
    setSelectedService(null);
    setStaffQuantity(1);
    setStartDate("");
    setEndDate("");
    setIsIndefinite(false);
    setTimeRanges([
      { id: 1, startTime: "08:00", endTime: "12:00" },
      { id: 2, startTime: "13:00", endTime: "17:00" },
    ]);
    setAssignedEmployees([]);
    setSelectedEmployeeForSlot({});
  };

  const loadOrderData = (orderId: number) => {
    const order = ordenesDeServicio.find(
      (o) => o.idEstadoOrdenServicio === orderId,
    );
    if (order) {
      setSelectedLocation(order.localizacion.idLocalizacion);
      setSelectedService(Number(order.servicio));

      const service = services.find((s) => s.id === Number(order.servicio));
      if (service) {
        setSelectedServiceCategory(service.category);
      }

      setStaffQuantity(order.personal.length);
      setStartDate(order.fechaInicio);
      setEndDate(order.fechaFin);
      setIsIndefinite(order.fechaFin === "");
      setTimeRanges(
        order.personal.map((emp, index) => ({
          id: index + 1,
          startTime: "08:00",
          endTime: "12:00",
        })),
      );
      setAssignedEmployees(order.personal.map((emp) => emp.idPersonal));

      const initialEmployeeSlots: { [key: number]: number } = {};
      order.personal.forEach((emp, index) => {
        initialEmployeeSlots[index] = emp.idPersonal;
      });
      setSelectedEmployeeForSlot(initialEmployeeSlots);
    }
  };

  const handleOpenModal = (orderId?: number) => {
    if (orderId) {
      setIsEditing(true);
      setEditingOrderId(orderId);
      loadOrderData(orderId);
    } else {
      setIsEditing(false);
      setEditingOrderId(null);
      resetForm();
    }
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentStep(1);
    setIsEditing(false);
    setEditingOrderId(null);
    resetForm();
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveOrder = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log(isEditing ? "Actualizando orden:" : "Creando orden:", {
        id: editingOrderId,
        location: selectedLocation,
        service: selectedService,
        staffQuantity,
        startDate,
        endDate,
        isIndefinite,
        timeRanges,
        assignedEmployees,
      });

      toast.success(
        isEditing
          ? "Orden actualizada exitosamente"
          : "Orden creada exitosamente",
      );
      handleCloseModal();
    } catch (error) {
      toast.error("Error al guardar la orden");
    } finally {
      setIsLoading(false);
    }
  };

  const addTimeRange = () => {
    const newId =
      timeRanges.length > 0 ? Math.max(...timeRanges.map((r) => r.id)) + 1 : 1;
    setTimeRanges([
      ...timeRanges,
      { id: newId, startTime: "09:00", endTime: "18:00" },
    ]);
  };

  const removeTimeRange = (id: number) => {
    if (timeRanges.length > 1) {
      setTimeRanges(timeRanges.filter((range) => range.id !== id));
    }
  };

  const updateTimeRange = (
    id: number,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setTimeRanges(
      timeRanges.map((range) =>
        range.id === id ? { ...range, [field]: value } : range,
      ),
    );
  };

  const handleDeleteOrder = (orderId: number) => {
    setDeleteOrderId(orderId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (deleteOrderId) {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        alert("Orden eliminada exitosamente");
        setShowDeleteConfirm(false);
        setDeleteOrderId(null);
      } catch (error) {
        alert("Error al eliminar la orden");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEmployeeSelection = (slotIndex: number, employeeId: number) => {
    setSelectedEmployeeForSlot((prev) => ({
      ...prev,
      [slotIndex]: employeeId,
    }));
  };

  const getSelectedEmployeeInfo = (slotIndex: number) => {
    const employeeId = selectedEmployeeForSlot[slotIndex];
    return employees.find((emp) => emp.id === employeeId);
  };

  useEffect(() => {
    setSelectedService(null);
  }, [selectedServiceCategory]);
  const ordenesDeServicio: OrdenesDeServicio[] = [
    {
      idEstadoOrdenServicio: 1,
      localizacion: {
        idLocalizacion: 1,
        nombre: "Localización 1",
        direccion: "Dirección 1",
      },
      servicio: "Servicio 1",
      personal: [
        {
          idPersonal: 1,
          nombre: "Juan",
          apellido: "Perez",
        },
      ],
      fechaInicio: "2021-01-01",
      fechaFin: "2021-01-01",
      estado: "Activo",
    },
    {
      idEstadoOrdenServicio: 2,
      localizacion: {
        idLocalizacion: 2,
        nombre: "Localización 2",
        direccion: "Dirección 2",
      },
      servicio: "Servicio 2",
      personal: [],
      fechaInicio: "2021-01-01",
      fechaFin: "2021-01-01",
      estado: "Inactivo",
    },
  ];

  const columns: ColumnDef<OrdenesDeServicio>[] = [
    {
      accessorKey: "idEstadoOrdenServicio",
      header: "ID",
      cell: ({ row }) => (
        <span className="font-medium text-gray-500">
          {row.original.idEstadoOrdenServicio}
        </span>
      ),
    },
    {
      accessorKey: "localizacion",
      header: "Localización",
      cell: ({ row }) => (
        <span className="flex flex-col gap-1 font-medium text-black">
          {row.original.localizacion.nombre}
          <span className="text-sm text-gray-500">
            {row.original.localizacion.direccion}
          </span>
        </span>
      ),
    },
    {
      accessorKey: "servicio",
      header: "Servicio",
      cell: ({ row }) => (
        <span className="font-medium text-gray-500">
          {row.original.servicio}
        </span>
      ),
    },
    {
      accessorKey: "personal",
      header: "Personal",
      cell: ({ row }) => (
        <span className="flex items-center gap-2 font-medium text-gray-500">
          {" "}
          <Users2 className="h-4 w-4" /> {row.original.personal.length}{" "}
          empleados
        </span>
      ),
    },
    {
      accessorKey: "fechas",
      header: "Fechas",
      cell: ({ row }) => (
        <span className="font-medium text-gray-500">
          {row.original.fechaInicio} - {row.original.fechaFin}
        </span>
      ),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => <StateLabel state={row.getValue("estado")} />,
    },
    {
      accessorKey: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <ButtonAction
              Icon={PencilIcon}
              label=""
              onClick={() => {
                setIsEditing(true);
                setIsOpen(true);
                setCurrentStep(1);
              }}
            />
            <ButtonAction
              Icon={EyeIcon}
              label=""
              onClick={() => {
                setIsOpenDetails(true);
              }}
            />
            <ButtonAction
              Icon={TrashIcon}
              label=""
              onClick={() => {
                setIsOpenDelete(true);
              }}
              color="red"
            />
          </div>
        );
      },
    },
  ];
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Seleccionar Localización
              </h3>
              <p className="text-sm text-gray-600">
                Busque y seleccione el cliente y la localización donde se
                prestará el servicio
              </p>
            </div>

            <div className="relative">
              <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre del cliente, localización o dirección..."
                className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="max-h-80 space-y-3 overflow-y-auto">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                    selectedLocation === location.id
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}
                  onClick={() => setSelectedLocation(location.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <h4 className="font-medium text-gray-900">
                          {location.name}
                        </h4>
                        {selectedLocation === location.id && (
                          <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="mb-1 flex items-center gap-1 text-sm text-gray-600">
                        <Building2 className="h-3 w-3" />
                        <span>{location.company}</span>
                      </div>
                      <div className="mb-1 flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span>{location.address}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{location.contact}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{location.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Servicio a Prestar
              </h3>
              <p className="text-sm text-gray-600">
                Seleccione el tipo de servicio que se prestará
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Tipo de Servicio *
                </label>
                <div className="relative mt-1">
                  <select
                    value={selectedServiceCategory}
                    onChange={(e) => setSelectedServiceCategory(e.target.value)}
                    className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Seleccione el tipo de servicio...</option>
                    {serviceCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {selectedServiceCategory && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    Servicios Disponibles
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {filteredServices.map((service) => (
                      <div
                        key={service.id}
                        className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                          selectedService === service.id
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                        onClick={() => setSelectedService(service.id)}
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {service.name}
                          </h4>
                          {selectedService === service.id && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="mb-3 text-xs text-gray-600">
                          {service.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                            {
                              serviceCategories.find(
                                (cat) => cat.id === service.category,
                              )?.name
                            }
                          </span>
                          <span className="font-semibold text-blue-600">
                            $ {service.price.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedServiceCategory && filteredServices.length === 0 && (
                <div className="py-8 text-center text-gray-500">
                  No hay servicios disponibles para esta categoría
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Fechas y Horarios de Servicio
              </h3>
              <p className="text-sm text-gray-600">
                Configure las fechas y los horarios durante el día para prestar
                el servicio
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Período de Servicio</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={isIndefinite}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="indefinite"
                  checked={isIndefinite}
                  onChange={(e) => {
                    setIsIndefinite(e.target.checked);
                    if (e.target.checked) {
                      setEndDate("");
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="indefinite" className="text-sm text-gray-700">
                  Orden de servicio indefinida (sin fecha de finalización)
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">
                  Horarios Durante el Día
                </h4>
                <button
                  type="button"
                  className="px-0 py-0 text-sm font-medium text-blue-600 hover:text-blue-700"
                  onClick={addTimeRange}
                >
                  + Agregar Rango de Horario
                </button>
              </div>

              <div className="space-y-4">
                {timeRanges.map((range, index) => (
                  <div
                    key={range.id}
                    className="rounded-lg border border-gray-200 p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Rango de Horario #{index + 1}
                      </label>
                      {timeRanges.length > 1 && (
                        <button
                          type="button"
                          className="rounded-md p-1 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                          onClick={() => removeTimeRange(range.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-700">
                          Hora de Inicio
                        </label>
                        <input
                          type="time"
                          value={range.startTime}
                          onChange={(e) =>
                            updateTimeRange(
                              range.id,
                              "startTime",
                              e.target.value,
                            )
                          }
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-700">
                          Hora de Fin
                        </label>
                        <input
                          type="time"
                          value={range.endTime}
                          onChange={(e) =>
                            updateTimeRange(range.id, "endTime", e.target.value)
                          }
                          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Personal y Asignación
              </h3>
              <p className="text-sm text-gray-600">
                Define cuánto personal necesita y asígnelo inmediatamente
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="quantity"
                  className="text-sm font-medium text-gray-700"
                >
                  Cantidad de Personal Requerido *
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max="10"
                  value={staffQuantity}
                  onChange={(e) =>
                    setStaffQuantity(Number.parseInt(e.target.value) || 1)
                  }
                  className="mt-1 w-32 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  Buscar Empleados Disponibles
                </label>
                <div className="relative mb-4">
                  <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, apellido o cargo..."
                    className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-medium text-gray-700">
                  Asignación de Personal ({staffQuantity} requeridos)
                </label>

                <div className="space-y-4">
                  {Array.from({ length: staffQuantity }, (_, index) => {
                    const selectedEmployee = getSelectedEmployeeInfo(index);

                    return (
                      <div
                        key={index}
                        className="rounded-lg border border-gray-200 p-4 shadow-sm"
                      >
                        <div className="mb-4 border-b border-gray-200 pb-3">
                          <h3 className="text-base font-semibold text-gray-900">
                            Empleado #{index + 1}
                          </h3>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-gray-700">
                                Seleccionar Empleado *
                              </label>
                              <div className="relative mt-1">
                                <select
                                  value={
                                    selectedEmployeeForSlot[
                                      index
                                    ]?.toString() || ""
                                  }
                                  onChange={(e) =>
                                    handleEmployeeSelection(
                                      index,
                                      Number.parseInt(e.target.value),
                                    )
                                  }
                                  className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                  <option value="">
                                    Seleccionar empleado...
                                  </option>
                                  {employees.map((employee) => (
                                    <option
                                      key={employee.id}
                                      value={employee.id.toString()}
                                    >
                                      {employee.name} - {employee.position}
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              </div>
                            </div>
                            <div>
                              <label className="text-sm text-gray-700">
                                Rol en esta Orden *
                              </label>
                              <input
                                type="text"
                                placeholder="Ej: Supervisor, Guardia, etc."
                                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-sm text-gray-700">
                              Notas Adicionales
                            </label>
                            <textarea
                              placeholder="Instrucciones específicas para este empleado..."
                              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              rows={3}
                            />
                          </div>

                          {selectedEmployee && (
                            <div className="rounded-lg bg-gray-50 p-3">
                              <div className="mb-2 flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <span>{selectedEmployee.email}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{selectedEmployee.phone}</span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {selectedEmployee.skills.map(
                                  (skill, skillIndex) => (
                                    <span
                                      key={skillIndex}
                                      className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700"
                                    >
                                      {skill}
                                    </span>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="flex justify-end">
          <ButtonAction
            Icon={PlusIcon}
            label="Agregar orden de servicio"
            onClick={() => {
              setIsOpen(true);
              setIsEditing(false);
            }}
          />
        </div>
        <Table
          columns={columns}
          data={ordenesDeServicio}
          enableFiltering={true}
        />
      </div>

      <SimpleModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setIsEditing(false);
        }}
        title={
          isEditing ? "Editar orden de servicio" : "Agregar orden de servicio"
        }
        size="2xl"
      >
        <>
          {/* Step Indicator */}
          <div className="flex items-center justify-center px-6 py-6">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    step < currentStep
                      ? "bg-green-500 text-white"
                      : step === currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step < currentStep ? <Check className="h-4 w-4" /> : step}
                </div>
                {step < 4 && (
                  <div
                    className={`mx-2 h-0.5 w-16 ${step < currentStep ? "bg-green-500" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 px-6 pt-6 pb-4">
            <div className="text-sm text-gray-500">Paso {currentStep} de 4</div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                onClick={() => {
                  setIsOpen(false);
                  setIsEditing(false);
                  setCurrentStep(1);
                  setSelectedLocation(null);
                  setSelectedService(null);
                }}
              >
                Cancelar
              </button>
              {currentStep > 1 && (
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                  onClick={handlePrevious}
                >
                  Anterior
                </button>
              )}
              <button
                type="button"
                onClick={currentStep < 4 ? handleNext : handleSaveOrder}
                disabled={
                  isLoading ||
                  (currentStep === 1 && !selectedLocation) ||
                  (currentStep === 2 && !selectedService) ||
                  (currentStep === 3 && !startDate) ||
                  (currentStep === 4 && staffQuantity < 1)
                }
                className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
                  currentStep < 4
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                } ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    {isEditing ? "Actualizando..." : "Creando..."}
                  </div>
                ) : currentStep < 4 ? (
                  "Siguiente"
                ) : isEditing ? (
                  "Actualizar Orden"
                ) : (
                  "Crear Orden"
                )}
              </button>
            </div>
          </div>
        </>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenDetails}
        onClose={() => {
          setIsOpenDetails(false);
        }}
        title="Detalles de la orden de servicio"
        size="2xl"
      >
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Sección de Localización */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <MapPin className="h-5 w-5 text-blue-600" />
              Localización
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm text-gray-700 md:grid-cols-2">
              <div>
                <p>
                  <span className="font-medium">Nombre:</span>{" "}
                  {selectedOrderDetail.locationDetails?.nombre}
                </p>
                <p>
                  <span className="font-medium">Empresa:</span>{" "}
                  {selectedOrderDetail.locationDetails?.direccion}
                </p>
                <p>
                  <span className="font-medium">Dirección:</span>{" "}
                  {selectedOrderDetail.locationDetails?.direccion}
                </p>
              </div>
              <div>
                <p>
                  <span className="font-medium">Contacto:</span>{" "}
                  {selectedOrderDetail.locationDetails?.primerNombreResponsable}
                </p>
                <p>
                  <span className="font-medium">Teléfono:</span>{" "}
                  {selectedOrderDetail.locationDetails?.telefono}
                </p>
              </div>
            </div>
          </div>

          {/* Sección de Servicio */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <FileText className="h-5 w-5 text-blue-600" />
              Servicio
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm text-gray-700 md:grid-cols-2">
              <div>
                <p>
                  <span className="font-medium">Nombre:</span>{" "}
                  {selectedOrderDetail.serviceDetails?.nombre}
                </p>
                <p>
                  <span className="font-medium">Categoría:</span>{" "}
                  {
                    serviceCategories.find(
                      (cat) =>
                        cat.id ===
                        selectedOrderDetail.serviceDetails?.idServicio,
                    )?.name
                  }
                </p>
              </div>
              <div>
                <p>
                  <span className="font-medium">Precio:</span> ${" "}
                  {selectedOrderDetail.serviceDetails?.precio.toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">Descripción:</span>{" "}
                  {selectedOrderDetail.serviceDetails?.descripcion}
                </p>
              </div>
            </div>
          </div>

          {/* Sección de Fechas y Horarios */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Calendar className="h-5 w-5 text-blue-600" />
              Fechas y Horarios
            </h3>
            <div className="grid grid-cols-1 gap-4 text-sm text-gray-700 md:grid-cols-2">
              <div>
                <p>
                  <span className="font-medium">Fecha de Inicio:</span>{" "}
                  {new Date(selectedOrderDetail.fechaInicio).toLocaleDateString(
                    "es-ES",
                  )}
                </p>
                <p>
                  <span className="font-medium">Fecha de Fin:</span>{" "}
                  {selectedOrderDetail.fechaFin
                    ? "Indefinida"
                    : new Date(selectedOrderDetail.fechaFin).toLocaleDateString(
                        "es-ES",
                      )}
                </p>
              </div>
              <div>
                <p className="mb-1 font-medium">Rangos de Horario:</p>
                <ul className="list-inside list-disc">
                  {selectedOrderDetail.horarios.map((range: any) => (
                    <li key={range.id}>
                      {range.horaInicio} - {range.horaFin}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Sección de Personal Asignado */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Users className="h-5 w-5 text-blue-600" />
              Personal Asignado ({selectedOrderDetail.cantidadPersonal}{" "}
              requerido)
            </h3>
            <div className="space-y-4">
              {selectedOrderDetail.personal.map(
                (assigned: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <p className="mb-2 font-medium text-gray-900">
                      Empleado #{index + 1}: {assigned.primerNombre}{" "}
                      {assigned.primerApellido}
                    </p>
                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 md:grid-cols-2">
                      <p>
                        <span className="font-medium">Rol:</span>{" "}
                        {assigned.idRol}
                      </p>
                      <p>
                        <span className="font-medium">Posición:</span>{" "}
                        {assigned.idTipoPersonal}
                      </p>
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {assigned.email}
                      </p>
                      <p>
                        <span className="font-medium">Teléfono:</span>{" "}
                        {assigned.telefono}
                      </p>
                    </div>
                    {assigned.notes && (
                      <p className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Notas:</span>{" "}
                        {assigned.notas}
                      </p>
                    )}
                    {assigned.habilidades &&
                      assigned.habilidades.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {assigned.habilidades.map(
                            (skill: string, skillIndex: number) => (
                              <span
                                key={skillIndex}
                                className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                              >
                                {skill}
                              </span>
                            ),
                          )}
                        </div>
                      )}
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Sección de Estado */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Check className="h-5 w-5 text-blue-600" />
              Estado
            </h3>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                selectedOrderDetail.estado === "Activo"
                  ? "bg-green-100 text-green-800"
                  : selectedOrderDetail.estado === "Pendiente"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {selectedOrderDetail.estado === "Activo"
                ? "Activa"
                : selectedOrderDetail.estado === "Pendiente"
                  ? "Pendiente"
                  : "Completada"}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-end border-t border-gray-200 px-6 pt-6 pb-4">
          <button
            type="button"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            onClick={() => setIsOpenDetails(false)}
          >
            Cerrar
          </button>
        </div>
      </SimpleModal>

      <SimpleModal
        isOpen={isOpenDelete}
        onClose={() => {
          setIsOpenDelete(false);
        }}
        size="md"
      >
        <div className="text-center text-lg font-medium">
          ¿Estás seguro de querer eliminar esta orden de servicio?
        </div>
        <div className="flex justify-center gap-2 pt-4">
          <ButtonAction
            Icon={XIcon}
            label="Cancelar"
            onClick={() => {
              setIsOpenDelete(false);
            }}
          />
          <ButtonAction
            Icon={TrashIcon}
            label="Eliminar"
            onClick={() => {}}
            color="red"
          />
        </div>
      </SimpleModal>
    </Section>
  );
}
