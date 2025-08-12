import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import {
  Building2,
  Calculator,
  Calendar,
  Check,
  ChevronDown,
  DollarSign,
  EyeIcon,
  FilePenIcon,
  FileText,
  IdCard,
  Mail,
  MapPin,
  Pencil,
  PencilIcon,
  Phone,
  PlusIcon,
  Search,
  Trash2,
  TrashIcon,
  User,
  Users,
  Users2,
  UserSquare2Icon,
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
  useGetPrecioOrdenServicio,
  useValidateHorariosOrdenServicio,
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
import { priceFormat } from "../../../utils/PriceFormat";
import { timeFormat } from "../../../utils/TimeFormat";
import { dateFormat } from "../../../utils/DateFormat";
import type { Tarifa } from "../../../api/types/periodo";
import { useForm } from "../../../hooks/useForm";
import { usePersonalActivo } from "../../../api/queryFunctions/personal";
import { OrderStateLabel } from "../../../components/common/OrderStateLabel";
import type { Locacion } from "../../../types";

export const Route = createFileRoute("/dashboard/ordenes-servicio/")({
  component: RouteComponent,
});

interface AssignedEmployee {
  nombreCompleto: string;
  numeroIdentificacion: string;
  telefono: string;
  tipoPersonal: string;
}

function RouteComponent() {
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [isOpenDetails, setIsOpenDetails] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);

  const [selectedLocation, setSelectedLocation] = useState<Locacion | null>(
    null,
  );
  const [selectedTipoServicio, setSelectedTipoServicio] = useState<
    number | null
  >(null);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedTarifa, setSelectedTarifa] = useState<Tarifa | null>(null);

  const [staffQuantity, setStaffQuantity] = useState(1);
  const [isIndefinite, setIsIndefinite] = useState(false);
  const [assignedEmployees, setAssignedEmployees] = useState<
    AssignedEmployee[]
  >([]);

  // Queries y mutaciones
  const { data: ordenesDeServicioQuery } = useGetOrdenesServicio();
  const { data: locacionesQuery } = useLocacionesActivo();
  const { data: tarifasQueryPeriodoActivo } = useTarifasPeriodoActivo();
  const { data: tipoServiciosQuery } = useTipoServiciosActivo();
  const { data: personalQuery } = usePersonalActivo();

  const {
    mutate: validateHorariosOrdenServicio,
    data: validateHorariosOrdenServicioData,
    isPending: isValidateHorariosPending,
  } = useValidateHorariosOrdenServicio();
  const {
    mutate: getPrecioOrdenServicio,
    isPending: isGetPrecioOrdenPending,
    data: getPrecioOrdenServicioData,
  } = useGetPrecioOrdenServicio();
  const { mutate: crearOrdenServicio, isPending: isCrearOrdenServicioPending } =
    useCreateOrdenServicio();

  // Formulario crear orden de servicio
  const {
    form: formOrdenServicio,
    handleChange: handleChangeOrdenServicio,
    resetForm: resetFormOrdenServicio,
    setForm: setFormOrdenServicio,
  } = useForm<CreateOrdenServicioDto>({
    cantidadPersonal: 0,
    fechaInicio: "",
    fechaFin: "",
    horaInicio: "",
    horaFin: "",
    fechaCreacion: "",
    idLocacion: 0,
    idTarifa: 0,
    horasDescanso: 0,
  });

  const [selectedEmployeeForSlot, setSelectedEmployeeForSlot] = useState<{
    [key: number]: number;
  }>({});

  // Sample data for order details modal
  const [selectedOrderDetail, setSelectedOrderDetail] =
    useState<OrdenServicio | null>(null);

  const handleCloseModal = () => {
    setIsOpenAdd(false);
    setCurrentStep(1);
    setSelectedTipoServicio(null);
    setSelectedLocation(null);
    setSelectedService(null);
    setSelectedTarifa(null);
    setIsIndefinite(false);
    resetFormOrdenServicio();
    setAssignedEmployees([]);
    setSelectedEmployeeForSlot({});
  };

  const handleNext = () => {
    const requierePersonal =
      selectedTarifa?.idServicio.idTipoServicio.requierePersonal;
    const requiereHorario = selectedTarifa?.idServicio.horasFijas === 24;
    if (currentStep === 3) {
      validateHorariosOrdenServicio(
        {
          idTarifa: selectedTarifa?.idTarifa || 0,
          fechaInicio: dateFormat(new Date(formOrdenServicio.fechaInicio)),
          fechaFin: isIndefinite
            ? null
            : dateFormat(new Date(formOrdenServicio.fechaFin || "")),
          horaInicio: !requiereHorario
            ? timeFormat(formOrdenServicio.horaInicio)
            : "00:00:00",
          horaFin: !requiereHorario
            ? timeFormat(formOrdenServicio.horaFin)
            : "00:00:00",
          // TODO: Revisar horas descanso
          horasDescanso: formOrdenServicio.horasDescanso,
        },
        {
          onSuccess: () => {
            setCurrentStep(4);
          },
        },
      );
      return;
    }

    if (currentStep === 4) {
      getPrecioOrdenServicio(
        {
          idTarifa: selectedTarifa?.idTarifa || 0,
          cantidadPersonal: requierePersonal
            ? formOrdenServicio.cantidadPersonal
            : null,
          fechaInicio: formOrdenServicio.fechaInicio,
          fechaFin: isIndefinite ? null : formOrdenServicio.fechaFin,
          horaInicio: !requiereHorario
            ? timeFormat(formOrdenServicio.horaInicio)
            : "00:00:00",
          horaFin: !requiereHorario
            ? timeFormat(formOrdenServicio.horaFin)
            : "00:00:00",
          horasDescanso: formOrdenServicio.horasDescanso,
        },
        {
          onSuccess: (data) => {
            if (data.status === 201) {
              setCurrentStep(5);
            }
          },
        },
      );
      return;
    }

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveOrder = async () => {
    const requiereHorario = selectedTarifa?.idServicio.horasFijas === 24;
    const ordenesDeServicioMutation: CreateOrdenServicioDto = {
      idTarifa: selectedTarifa?.idTarifa || 0,
      idLocacion: formOrdenServicio.idLocacion || 0,
      cantidadPersonal: formOrdenServicio.cantidadPersonal,
      fechaInicio: formOrdenServicio.fechaInicio,
      fechaFin: isIndefinite ? null : formOrdenServicio.fechaFin,
      horaInicio: !requiereHorario
        ? timeFormat(formOrdenServicio.horaInicio)
        : "00:00:00",
      horaFin: !requiereHorario
        ? timeFormat(formOrdenServicio.horaFin)
        : "00:00:00",
      fechaCreacion: new Date().toISOString(),
      horasDescanso: formOrdenServicio.horasDescanso,
    };

    crearOrdenServicio(ordenesDeServicioMutation, {
      onSuccess: () => {
        handleCloseModal();
      },
    });
  };
  const handleEmployeeSelection = (slotIndex: number, employeeId: number) => {
    const employee = personalQuery?.data?.find(
      (emp) => emp.idPersonal === employeeId,
    );
    const selectedEmployee = {
      nombreCompleto: `${employee?.primerNombre} ${employee?.primerApellido}`,
      numeroIdentificacion: employee?.numeroIdentificacion,
      telefono: employee?.telefono,
      tipoPersonal: employee?.idTipoPersonal.descripcion,
    };
    setAssignedEmployees((prev) => [
      ...prev,
      selectedEmployee as AssignedEmployee,
    ]);
    setSelectedEmployeeForSlot((prev) => ({
      ...prev,
      [slotIndex]: employeeId,
    }));
  };

  const getSelectedEmployeeInfo = (slotIndex: number) => {
    const employeeId = selectedEmployeeForSlot[slotIndex];
    return personalQuery?.data?.find((emp) => emp.idPersonal === employeeId);
  };

  useEffect(() => {
    setSelectedService(null);
  }, [selectedTipoServicio]);

  // Filtrar los servicios por el tipo de servicio seleccionado
  const filteredServices = selectedTipoServicio
    ? tarifasQueryPeriodoActivo?.data?.filter(
        (tarifa) =>
          tarifa.idServicio.idTipoServicio.idTipoServicio ===
          selectedTipoServicio,
      )
    : [];

  const tipoServiciosOptions =
    tarifasQueryPeriodoActivo?.data
      ?.map((tarifa) => ({
        id: tarifa.idServicio.idTipoServicio.idTipoServicio,
        descripcion: tarifa.idServicio.idTipoServicio.descripcion,
      }))
      .filter(
        (option, index, array) =>
          array.findIndex((item) => item.id === option.id) === index,
      ) || [];

  const columns: ColumnDef<OrdenServicio>[] = [
    {
      accessorKey: "idLocacion",
      header: "Localización",
      cell: ({ row }) => (
        <span className="flex flex-col gap-1 font-medium whitespace-nowrap text-black capitalize">
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
        <span className="font-medium text-black">
          {row.original.idTarifa.idServicio.codigo}
        </span>
      ),
    },
    {
      accessorKey: "personal",
      header: "Personal",
      cell: ({ row }) =>
        row.original.cantidadPersonal > 0 ? (
          <span className="flex items-center gap-2 font-medium whitespace-nowrap text-gray-500">
            {" "}
            <Users2 className="h-4 w-4" /> {row.original.cantidadPersonal}{" "}
            {row.original.cantidadPersonal > 1 ? "empleados" : "empleado"}
          </span>
        ) : (
          <span className="text-xs text-gray-500">
            (Esta orden no requiere personal)
          </span>
        ),
    },
    {
      accessorKey: "fechas",
      header: "Fechas",
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap text-gray-500">
          {row.original.fechaInicio} - {row.original.fechaFin || "Indefinida"}
        </span>
      ),
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        return (
          <OrderStateLabel
            state={row.original.idEstadoOrdenServicio?.nombre || ""}
          />
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

            <div className="relative">
              <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre del cliente, localización o dirección..."
                className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="max-h-80 space-y-3 overflow-y-auto">
              {locacionesQuery?.data?.map((location) => (
                <div
                  key={location.idLocacion}
                  className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                    formOrdenServicio.idLocacion === location.idLocacion
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}
                  onClick={() => {
                    setFormOrdenServicio({
                      ...formOrdenServicio,
                      idLocacion: location.idLocacion,
                    });
                    setSelectedLocation(location);
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <h4 className="font-medium text-gray-900">
                          {location.nombre}
                        </h4>
                        {formOrdenServicio.idLocacion ===
                          location.idLocacion && (
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
                options={tipoServiciosOptions}
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
                          setSelectedTarifa(tarifa);
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
                          <span className="font-semibold text-blue-600">
                            {priceFormat(tarifa.precioTotal)}
                          </span>
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
                <div className="">
                  <label className="text-sm font-medium text-gray-700">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    value={formOrdenServicio.fechaInicio || ""}
                    onChange={(e) =>
                      setFormOrdenServicio({
                        ...formOrdenServicio,
                        fechaInicio: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="">
                  <label className="text-sm font-medium text-gray-700">
                    Fecha de Fin
                  </label>
                  <input
                    type="date"
                    value={formOrdenServicio.fechaFin || ""}
                    onChange={(e) =>
                      setFormOrdenServicio({
                        ...formOrdenServicio,
                        fechaFin: e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
                    disabled={isIndefinite}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="indefinite"
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    id="indefinite"
                    checked={isIndefinite}
                    onChange={(e) => {
                      setIsIndefinite(e.target.checked);
                      if (e.target.checked) {
                        setFormOrdenServicio({
                          ...formOrdenServicio,
                          fechaFin: null,
                        });
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Orden de servicio indefinida (sin fecha de finalización)
                </label>
                {/* <label
                  htmlFor="servicio24horas"
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    id="servicio24horas"
                    checked={isServicio24Horas}
                    onChange={(e) => {
                      setIsServicio24Horas(e.target.checked);
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Horario fijo (Servicio de 24 horas)
                </label> */}
              </div>
            </div>
            {selectedTarifa?.idServicio.horasFijas === 24 ? (
              <p className="text-sm font-medium text-gray-700">
                Horario Fijo (Servicio de 24 horas) no es necesario configurar
                horarios, se prestará el servicio en el horario fijo de 24 horas
                de lunes a domingo.
              </p>
            ) : (
              <>
                <div className="mt-4 rounded-lg border border-yellow-500 bg-yellow-100 p-4 text-left">
                  <h4 className="text-lg font-medium text-yellow-700">Nota:</h4>{" "}
                  <p className="mt-2 text-sm text-yellow-700">
                    Horas recomendadas:{" "}
                    <span className="font-medium text-yellow-700">
                      {selectedTarifa?.idServicio.horasMinimas} Horas mínimas -{" "}
                      {selectedTarifa?.idServicio.horasMaximas} Horas máximas.
                    </span>
                  </p>
                  <p className="mt-2 text-yellow-700">
                    Segun el tipo de duracion del servicio{" "}
                    <span className="font-medium text-yellow-700 capitalize">
                      {selectedTarifa?.idServicio.idTipoDuracion.descripcion}
                    </span>
                  </p>
                </div>
                <div className="space-y-4">
                  {/* <div className="flex items-center justify-between">
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
                </div> */}

                  <div className="space-y-4">
                    {/* {timeRanges.map((range, index) => ( */}
                    <div
                      // key={range.id}
                      className="rounded-lg border border-gray-200 p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">
                          Rango de Horario
                        </label>
                        {/* {timeRanges.length > 1 && (
                          <button
                            type="button"
                            className="rounded-md p-1 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                            onClick={() => removeTimeRange(range.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )} */}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <label
                          className="text-sm text-gray-700"
                          htmlFor="horaInicio"
                        >
                          Hora de Inicio
                          <input
                            type="time"
                            name="horaInicio"
                            id="horaInicio"
                            value={formOrdenServicio.horaInicio}
                            min="00:00"
                            max="24:00"
                            onChange={handleChangeOrdenServicio}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </label>
                        <label
                          className="text-sm text-gray-700"
                          htmlFor="horaFin"
                        >
                          Hora de Fin
                          <input
                            type="time"
                            name="horaFin"
                            id="horaFin"
                            value={formOrdenServicio.horaFin}
                            min="00:00"
                            max="24:00"
                            onChange={handleChangeOrdenServicio}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </label>
                        <label
                          className="text-sm text-gray-700"
                          htmlFor="horasDescanso"
                        >
                          Horas de Descanso
                          <input
                            type="number"
                            name="horasDescanso"
                            id="horasDescanso"
                            value={formOrdenServicio.horasDescanso}
                            min="0"
                            max="24"
                            onChange={handleChangeOrdenServicio}
                            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </label>
                      </div>
                    </div>
                    {/* ))} */}
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 4:
        return (
          <>
            {!selectedTarifa?.idServicio.idTipoServicio.requierePersonal ? (
              <div className="space-y-6">
                <h3 className="text-center text-lg font-semibold text-gray-900">
                  Asignación de Personal
                </h3>
                <p className="text-sm text-gray-600">
                  No es necesario asignar personal para este servicio. Ya que el
                  tipo de servicio no requiere personal.
                </p>
              </div>
            ) : (
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
                  <label
                    htmlFor="cantidadPersonal"
                    className="text-sm font-medium text-gray-700"
                  >
                    Cantidad de Personal Requerido *
                    <input
                      id="cantidadPersonal"
                      name="cantidadPersonal"
                      type="number"
                      min="1"
                      max="2"
                      value={formOrdenServicio.cantidadPersonal}
                      onChange={(e) => handleChangeOrdenServicio(e)}
                      className="mt-1 w-32 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </label>

                  {/* <div>
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
                  </div> */}

                  <div>
                    {/* TODO: Revisar asignación de personal */}
                    <label className="mb-3 block text-sm font-medium text-gray-700">
                      Asignación de Personal (
                      {formOrdenServicio.cantidadPersonal} requeridos)
                    </label>

                    <div className="space-y-4">
                      {Array.from(
                        { length: formOrdenServicio.cantidadPersonal },
                        (_, index) => {
                          const selectedEmployee =
                            getSelectedEmployeeInfo(index);

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
                                {/* <div className="grid grid-cols-2 gap-4"> */}
                                <div>
                                  <label
                                    htmlFor={`empleado-${index}`}
                                    className="text-sm text-gray-700"
                                  >
                                    Seleccionar Empleado *
                                    <div className="relative mt-1">
                                      <select
                                        value={
                                          selectedEmployeeForSlot[
                                            index
                                          ]?.toString() || ""
                                        }
                                        onChange={(e) => {
                                          handleEmployeeSelection(
                                            index,
                                            Number.parseInt(e.target.value),
                                          );
                                        }}
                                        className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                      >
                                        <option value="">
                                          Seleccionar empleado...
                                        </option>
                                        {personalQuery?.data?.map(
                                          (employee) => (
                                            <option
                                              key={employee.idPersonal}
                                              value={employee.idPersonal.toString()}
                                            >
                                              {employee.primerNombre}{" "}
                                              {employee.primerApellido}
                                            </option>
                                          ),
                                        )}
                                      </select>
                                      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    </div>
                                  </label>
                                </div>
                                {/* <div>
                                    <label className="text-sm text-gray-700">
                                      Rol en esta Orden *
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Ej: Supervisor, Guardia, etc."
                                      className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                  </div> */}
                                {/* </div> */}

                                {/* <div>
                                  <label className="text-sm text-gray-700">
                                    Notas Adicionales
                                  </label>
                                  <textarea
                                    placeholder="Instrucciones específicas para este empleado..."
                                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    rows={3}
                                  />
                                </div> */}

                                {selectedEmployee && (
                                  <div className="rounded-lg bg-gray-50 p-3">
                                    <div className="mb-2 flex items-center justify-around gap-4 text-sm text-gray-600">
                                      <div className="flex items-center gap-1">
                                        <IdCard className="h-4 w-4" />
                                        <span>
                                          {
                                            selectedEmployee.numeroIdentificacion
                                          }
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Phone className="h-4 w-4" />
                                        <span>{selectedEmployee.telefono}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <UserSquare2Icon className="h-4 w-4" />
                                        <span>
                                          {
                                            selectedEmployee.idTipoPersonal
                                              .descripcion
                                          }
                                        </span>
                                      </div>
                                    </div>
                                    {/* <div className="flex gap-2">
                                    {selectedEmployee.idTipoPersonal.habilidades.map(
                                      (skill, skillIndex) => (
                                        <span
                                          key={skillIndex}
                                          className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700"
                                        >
                                          {skill.descripcion}
                                        </span>
                                      ),
                                    )}
                                  </div> */}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Detalles de la orden de servicio
              </h3>
              <p className="text-sm text-gray-600">
                Revisa los detalles de la orden de servicio y confirma la
                creación
              </p>
            </div>

            <div className="space-y-6">
              {/* Información del Cliente y Ubicación */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  Cliente y Ubicación
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Cliente:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedLocation?.idCliente.nombre}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Ubicación:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedLocation?.nombre}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Dirección:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedLocation?.direccion}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Ciudad:</span>{" "}
                      <span className="text-gray-600">
                        {selectedLocation?.idCiudad.descripcion}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Responsable:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedLocation?.primerNombreResponsable}{" "}
                        {selectedLocation?.primerApellidoResponsable}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Teléfono:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedLocation?.telefono}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Información del Servicio */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <FileText className="h-6 w-6 text-green-600" />
                  Servicio
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">Código:</span>{" "}
                      <span className="text-gray-600">
                        {selectedTarifa?.idServicio.codigo}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Descripción:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedTarifa?.idServicio.descripcion}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Tipo de Servicio:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedTarifa?.idServicio.idTipoServicio.descripcion}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Requiere Personal:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedTarifa?.idServicio.idTipoServicio
                          .requierePersonal
                          ? "Sí"
                          : "No"}
                      </span>
                    </p>
                  </div>
                  <div>
                    {/* <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Duración:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedTarifa?.idServicio?.idTipoDuracion
                          ?.descripcion || "No especificada"}{" "}
                      </span>
                    </p> */}
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Horas Fijas:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedTarifa?.idServicio.horasFijas} horas
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Horas Máximas:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedTarifa?.idServicio.horasMaximas} horas
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Horas Mínimas:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedTarifa?.idServicio.horasMinimas} horas
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de Fechas y Horarios */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Calendar className="h-6 w-6 text-purple-600" />
                  Fechas y Horarios
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Fecha de Inicio:
                      </span>{" "}
                      <span className="text-gray-600">
                        {new Date(
                          formOrdenServicio.fechaInicio,
                        ).toLocaleDateString()}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Fecha de Fin:
                      </span>{" "}
                      <span className="text-gray-600">
                        {isIndefinite
                          ? "Indefinida"
                          : formOrdenServicio.fechaFin
                            ? new Date(
                                formOrdenServicio.fechaFin,
                              ).toLocaleDateString()
                            : "No especificada"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Hora de Inicio:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedTarifa?.idServicio.horasFijas === 24
                          ? "00:00:00 (24 horas)"
                          : formOrdenServicio.horaInicio}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Hora de Fin:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedTarifa?.idServicio.horasFijas === 24
                          ? "00:00:00 (24 horas)"
                          : formOrdenServicio.horaFin}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm">
                    <span className="font-medium text-gray-700">
                      Horas de Descanso:
                    </span>{" "}
                    <span className="text-gray-600">2 horas</span>
                  </p>
                </div>
              </div>

              {/* Información del Personal */}
              {selectedTarifa?.idServicio.idTipoServicio.requierePersonal && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <Users className="h-6 w-6 text-orange-600" />
                    Personal
                  </h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">
                          Cantidad de Personal:
                        </span>{" "}
                        <span className="text-gray-600">
                          {formOrdenServicio.cantidadPersonal}{" "}
                          {formOrdenServicio.cantidadPersonal === 1
                            ? "persona"
                            : "personas"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">
                          Personal Asignado:
                        </span>{" "}
                        <span className="text-gray-600">
                          {assignedEmployees.length > 0
                            ? `${assignedEmployees.length} asignado(s)`
                            : "Pendiente de asignación"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Información de Tarifa y Precios */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  Tarifa y Precios
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Período:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedTarifa?.idPeriodo.nombre}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Tipo de Tarifa:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedTarifa?.idTipoTarifa.nombre}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Unidad de Tiempo:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedTarifa?.idTipoTarifa?.idTipoUnidadTiempo
                          ?.descripcion || "No especificada"}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Precio sin IVA:
                      </span>{" "}
                      <span className="text-gray-600">
                        {priceFormat(selectedTarifa?.precioSinIva || 0)}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">IVA:</span>{" "}
                      <span className="text-gray-600">
                        {priceFormat(selectedTarifa?.iva || 0)}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Precio Total Base:
                      </span>{" "}
                      <span className="font-semibold text-green-600">
                        {priceFormat(selectedTarifa?.precioTotal || 0)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de Precio Calculado */}
              {getPrecioOrdenServicioData?.data && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-green-900">
                    <Calculator className="h-6 w-6 text-green-600" />
                    Precio Calculado
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(getPrecioOrdenServicioData.data).map(
                      ([key, value]) => {
                        return (
                          <p key={key} className="text-sm">
                            <span className="font-medium text-green-800 capitalize">
                              {key}:
                            </span>{" "}
                            <span className="text-green-700">
                              {key === "precio"
                                ? priceFormat(Number(value))
                                : String(value)}
                            </span>
                          </p>
                        );
                      },
                    )}
                  </div>
                </div>
              )}

              {/* Información de Creación */}
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <FilePenIcon className="h-6 w-6 text-green-600" />
                  Información de Creación
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Fecha de Creación:
                      </span>{" "}
                      <span className="text-gray-600">
                        {formOrdenServicio.fechaCreacion
                          ? new Date(
                              formOrdenServicio.fechaCreacion,
                            ).toLocaleString()
                          : new Date().toLocaleString()}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Estado Inicial:
                      </span>{" "}
                      <span className="font-medium text-blue-600">
                        Programada
                      </span>
                    </p>
                  </div>
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
              setIsOpenAdd(true);
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
        isOpen={isOpenAdd}
        onClose={() => {
          handleCloseModal();
        }}
        title={"Agregar orden de servicio"}
        size="2xl"
      >
        <>
          {/* Step Indicator */}
          <div className="flex items-center justify-center px-6 py-6">
            {[1, 2, 3, 4, 5].map((step) => (
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
                {step < 5 && (
                  <div
                    className={`mx-2 h-0.5 w-16 ${step < currentStep ? `bg-green-500` : `bg-gray-200`}`}
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
            <div className="text-sm text-gray-500">Paso {currentStep} de 5</div>
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
                onClick={currentStep < 5 ? handleNext : handleSaveOrder}
                disabled={
                  isValidateHorariosPending ||
                  isGetPrecioOrdenPending ||
                  isCrearOrdenServicioPending ||
                  (currentStep === 1 && !formOrdenServicio.idLocacion) ||
                  (currentStep === 2 && !selectedService) ||
                  (currentStep === 3 && !formOrdenServicio.fechaInicio) ||
                  (currentStep === 4 &&
                    selectedTarifa?.idServicio.idTipoServicio
                      .requierePersonal &&
                    Object.values(selectedEmployeeForSlot).length <
                      formOrdenServicio.cantidadPersonal)
                }
                className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  currentStep < 5
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                } ${isCrearOrdenServicioPending ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {isCrearOrdenServicioPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Creando...
                  </div>
                ) : currentStep < 5 ? (
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
        text="¿Estás seguro de querer eliminar esta orden de servicio? Esta acción no se puede deshacer."
        onDelete={() => {}}
        onClose={() => setIsOpenDelete(false)}
      />
    </Section>
  );
}
