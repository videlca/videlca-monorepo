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
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import {
  useCreateOrdenServicio,
  useGetOrdenesServicio,
} from "../../../api/queryFunctions/orden-servicio";
import type { CreateOrdenServicioDto } from "../../../api/dtos";
import type { OrdenServicio } from "../../../api/types/orden-servicio";
import { useLocacionesActivo } from "../../../api/queryFunctions/clientes";
import {
  useServiciosActivo,
  useTipoServiciosActivo,
} from "../../../api/queryFunctions/servicios";
import { InputSelect } from "../../../components/common/InputSelect";
import {
  useTarifasActivo,
  useTarifasPeriodoActivo,
} from "../../../api/queryFunctions/tarifas";

export const Route = createFileRoute("/dashboard/ordenes-de-servicio/")({
  component: RouteComponent,
});

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

  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);

  // Form states
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [selectedTipoServicio, setSelectedTipoServicio] = useState<
    number | null
  >(null);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedTarifa, setSelectedTarifa] = useState<number | null>(null);
  const [staffQuantity, setStaffQuantity] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isIndefinite, setIsIndefinite] = useState(false);
  const [isServicio24Horas, setIsServicio24Horas] = useState(false);
  const [timeRanges, setTimeRanges] = useState([
    { id: 1, startTime: "08:00", endTime: "12:00" },
    { id: 2, startTime: "13:00", endTime: "17:00" },
  ]);
  const [assignedEmployees, setAssignedEmployees] = useState<any[]>([]);

  // Formulario crear orden de servicio

  const [selectedEmployeeForSlot, setSelectedEmployeeForSlot] = useState<{
    [key: number]: number;
  }>({});

  // Sample data for order details modal
  const [selectedOrderDetail, setSelectedOrderDetail] =
    useState<OrdenServicio | null>(null);

  const resetForm = () => {
    setSelectedLocation(null);
    setSelectedTipoServicio(null);
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

  const handleCloseModal = () => {
    setIsOpen(false);
    setIsModalOpen(false);
    setCurrentStep(1);
    setSelectedLocation(null);
    setSelectedService(null);
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
    console.log(ordenesDeServicioMutation);
    crearOrdenServicio(ordenesDeServicioMutation, {
      onSuccess: () => {
        handleCloseModal();
      },
    });
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
  }, [selectedTipoServicio]);

  const { data: ordenesDeServicioQuery } = useGetOrdenesServicio();
  const { data: locacionesQuery } = useLocacionesActivo();
  const { data: tarifasQueryPeriodoActivo } = useTarifasPeriodoActivo();
  const { data: tipoServiciosQuery } = useTipoServiciosActivo();
  // const { data: serviciosQuery } = useServiciosActivo();
  const { mutate: crearOrdenServicio } = useCreateOrdenServicio();

  const ordenesDeServicioMutation: CreateOrdenServicioDto = {
    idTarifa: selectedTarifa || 0,
    idLocacion: selectedLocation || 0,
    cantidadPersonal: staffQuantity,
    fechaInicio: startDate,
    fechaFin: isIndefinite ? null : endDate,
    horaInicio: "08:00:00",
    horaFin: "12:00:00",
    fechaCreacion: new Date().toISOString(),
  };

  // Filtrar los servicios por el tipo de servicio seleccionado
  const filteredServices = selectedTipoServicio
    ? tarifasQueryPeriodoActivo?.data?.filter(
        (tarifa) =>
          tarifa.idServicio.idTipoServicio.idTipoServicio ===
          selectedTipoServicio,
      )
    : [];

  const columns: ColumnDef<OrdenServicio>[] = [
    {
      accessorKey: "idLocacion",
      header: "Localización",
      cell: ({ row }) => (
        <span className="flex flex-col gap-1 font-medium text-black">
          {row.original.idLocacion.nombre}
          <span className="text-sm text-gray-500">
            {row.original.idLocacion.direccion}
          </span>
        </span>
      ),
    },
    {
      accessorKey: "servicio",
      header: "Servicio",
      cell: ({ row }) => (
        <span className="font-medium text-gray-500">
          {row.original.idTarifa.idServicio.codigo}
        </span>
      ),
    },
    {
      accessorKey: "personal",
      header: "Personal",
      cell: ({ row }) => (
        <span className="flex items-center gap-2 font-medium text-gray-500">
          {" "}
          <Users2 className="h-4 w-4" /> {row.original.cantidadPersonal}{" "}
          empleados
        </span>
      ),
    },
    {
      accessorKey: "fechas",
      header: "Fechas",
      cell: ({ row }) => (
        <span className="font-medium text-gray-500">
          {row.original.fechaInicio} - {row.original.fechaFin || "Indefinida"}
        </span>
      ),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        return (
          <span className="font-medium text-gray-500">
            {row.original.idEstadoOrdenServicio?.nombre || ""}
          </span>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            {/* <ButtonAction
              Icon={PencilIcon}
              label=""
              onClick={() => {
                setIsEditing(true);
                setIsOpen(true);
                setCurrentStep(1);
              }}
            /> */}
            <ButtonAction
              Icon={EyeIcon}
              label=""
              onClick={() => {
                setIsOpenDetails(true);
                setSelectedOrderDetail(row.original);
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

            {/* <div className="relative">
              <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre del cliente, localización o dirección..."
                className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div> */}

            <div className="max-h-80 space-y-3 overflow-y-auto">
              {locacionesQuery?.data?.map((location) => (
                <div
                  key={location.idLocacion}
                  className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                    selectedLocation === location.idLocacion
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}
                  onClick={() => setSelectedLocation(location.idLocacion)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <h4 className="font-medium text-gray-900">
                          {location.nombre}
                        </h4>
                        {selectedLocation === location.idLocacion && (
                          <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="mb-1 flex items-center gap-1 text-sm text-gray-600">
                        <Building2 className="h-3 w-3" />
                        <span>{location.idCliente.nombre}</span>
                      </div>
                      <div className="mb-1 flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span>
                          {location.direccion} - {location.idCiudad.descripcion}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>
                            {location.primerNombreResponsable}{" "}
                            {location.primerApellidoResponsable}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          <span>{location.telefono}</span>
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
              <InputSelect
                label="Tipo de Servicio"
                placeholder="Seleccione el tipo de servicio"
                id="tipoServicio"
                options={
                  tarifasQueryPeriodoActivo?.data?.map((tarifa) => ({
                    id: tarifa.idServicio.idTipoServicio.idTipoServicio,
                    descripcion: tarifa.idServicio.idTipoServicio.descripcion,
                  })) || []
                }
                onChange={(e) =>
                  setSelectedTipoServicio(Number(e.target.value))
                }
                value={selectedTipoServicio || 0}
              />

              {selectedTipoServicio && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">
                    Servicios Disponibles
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {filteredServices?.map((tarifa) => (
                      <div
                        key={tarifa.idServicio.idServicio}
                        className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                          selectedService === tarifa.idServicio.idServicio
                            ? "border-blue-500 bg-blue-50 shadow-sm"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                        onClick={() => {
                          setSelectedService(tarifa.idServicio.idServicio);
                          setSelectedTarifa(tarifa.idTarifa);
                        }}
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <h4 className="text-sm font-medium text-gray-900">
                            {tarifa.idServicio.codigo}
                          </h4>
                          {selectedService === tarifa.idServicio.idServicio && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="mb-3 text-xs text-gray-600">
                          {tarifa.idServicio.descripcion}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                            {
                              tipoServiciosQuery?.data?.find(
                                (cat) =>
                                  cat.idTipoServicio ===
                                  tarifa.idServicio.idTipoServicio
                                    .idTipoServicio,
                              )?.descripcion
                            }
                          </span>
                          <span className="font-semibold text-blue-600">$</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedTipoServicio && filteredServices?.length === 0 && (
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
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
                    disabled={isIndefinite}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <label htmlFor="indefinite" className="text-sm text-gray-700">
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
                  Orden de servicio indefinida (sin fecha de finalización)
                </label>
                <label
                  htmlFor="servicio24horas"
                  className="text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    id="servicio24horas"
                    checked={isServicio24Horas}
                    onChange={(e) => {
                      setIsServicio24Horas(e.target.checked);
                      // if (e.target.checked) {
                      //   setEndDate("");
                      // }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Horario fijo (Servicio de 24 horas)
                </label>
              </div>
            </div>
            {isServicio24Horas ? (
              <p className="text-sm font-medium text-gray-700">
                Horario Fijo (Servicio de 24 horas)
              </p>
            ) : (
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
                            step={60}
                            min="00:00"
                            max="24:00"
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
                              updateTimeRange(
                                range.id,
                                "endTime",
                                e.target.value,
                              )
                            }
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      // case 4:
      //   return (
      //     <div className="space-y-6">
      //       <div className="text-center">
      //         <h3 className="mb-2 text-lg font-semibold text-gray-900">
      //           Personal y Asignación
      //         </h3>
      //         <p className="text-sm text-gray-600">
      //           Define cuánto personal necesita y asígnelo inmediatamente
      //         </p>
      //       </div>

      //       <div className="space-y-6">
      //         <div>
      //           <label
      //             htmlFor="quantity"
      //             className="text-sm font-medium text-gray-700"
      //           >
      //             Cantidad de Personal Requerido *
      //           </label>
      //           <input
      //             id="quantity"
      //             type="number"
      //             min="1"
      //             max="10"
      //             value={staffQuantity}
      //             onChange={(e) =>
      //               setStaffQuantity(Number.parseInt(e.target.value) || 1)
      //             }
      //             className="mt-1 w-32 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      //           />
      //         </div>

      //         <div>
      //           <label className="mb-3 block text-sm font-medium text-gray-700">
      //             Buscar Empleados Disponibles
      //           </label>
      //           <div className="relative mb-4">
      //             <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
      //             <input
      //               type="text"
      //               placeholder="Buscar por nombre, apellido o cargo..."
      //               className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      //             />
      //           </div>
      //         </div>

      //         <div>
      //           <label className="mb-3 block text-sm font-medium text-gray-700">
      //             Asignación de Personal ({staffQuantity} requeridos)
      //           </label>

      //           <div className="space-y-4">
      //             {Array.from({ length: staffQuantity }, (_, index) => {
      //               const selectedEmployee = getSelectedEmployeeInfo(index);

      //               return (
      //                 <div
      //                   key={index}
      //                   className="rounded-lg border border-gray-200 p-4 shadow-sm"
      //                 >
      //                   <div className="mb-4 border-b border-gray-200 pb-3">
      //                     <h3 className="text-base font-semibold text-gray-900">
      //                       Empleado #{index + 1}
      //                     </h3>
      //                   </div>
      //                   <div className="space-y-4">
      //                     <div className="grid grid-cols-2 gap-4">
      //                       <div>
      //                         <label className="text-sm text-gray-700">
      //                           Seleccionar Empleado *
      //                         </label>
      //                         <div className="relative mt-1">
      //                           <select
      //                             value={
      //                               selectedEmployeeForSlot[
      //                                 index
      //                               ]?.toString() || ""
      //                             }
      //                             onChange={(e) =>
      //                               handleEmployeeSelection(
      //                                 index,
      //                                 Number.parseInt(e.target.value),
      //                               )
      //                             }
      //                             className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      //                           >
      //                             <option value="">
      //                               Seleccionar empleado...
      //                             </option>
      //                             {employees.map((employee) => (
      //                               <option
      //                                 key={employee.id}
      //                                 value={employee.id.toString()}
      //                               >
      //                                 {employee.name} - {employee.position}
      //                               </option>
      //                             ))}
      //                           </select>
      //                           <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
      //                         </div>
      //                       </div>
      //                       <div>
      //                         <label className="text-sm text-gray-700">
      //                           Rol en esta Orden *
      //                         </label>
      //                         <input
      //                           type="text"
      //                           placeholder="Ej: Supervisor, Guardia, etc."
      //                           className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      //                         />
      //                       </div>
      //                     </div>

      //                     <div>
      //                       <label className="text-sm text-gray-700">
      //                         Notas Adicionales
      //                       </label>
      //                       <textarea
      //                         placeholder="Instrucciones específicas para este empleado..."
      //                         className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      //                         rows={3}
      //                       />
      //                     </div>

      //                     {selectedEmployee && (
      //                       <div className="rounded-lg bg-gray-50 p-3">
      //                         <div className="mb-2 flex items-center gap-4 text-sm text-gray-600">
      //                           <div className="flex items-center gap-1">
      //                             <Mail className="h-3 w-3" />
      //                             <span>{selectedEmployee.email}</span>
      //                           </div>
      //                           <div className="flex items-center gap-1">
      //                             <Phone className="h-3 w-3" />
      //                             <span>{selectedEmployee.phone}</span>
      //                           </div>
      //                         </div>
      //                         <div className="flex gap-2">
      //                           {selectedEmployee.skills.map(
      //                             (skill, skillIndex) => (
      //                               <span
      //                                 key={skillIndex}
      //                                 className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700"
      //                               >
      //                                 {skill}
      //                               </span>
      //                             ),
      //                           )}
      //                         </div>
      //                       </div>
      //                     )}
      //                   </div>
      //                 </div>
      //               );
      //             })}
      //           </div>
      //         </div>
      //       </div>
      //     </div>
      //   );

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
            }}
          />
        </div>
        <Table
          columns={columns}
          data={ordenesDeServicioQuery?.data || []}
          enableFiltering={true}
        />
      </div>

      <SimpleModal
        isOpen={isOpen}
        onClose={() => {
          handleCloseModal();
        }}
        title={"Agregar orden de servicio"}
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
                  handleCloseModal();
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
                onClick={currentStep < 3 ? handleNext : handleSaveOrder}
                disabled={
                  isLoading ||
                  (currentStep === 1 && !selectedLocation) ||
                  (currentStep === 2 && !selectedService) ||
                  (currentStep === 3 && !startDate)
                  // ||(currentStep === 4 && staffQuantity < 1)
                }
                className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
                  currentStep < 3
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                } ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Creando...
                  </div>
                ) : currentStep < 3 ? (
                  "Siguiente"
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
          setSelectedOrderDetail(null);
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
                  {selectedOrderDetail?.idLocacion.nombre}
                </p>
                <p>
                  <span className="font-medium">Empresa:</span>{" "}
                  {selectedOrderDetail?.idLocacion.idCliente.nombre}
                </p>
                <p>
                  <span className="font-medium">Dirección:</span>{" "}
                  {selectedOrderDetail?.idLocacion.direccion}
                </p>
              </div>
              <div>
                <p>
                  <span className="font-medium">Contacto:</span>{" "}
                  {selectedOrderDetail?.idLocacion.primerNombreResponsable}
                </p>
                <p>
                  <span className="font-medium">Teléfono:</span>{" "}
                  {selectedOrderDetail?.idLocacion.telefono}
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
                  {selectedOrderDetail?.idTarifa.idServicio.codigo}
                </p>
                <p>
                  <span className="font-medium">Categoría:</span>{" "}
                  {
                    selectedOrderDetail?.idTarifa.idServicio.idTipoServicio
                      .descripcion
                  }
                </p>
              </div>
              <div>
                <p>
                  <span className="font-medium">Precio:</span> ${" "}
                  {selectedOrderDetail?.idTarifa.precioTotal.toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">Descripción:</span>{" "}
                  {selectedOrderDetail?.idTarifa.idServicio.descripcion}
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
                  {new Date(
                    selectedOrderDetail?.fechaInicio || "",
                  ).toLocaleDateString("es-ES")}
                </p>
                <p>
                  <span className="font-medium">Fecha de Fin:</span>{" "}
                  {selectedOrderDetail?.fechaFin
                    ? "Indefinida"
                    : new Date(
                        selectedOrderDetail?.fechaFin || "",
                      ).toLocaleDateString("es-ES")}
                </p>
              </div>
              {/* <div>
                <p className="mb-1 font-medium">Rangos de Horario:</p>
                <ul className="list-inside list-disc">
                  {selectedOrderDetail?.horarios.map((range: any) => (
                    <li key={range.id}>
                      {range.horaInicio} - {range.horaFin}
                    </li>
                  ))}
                </ul>
              </div> */}
            </div>
          </div>

          {/* Sección de Personal Asignado */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Users className="h-5 w-5 text-blue-600" />
              Personal Asignado ({selectedOrderDetail?.cantidadPersonal}{" "}
              requerido)
            </h3>
            {/* <div className="space-y-4">
              {selectedOrderDetail?.personal.map(
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
            </div> */}
          </div>

          {/* Sección de Estado */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Check className="h-5 w-5 text-blue-600" />
              Estado
            </h3>
            {/* <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                selectedOrderDetail?.idEstadoOrdenServicio.descripcion ===
                "Activo"
                  ? "bg-green-100 text-green-800"
                  : selectedOrderDetail?.idEstadoOrdenServicio.descripcion ===
                      "Pendiente"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
              }`}
            >
              {selectedOrderDetail?.idEstadoOrdenServicio.descripcion ===
              "Activo"
                ? "Activa"
                : selectedOrderDetail?.idEstadoOrdenServicio.descripcion ===
                    "Pendiente"
                  ? "Pendiente"
                  : "Completada"}
            </span> */}
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

      <ConfirmarDelete
        isOpenDelete={isOpenDelete}
        text="¿Estás seguro de querer eliminar esta orden de servicio?"
        onDelete={() => {}}
        onClose={() => setIsOpenDelete(false)}
      />
    </Section>
  );
}
