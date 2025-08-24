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
import { SimpleModal } from "../../../components/common/SimpleModal";
import { useEffect, useState } from "react";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import {
  useCreateOrdenServicio,
  useGetOrdenesServicio,
  useGetPrecioOrdenServicio,
  useValidarEmpleadosDisponibles,
  useValidarHorarioServicioOrdenServicio,
  useValidarIdOrdenServicio,
  useValidarRangoHorarioPersonalOrdenServicio,
  useValidateFechasOrdenServicio,
} from "../../../api/queryFunctions/orden-servicio";
import type {
  CreateOrdenServicioDto,
  CreateOrdenServicioTarifaDto,
  CreatePersonalServicioDto,
} from "../../../api/dtos";
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
import { InputForm } from "../../../components/common/InputForm";
import { InputTime } from "../../../components/common/InputTime";
import { toast } from "sonner";
import type { Servicio } from "../../../api/types/servicio";

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
  const [isEditing, setIsEditing] = useState(false);
  const [isOpenDetails, setIsOpenDetails] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [selectedLocation, setSelectedLocation] = useState<Locacion | null>(
    null,
  );
  const [selectedTipoServicio, setSelectedTipoServicio] = useState<
    number | null
  >(null);
  const [selectedServices, setSelectedServices] = useState<Servicio[]>([]);
  const [selectedTarifa, setSelectedTarifa] = useState<Tarifa | null>(null);

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
    mutate: validateFechasOrdenServicio,
    data: validateFechasOrdenServicioData,
    isPending: isValidateFechasOrdenServicioPending,
  } = useValidateFechasOrdenServicio();
  const {
    mutateAsync: getPrecioOrdenServicio,
    isPending: isGetPrecioOrdenPending,
    data: getPrecioOrdenServicioData,
  } = useGetPrecioOrdenServicio();
  const { mutate: crearOrdenServicio, isPending: isCrearOrdenServicioPending } =
    useCreateOrdenServicio();
  const {
    mutate: validarIdOrdenServicio,
    isPending: isValidarIdOrdenServicioPending,
  } = useValidarIdOrdenServicio();
  const {
    mutateAsync: validarEmpleadosDisponibles,
    data: validarEmpleadosDisponiblesData,
    isPending: isValidarEmpleadosDisponiblesPending,
  } = useValidarEmpleadosDisponibles();

  const {
    mutateAsync: validarRangoHorarioPersonalOrdenServicio,
    isPending: isValidarRangoHorarioPersonalOrdenServicioPending,
    data: validarRangoHorarioPersonalOrdenServicioData,
  } = useValidarRangoHorarioPersonalOrdenServicio();

  const {
    data: validarHorarioServicioOrdenServicioData,
    mutateAsync: validarHorarioServicioOrdenServicio,
    isPending: isValidarHorarioServicioOrdenServicioPending,
  } = useValidarHorarioServicioOrdenServicio();

  // Formulario crear orden de servicio
  const {
    form: formOrdenServicio,
    handleChange: handleChangeOrdenServicio,
    handleChangeTime: handleChangeTimeOrdenServicio,
    resetForm: resetFormOrdenServicio,
    setForm: setFormOrdenServicio,
  } = useForm<CreateOrdenServicioDto>({
    fechaInicio: "",
    fechaFin: "",
    fechaCreacion: "",
    idLocacion: 0,
    precioTotal: 0,
    numeroOrdenServicio: "",
    servicios: [],
  });

  const [configuracionServicioTarifa, setConfiguracionServicioTarifa] =
    useState<CreateOrdenServicioTarifaDto[]>([]);

  const [configuracionPersonalServicio, setConfiguracionPersonalServicio] =
    useState<CreatePersonalServicioDto[]>([]);

  // TODO: Asignar el personal al objeto
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
    setSelectedServices([]);
    setSelectedTarifa(null);
    setIsIndefinite(false);
    resetFormOrdenServicio();
    setAssignedEmployees([]);
    setSelectedEmployeeForSlot({});
  };

  const handleNext = async () => {
    const requierePersonal =
      selectedTarifa?.idServicio.idTipoServicio.requierePersonal;
    const requiereHorario = selectedTarifa?.idServicio.horasFijas === 24;

    if (currentStep === 1) {
      if (formOrdenServicio.numeroOrdenServicio.length === 0) {
        toast.error("El código de la orden de servicio es requerido");
        return;
      }

      validarIdOrdenServicio(
        {
          descripcionId: formOrdenServicio.numeroOrdenServicio,
        },
        {
          onSuccess: () => {
            setCurrentStep(2);
          },
        },
      );
      return;
    }

    if (currentStep === 3) {
      if (formOrdenServicio.fechaInicio === "") {
        toast.error("La fecha de inicio es requerida");
        return;
      }

      if (formOrdenServicio.fechaFin === "" && !isIndefinite) {
        toast.error("La fecha de fin es requerida o debe ser indefinida");
        return;
      }

      validateFechasOrdenServicio(
        {
          fechaInicio: dateFormat(new Date(formOrdenServicio.fechaInicio)),
          fechaFin: isIndefinite
            ? null
            : dateFormat(new Date(formOrdenServicio.fechaFin || "")),
        },
        {
          onSuccess: () => {
            setCurrentStep(4);
          },
        },
      );
      return;
    }

    if (currentStep === 5) {
      console.log(configuracionServicioTarifa);
      const campoHorario = configuracionServicioTarifa.some(
        (service) => service.horaInicio === "" && service.horaFin === "",
      );
      console.log(campoHorario);
      if (campoHorario) {
        toast.error("Los campos de hora son requeridos");
        return;
      }

      // Va a recorrer todos los servicios seleccionados y va a utilizar el endpoint de

      try {
        const response = await Promise.allSettled(
          configuracionServicioTarifa.map(async (servicio) => {
            console.log(selectedServices);
            console.log(servicio);
            return validarHorarioServicioOrdenServicio(
              {
                idTarifa: servicio.idTarifa,
                idServicio: servicio.idServicio || 0,
                horaInicio: timeFormat(servicio.horaInicio),
                horaFin:
                  servicio.horaFin === ""
                    ? "00:00:00"
                    : timeFormat(servicio.horaFin),
              },
              {
                onSuccess: (data) => {
                  console.log(data);
                },
              },
            );
          }),
        );
        const success = response.every((r) => r.status === "fulfilled");
        if (success) {
          setCurrentStep(6);
        }
      } catch (error) {
        console.log(error);
      }
      return;
    }

    if (currentStep === 6) {
      let allValidated = true;
      let precioTotal = 0;
      try {
        const responseRangoHorarioValidacion = await Promise.allSettled(
          configuracionServicioTarifa.map(async (servicio) => {
            return validarRangoHorarioPersonalOrdenServicio({
              horaInicio: servicio.horaInicio,
              horaFin: servicio.horaFin === "" ? "00:00:00" : servicio.horaFin,
              personal: servicio.personal,
            });
          }),
        );

        const responsePrecioOrdenServicio = await Promise.allSettled(
          configuracionServicioTarifa.map(async (servicio) => {
            return getPrecioOrdenServicio(
              {
                horaInicio: servicio.horaInicio,
                horaFin:
                  servicio.horaFin === "" ? "00:00:00" : servicio.horaFin,
                fechaFin: isIndefinite ? null : formOrdenServicio.fechaFin,
                fechaInicio: formOrdenServicio.fechaInicio,
                idTarifa: servicio.idTarifa,
              },
              {
                onSuccess: (data) => {
                  console.log("data precio orden servicio: ", data);
                  if (data.status === 201 && data.data.precio > 0) {
                    servicio.precio = data.data.precio;
                    precioTotal += data.data.precio;
                  }
                },
              },
            );
          }),
        );
        allValidated =
          responseRangoHorarioValidacion.every(
            (r) => r.status === "fulfilled",
          ) &&
          responsePrecioOrdenServicio.every((r) => r.status === "fulfilled");
      } catch (error) {
        console.log(error);
      }

      if (allValidated) {
        console.log("precio total: ", precioTotal);
        setFormOrdenServicio({
          ...formOrdenServicio,
          precioTotal: precioTotal,
        });
        setCurrentStep(7);
      }
      return;
    }

    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveOrder = async () => {
    // const requiereHorario = selectedTarifa?.idServicio.horasFijas === 24;
    const ordenesDeServicioMutation: CreateOrdenServicioDto = {
      numeroOrdenServicio: formOrdenServicio.numeroOrdenServicio,
      idLocacion: formOrdenServicio.idLocacion || 0,
      fechaInicio: formOrdenServicio.fechaInicio,
      fechaFin: isIndefinite ? null : formOrdenServicio.fechaFin,
      precioTotal: formOrdenServicio.precioTotal,
      fechaCreacion: new Date().toISOString(),
      servicios: configuracionServicioTarifa,
    };

    crearOrdenServicio(ordenesDeServicioMutation, {
      onSuccess: () => {
        handleCloseModal();
      },
    });
  };

  const handleValidarEmpleadosDisponibles = async (
    idServicio: number,
    indexEmpleado: number,
  ) => {
    const servicio = configuracionServicioTarifa.find(
      (s) => s.idServicio === idServicio,
    );
    console.log(servicio?.personal[indexEmpleado]);
    const response = await validarEmpleadosDisponibles({
      fechaInicio: formOrdenServicio.fechaInicio,
      fechaFin: isIndefinite ? null : formOrdenServicio.fechaFin,
      horaInicio: servicio?.personal[indexEmpleado].horaInicio || "00:00:00",
      horaFin: servicio?.personal[indexEmpleado].horaFin || "00:00:00",
    });
    console.log(response);
  };

  const handleEmployeeSelection = (
    slotIndex: number,
    employeeId: number,
    serviceId: number,
  ) => {
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

    // TODO: Revisar esta logica de seleccion de personal
    // Update the configuracionServicioTarifa with the selected employee for the specific service
    setConfiguracionServicioTarifa((prev) => {
      const newArray = [...prev];
      const indexServicio = newArray.findIndex(
        (s) => s.idServicio === serviceId,
      );

      if (indexServicio !== -1) {
        // Ensure personal array exists and has enough elements
        if (!newArray[indexServicio].personal) {
          newArray[indexServicio].personal = [];
        }

        // Ensure the personal array has the correct length
        while (newArray[indexServicio].personal.length <= slotIndex) {
          newArray[indexServicio].personal.push({
            idPersonal: 0,
            horaInicio: "",
            horaFin: "",
          });
        }

        // Update the personal array at the specific index
        const updatedPersonal = [...newArray[indexServicio].personal];
        updatedPersonal[slotIndex] = {
          ...updatedPersonal[slotIndex],
          idPersonal: employeeId,
        };

        newArray[indexServicio] = {
          ...newArray[indexServicio],
          personal: updatedPersonal,
        };
      }

      return newArray;
    });
  };

  const handleSelectedServices = (servicio: Servicio) => {
    if (!selectedServices.includes(servicio)) {
      setSelectedServices((prev) => [...prev, servicio]);
    } else {
      setSelectedServices((prev) => prev.filter((s) => s !== servicio));
    }
  };

  const getSelectedEmployeeInfo = (slotIndex: number) => {
    const employeeId = selectedEmployeeForSlot[slotIndex];
    return personalQuery?.data?.find((emp) => emp.idPersonal === employeeId);
  };

  useEffect(() => {
    setSelectedServices([]);
  }, [selectedTipoServicio]);

  // Initialize configuracionServicioTarifa when selectedServices changes
  useEffect(() => {
    const initialConfig = selectedServices.map((service) => ({
      idTarifa: selectedTarifa?.idTarifa || 0,
      idServicio: service.idServicio,
      cantidadPersonal: 0,
      horaInicio: "",
      horaFin: "",
      precio: 0,
      personal: [],
    }));
    console.log(initialConfig);
    setConfiguracionServicioTarifa(initialConfig);
  }, [selectedServices]);

  useEffect(() => {
    console.log(selectedEmployeeForSlot);
    const initialConfig = Object.values(selectedEmployeeForSlot).map(
      (employeeId) => ({
        idPersonal: employeeId,
        horaInicio: "00:00:00",
        horaFin: "23:00:00",
      }),
    );
    setConfiguracionPersonalServicio(initialConfig);
  }, [selectedEmployeeForSlot]);

  // Filtrar los servicios por el tipo de servicio seleccionado
  // const filteredServices = selectedTipoServicio
  //   ? tarifasQueryPeriodoActivo?.data?.filter(
  //       (tarifa) =>
  //         tarifa.idServicio.idTipoServicio.idTipoServicio ===
  //         selectedTipoServicio,
  //     )
  //   : [];

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
        <div className="flex flex-col gap-1">
          {row.original.tarifas.map((tarifa) => {
            return (
              <span className="font-medium text-gray-500">
                {/* {tarifa.idServicio.descripcion} */}
              </span>
            );
          })}
        </div>
      ),
    },
    // {
    //   accessorKey: "personal",
    //   header: "Personal",
    //   cell: ({ row }) =>
    //     row.original.tarifas[0].cantidadPersonal > 0 ? (
    //       <span className="flex items-center gap-2 font-medium whitespace-nowrap text-gray-500">
    //         {" "}
    //         <Users2 className="h-4 w-4" /> {row.original.tarifas[0].cantidadPersonal}{" "}
    //         {row.original.cantidadPersonal > 1 ? "empleados" : "empleado"}
    //       </span>
    //     ) : (
    //       <span className="text-xs text-gray-500">
    //         (Esta orden no requiere personal)
    //       </span>
    //     ),
    // },
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
            <ButtonAction
              Icon={PencilIcon}
              label="Editar"
              onClick={() => {
                setIsEditing(true);
                setSelectedOrderDetail(row.original);
              }}
            />
            <ButtonAction
              Icon={EyeIcon}
              label="Ver"
              onClick={() => {
                setIsOpenDetails(true);
                setSelectedOrderDetail(row.original);
              }}
            />
            <ButtonAction
              Icon={TrashIcon}
              label="Eliminar"
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
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Seleccionar Identificador de Orden de Servicio
              </h3>
              <p className="text-sm text-gray-600">
                Ingrese el código de la orden de servicio para identificarla de
                forma única
              </p>
            </div>
            <label
              className="text-sm text-gray-700"
              htmlFor="numeroOrdenServicio"
            >
              Código de Orden de Servicio
              <input
                type="text"
                name="numeroOrdenServicio"
                id="numeroOrdenServicio"
                placeholder="A-23456"
                value={formOrdenServicio.numeroOrdenServicio}
                onChange={handleChangeOrdenServicio}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </label>
          </div>
        );

      case 2:
        return (
          <div className="mx-auto max-w-2xl space-y-6">
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

      case 3:
        return (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Configuración de Fechas
              </h3>
              <p className="text-sm text-gray-600">
                Configure las fechas de inicio y fin de la orden de servicio
              </p>
            </div>

            <div className="space-y-4">
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
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Servicio a Prestar
              </h3>
              <p className="text-sm text-gray-600">
                Seleccione el tipo de servicio que se prestará
              </p>
            </div>

            <div className="space-y-4">
              {/* <InputSelect
                label="Tipo de Servicio"
                placeholder="Seleccione el tipo de servicio"
                id="tipoServicio"
                options={tipoServiciosOptions}
                onChange={(e) =>
                  setSelectedTipoServicio(Number(e.target.value))
                }
                value={selectedTipoServicio || 0}
              /> */}

              {/* {selectedTipoServicio && ( */}
              <div>
                <label className="mb-3 flex flex-row items-center justify-between text-sm font-medium text-gray-700">
                  <span className="font-bold">Servicios Disponibles.</span>
                  <span className="text-xs">
                    Servicios seleccionados: {selectedServices.length}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {tarifasQueryPeriodoActivo?.data?.map((tarifa) => (
                    <div
                      key={tarifa.idServicio.idServicio}
                      className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                        selectedServices.includes(tarifa.idServicio)
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                      onClick={() => {
                        handleSelectedServices(tarifa.idServicio);
                        setConfiguracionServicioTarifa((prev) => {
                          const newArray = [...prev];
                          const index = newArray.findIndex(
                            (s) =>
                              s.idServicio === tarifa.idServicio.idServicio,
                          );
                          newArray[index] = {
                            idTarifa: tarifa.idTarifa,
                            idServicio: tarifa.idServicio.idServicio,
                            cantidadPersonal: 0,
                            horaInicio: "",
                            horaFin: "",
                            precio: 0,
                            personal: [],
                          };
                          return newArray;
                        });
                        setSelectedTarifa(tarifa);
                      }}
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <h4 className="text-sm font-medium text-gray-900">
                          {tarifa.idServicio.codigo}
                        </h4>
                        {selectedServices.includes(tarifa.idServicio) && (
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
                                tarifa.idServicio.idTipoServicio.idTipoServicio,
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
              {/* )} */}

              {selectedTipoServicio &&
                tarifasQueryPeriodoActivo?.data?.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    No hay servicios disponibles para esta categoría
                  </div>
                )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Configuración de Horarios para{" "}
                {selectedServices.length > 1
                  ? `${selectedServices.length} servicios`
                  : "servicio"}
              </h3>
              <p className="text-sm text-gray-600">
                Seleccionar las horas necesarias para cumplir con el horario del
                servicio.
              </p>
            </div>
            <div className="space-y-4">
              {selectedServices.map((service) => (
                <div
                  key={service.idServicio}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex flex-col gap-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {service.codigo} - {service.descripcion}
                    </h4>
                    {service.horasFijas === 24 ? (
                      <>
                        <p className="text-sm font-medium text-gray-700">
                          Horario Fijo (Servicio de 24 horas) configurar la hora
                          de inicio de la orden.
                        </p>
                        <InputTime
                          label="Hora de Inicio"
                          placeholder="00:00"
                          id="horaInicio"
                          value={
                            configuracionServicioTarifa.find(
                              (s) => s.idServicio === service.idServicio,
                            )?.horaInicio || ""
                          }
                          onChange={(e) =>
                            setConfiguracionServicioTarifa((prev) => {
                              const newArray = [...prev];
                              const index = newArray.findIndex(
                                (s) => s.idServicio === service.idServicio,
                              );
                              newArray[index] = {
                                ...newArray[index],
                                // Al ser servicio de 24 horas, se debe setear la hora de fin a 00:00:00
                                horaInicio: timeFormat(e.target.value),
                                horaFin: "00:00:00",
                              };
                              return newArray;
                            })
                          }
                        />
                      </>
                    ) : (
                      <>
                        <div className="">
                          <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">
                              Rango de Horario
                            </label>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <InputTime
                              label="Hora de Inicio"
                              placeholder="00:00"
                              id="horaInicio"
                              value={
                                configuracionServicioTarifa.find(
                                  (s) => s.idServicio === service.idServicio,
                                )?.horaInicio || ""
                              }
                              onChange={(e) =>
                                setConfiguracionServicioTarifa((prev) => {
                                  const newArray = [...prev];
                                  const index = newArray.findIndex(
                                    (s) => s.idServicio === service.idServicio,
                                  );
                                  newArray[index] = {
                                    ...newArray[index],
                                    horaInicio: timeFormat(e.target.value),
                                  };
                                  return newArray;
                                })
                              }
                            />
                            <InputTime
                              label="Hora de Fin"
                              placeholder="00:00"
                              id="horaFin"
                              value={
                                configuracionServicioTarifa.find(
                                  (s) => s.idServicio === service.idServicio,
                                )?.horaFin || ""
                              }
                              onChange={(e) =>
                                setConfiguracionServicioTarifa((prev) => {
                                  const newArray = [...prev];
                                  const index = newArray.findIndex(
                                    (s) => s.idServicio === service.idServicio,
                                  );
                                  newArray[index] = {
                                    ...newArray[index],
                                    horaFin: timeFormat(e.target.value),
                                  };
                                  return newArray;
                                })
                              }
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="mt-4 space-y-1 rounded-lg border border-yellow-500 bg-yellow-50 px-4 py-2 text-left">
                    <h4 className="text-base font-medium text-yellow-600">
                      Nota:
                    </h4>{" "}
                    <p className="text-xs text-yellow-600">
                      {service.idTipoDuracion.descripcion.toLowerCase() ===
                      "fija" ? (
                        <>
                          Horas recomendadas:{" "}
                          <b>{service.horasFijas} Horas fijas</b>
                        </>
                      ) : (
                        <>
                          Horas recomendadas:{" "}
                          <b>
                            {service.horasMinimas} Horas mínimas -{" "}
                            {service.horasMaximas} Horas máximas.
                          </b>
                        </>
                      )}
                      <>
                        {". "}Segun el tipo de duracion del servicio{" "}
                        <b>{service.idTipoDuracion.descripcion}</b>
                      </>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Personal y Asignación de horarios
              </h3>
              <p className="text-sm text-gray-600">
                Define cuánto personal necesita y asígnelo inmediatamente para
                cada servicio.
              </p>
            </div>
            {/* TODO: Revisar asignación de personal y horarios */}
            {selectedServices.map((service, index) => (
              <div
                key={service.idServicio}
                className="space-y-2 rounded-lg border border-gray-200 p-4"
              >
                <h4 className="text-sm font-medium text-gray-900">
                  {service.codigo} - {service.descripcion}
                </h4>
                {!service.idTipoServicio.requierePersonal && (
                  <p className="text-sm text-gray-600">
                    No es necesario asignar personal para este servicio. Ya que
                    el tipo de servicio no requiere personal.
                  </p>
                )}
                {service.idTipoServicio.requierePersonal && (
                  <>
                    <p className="text-sm text-gray-600">
                      Seleccione la cantidad de personal requerido para este
                      servicio.
                    </p>
                    <div className="space-y-4">
                      <InputForm
                        label="Cantidad de Personal Requerido *"
                        placeholder="0"
                        type="number"
                        id="cantidadPersonal"
                        value={
                          configuracionServicioTarifa[
                            index
                          ]?.cantidadPersonal.toString() || "0"
                        }
                        onChange={(e) =>
                          setConfiguracionServicioTarifa((prev) => {
                            const newArray = [...prev];
                            const index = newArray.findIndex(
                              (s) => s.idServicio === service.idServicio,
                            );
                            newArray[index] = {
                              ...newArray[index],
                              cantidadPersonal: Number(e.target.value),
                            };
                            return newArray;
                          })
                        }
                      />

                      {Array.from(
                        {
                          length:
                            configuracionServicioTarifa.find(
                              (s) => s.idServicio === service.idServicio,
                            )?.cantidadPersonal || 0,
                        },
                        (_, index) => {
                          const selectedEmployee =
                            getSelectedEmployeeInfo(index);

                          return (
                            <div
                              key={index}
                              className="mt-4 rounded-lg border border-gray-200 p-4 shadow-sm"
                            >
                              <div className="mb-4 border-b border-gray-200 pb-3">
                                <h3 className="text-base font-semibold text-gray-900">
                                  Empleado #{index + 1}
                                </h3>
                              </div>
                              <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <InputTime
                                      label="Hora de Inicio"
                                      placeholder="00:00"
                                      id={`horaInicio-${index}`}
                                      value={
                                        configuracionServicioTarifa.find(
                                          (s) =>
                                            s.idServicio === service.idServicio,
                                        )?.personal[index]?.horaInicio || ""
                                      }
                                      onChange={(e) =>
                                        setConfiguracionServicioTarifa(
                                          (prev) => {
                                            const newArray = [...prev];
                                            const indexServicio =
                                              newArray.findIndex(
                                                (s) =>
                                                  s.idServicio ===
                                                  service.idServicio,
                                              );

                                            // Ensure personal array exists and has enough elements
                                            if (
                                              !newArray[indexServicio].personal
                                            ) {
                                              newArray[indexServicio].personal =
                                                [];
                                            }

                                            // Ensure the personal array has the correct length
                                            while (
                                              newArray[indexServicio].personal
                                                .length <= index
                                            ) {
                                              newArray[
                                                indexServicio
                                              ].personal.push({
                                                idPersonal: 0,
                                                horaInicio: "",
                                                horaFin: "",
                                              });
                                            }

                                            // Update the personal array at the specific index
                                            const updatedPersonal = [
                                              ...newArray[indexServicio]
                                                .personal,
                                            ];
                                            updatedPersonal[index] = {
                                              ...updatedPersonal[index],
                                              horaInicio: timeFormat(
                                                e.target.value,
                                              ),
                                            };

                                            newArray[indexServicio] = {
                                              ...newArray[indexServicio],
                                              personal: updatedPersonal,
                                            };
                                            return newArray;
                                          },
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <InputTime
                                      label="Hora de Fin"
                                      placeholder="00:00"
                                      id={`horaFin-${index}`}
                                      value={
                                        configuracionServicioTarifa.find(
                                          (s) =>
                                            s.idServicio === service.idServicio,
                                        )?.personal[index]?.horaFin || ""
                                      }
                                      onChange={(e) =>
                                        setConfiguracionServicioTarifa(
                                          (prev) => {
                                            const newArray = [...prev];
                                            const indexServicio =
                                              newArray.findIndex(
                                                (s) =>
                                                  s.idServicio ===
                                                  service.idServicio,
                                              );

                                            // Ensure personal array exists and has enough elements
                                            if (
                                              !newArray[indexServicio].personal
                                            ) {
                                              newArray[indexServicio].personal =
                                                [];
                                            }

                                            // Ensure the personal array has the correct length
                                            while (
                                              newArray[indexServicio].personal
                                                .length <= index
                                            ) {
                                              newArray[
                                                indexServicio
                                              ].personal.push({
                                                idPersonal: 0,
                                                horaInicio: "",
                                                horaFin: "",
                                              });
                                            }

                                            // Update the personal array at the specific index
                                            const updatedPersonal = [
                                              ...newArray[indexServicio]
                                                .personal,
                                            ];
                                            updatedPersonal[index] = {
                                              ...updatedPersonal[index],
                                              horaFin: timeFormat(
                                                e.target.value,
                                              ),
                                            };

                                            newArray[indexServicio] = {
                                              ...newArray[indexServicio],
                                              personal: updatedPersonal,
                                            };
                                            return newArray;
                                          },
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="mb-1 flex flex-col gap-2">
                                    <label className="text-sm font-medium text-gray-700">
                                      Buscar Empleado
                                    </label>
                                    <ButtonAction
                                      Icon={Search}
                                      label=""
                                      color="blue"
                                      disabled={
                                        configuracionServicioTarifa.find(
                                          (s) =>
                                            s.idServicio === service.idServicio,
                                        )?.personal[index]?.horaInicio === "" ||
                                        isValidarEmpleadosDisponiblesPending
                                      }
                                      onClick={() => {
                                        handleValidarEmpleadosDisponibles(
                                          service.idServicio,
                                          index,
                                        );
                                      }}
                                    />
                                  </div>
                                </div>
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
                                          service.idServicio,
                                        );
                                      }}
                                      className="w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    >
                                      <option value="">
                                        Seleccionar empleado...
                                      </option>
                                      {validarEmpleadosDisponiblesData?.data?.map(
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

                                {selectedEmployee && (
                                  <>
                                    <div className="mt-2 rounded-lg bg-gray-50 p-3">
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
                                          <span>
                                            {selectedEmployee.telefono}
                                          </span>
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
                                    </div>
                                    {/* <div className="grid grid-cols-2 gap-4">
                                      <InputTime
                                        label="Hora de Inicio"
                                        placeholder="00:00"
                                        id="horaInicio"
                                        value={
                                          configuracionServicioTarifa.find(
                                            (s) =>
                                              s.idServicio ===
                                              service.idServicio,
                                          )?.horaInicio || ""
                                        }
                                        onChange={(e) =>
                                          setConfiguracionServicioTarifa(
                                            (prev) => {
                                              const newArray = [...prev];
                                              const index = newArray.findIndex(
                                                (s) =>
                                                  s.idServicio ===
                                                  service.idServicio,
                                              );
                                              newArray[index] = {
                                                ...newArray[index],
                                                horaInicio: e.target.value,
                                              };
                                              return newArray;
                                            },
                                          )
                                        }
                                      />
                                      <InputTime
                                        label="Hora de Fin"
                                        placeholder="00:00"
                                        id="horaFin"
                                        value={
                                          configuracionServicioTarifa[index]
                                            ?.horaFin || ""
                                        }
                                        onChange={(e) =>
                                          setConfiguracionServicioTarifa(
                                            (prev) => {
                                              const newArray = [...prev];
                                              const index = newArray.findIndex(
                                                (s) =>
                                                  s.idServicio ===
                                                  service.idServicio,
                                              );
                                              newArray[index] = {
                                                ...newArray[index],
                                                horaFin: e.target.value,
                                              };
                                              return newArray;
                                            },
                                          )
                                        }
                                      />
                                    </div> */}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        );
      case 7:
        return (
          <div className="mx-auto max-w-2xl space-y-6">
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
                          : "00:00:00"}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        Hora de Fin:
                      </span>{" "}
                      <span className="text-gray-600">
                        {selectedTarifa?.idServicio.horasFijas === 24
                          ? "00:00:00 (24 horas)"
                          : "00:00:00"}
                      </span>
                    </p>
                  </div>
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
                        <span className="text-gray-600">{0} requeridos</span>
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
                        {priceFormat(selectedTarifa?.precioAntesIva || 0)}
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
        clickOutsideClose={false}
        title={"Agregar orden de servicio"}
        size="3xl"
      >
        <>
          {/* Step Indicator */}
          <div className="flex items-center justify-center px-6 py-6">
            {[1, 2, 3, 4, 5, 6, 7].map((step) => (
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
                {step < 7 && (
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
            <div className="text-sm text-gray-500">
              Paso {currentStep} de {7}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex cursor-pointer items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                onClick={() => {
                  handleCloseModal();
                }}
              >
                Cancelar
              </button>
              {currentStep > 1 && (
                <button
                  type="button"
                  className="inline-flex cursor-pointer items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                  onClick={handlePrevious}
                >
                  Anterior
                </button>
              )}
              <button
                type="button"
                onClick={currentStep < 7 ? handleNext : handleSaveOrder}
                // disabled={
                //   isValidateFechasOrdenServicioPending ||
                //   isGetPrecioOrdenPending ||
                //   isCrearOrdenServicioPending ||
                //   isValidarIdOrdenServicioPending ||
                //   (currentStep === 1 &&
                //     !formOrdenServicio.numeroOrdenServicio) ||
                //   (currentStep === 2 && !formOrdenServicio.idLocacion) ||
                //   (currentStep === 3 && selectedServices.length === 0)
                // TODO: Revisar validaciones de los pasos
                // ||
                // (currentStep === 4 &&
                //   selectedTarifa?.idServicio.idTipoServicio
                //     .requierePersonal &&
                //   Object.values(selectedEmployeeForSlot).length < 0)
                // }
                className={`inline-flex cursor-pointer items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  currentStep < 7
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                } ${isCrearOrdenServicioPending ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {isCrearOrdenServicioPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Creando...
                  </div>
                ) : currentStep < 7 ? (
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
          {/* <div>
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
          </div> */}

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
              {/* Personal Asignado ({selectedOrderDetail?.cantidadPersonal}{" "}
              requerido) */}
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
