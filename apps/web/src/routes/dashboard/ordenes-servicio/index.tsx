import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import {
  Calendar,
  Check,
  CheckCircle2,
  CircleDollarSignIcon,
  EyeIcon,
  FileText,
  MapPin,
  MessageCircle,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";
import Table from "../../../components/common/Table";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { useEffect, useState } from "react";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import {
  useCreateOrdenServicio,
  useDeleteOrdenServicio,
  useGetOrdenesServicio,
  useGetOrdenServicioById,
  useGetPrecioOrdenServicio,
  useUpdateOrdenServicio,
  useUpdateValidateFechasOrdenServicio,
  useValidarEmpleadosDisponibles,
  useValidarHorarioServicioOrdenServicio,
  useValidarIdOrdenServicio,
  useValidarRangoHorarioPersonalOrdenServicio,
  useValidateFechasOrdenServicio,
} from "../../../api/queryFunctions/orden-servicio";
import type {
  CreateOrdenServicioDto,
  CreateOrdenServicioTarifaDto,
  UpdateOrdenServicioDto,
  UpdateOrdenServicioTarifaDto,
} from "../../../api/dtos";
import type { OrdenServicio } from "../../../api/types/orden-servicio";
import { useTipoServiciosActivo } from "../../../api/queryFunctions/servicios";
import { useTarifasPeriodoActivoByIdTipoServicio } from "../../../api/queryFunctions/tarifas";
import { priceFormat } from "../../../utils/PriceFormat";
import { timeFormat } from "../../../utils/TimeFormat";
import { dateFormat } from "../../../utils/DateFormat";
import type { Tarifa } from "../../../api/types/periodo";
import { useForm } from "../../../hooks/useForm";
import { OrderStateLabel } from "../../../components/common/OrderStateLabel";
import type { Puesto } from "../../../types";
import { toast } from "sonner";
import type { Servicio } from "../../../api/types/servicio";
import { SeleccionarIdentificadorOrden } from "../../../components/common/stepsOrdenServicio/SeleccionarIdentificadorOrden";
import { ConfigurarFechaOrdenServicio } from "../../../components/common/stepsOrdenServicio/ConfigurarFechaOrdenServicio";
import { SeleccionarServicio } from "../../../components/common/stepsOrdenServicio/SeleccionarServicio";
import { ConfigurarHorariosServicios } from "../../../components/common/stepsOrdenServicio/ConfigurarHorariosServicios";
import { AsignacionPersonalServicio } from "../../../components/common/stepsOrdenServicio/AsignacionPersonalServicio";
import { PreviewInformacionOrden } from "../../../components/common/stepsOrdenServicio/PreviewInformacionOrden";
import { SeleccionarPuestoCliente } from "../../../components/common/stepsOrdenServicio/SeleccionarPuestoCliente";

export const Route = createFileRoute("/dashboard/ordenes-servicio/")({
  component: RouteComponent,
});

// Temporary interface for internal edit state (includes idServicio for component logic)
interface UpdateOrdenServicioTarifaDtoInternal
  extends UpdateOrdenServicioTarifaDto {
  idServicio?: number;
}

function RouteComponent() {
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isOpenDetails, setIsOpenDetails] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [identificador, setIdentificador] = useState<{
    prefijo: string;
    codigo: number;
    codigoTipoServicio: number;
  }>({ prefijo: "", codigo: 0, codigoTipoServicio: 0 });

  const [selectedPuesto, setSelectedPuesto] = useState<Puesto | null>(null);
  const [selectedTipoServicio, setSelectedTipoServicio] = useState<
    number | null
  >(null);
  const [selectedServices, setSelectedServices] = useState<Servicio[]>([]);
  const [selectedTarifa, setSelectedTarifa] = useState<Tarifa | null>(null);

  const [mensajeRespuesta, setMensajeRespuesta] = useState<string>("");

  const [isIndefinite, setIsIndefinite] = useState(false);

  // Queries y mutaciones
  const { data: ordenesDeServicioQuery } = useGetOrdenesServicio();
  const { data: tipoServiciosQuery } = useTipoServiciosActivo();

  const { mutateAsync: obtenerOrdenServicioById } = useGetOrdenServicioById();
  const {
    mutate: tarifasPeriodoActivoByIdTipoServicio,
    data: tarifasPeriodoActivoByIdTipoServicioData,
  } = useTarifasPeriodoActivoByIdTipoServicio();

  // Validaciones fechas
  const {
    mutate: validateFechasOrdenServicio,
    isPending: isValidateFechasOrdenServicioPending,
  } = useValidateFechasOrdenServicio();

  const {
    mutate: updateValidateFechasOrdenServicio,
    isPending: isUpdateValidateFechasOrdenServicioPending,
  } = useUpdateValidateFechasOrdenServicio();

  // Precio orden servicio
  const {
    mutateAsync: getPrecioOrdenServicio,
    isPending: isGetPrecioOrdenPending,
  } = useGetPrecioOrdenServicio();
  const { mutate: crearOrdenServicio, isPending: isCrearOrdenServicioPending } =
    useCreateOrdenServicio();
  const {
    mutate: actualizarOrdenServicio,
    isPending: isActualizarOrdenServicioPending,
  } = useUpdateOrdenServicio();

  const { mutate: deleteOrdenServicio } = useDeleteOrdenServicio();

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
  } = useValidarRangoHorarioPersonalOrdenServicio();

  const {
    mutateAsync: validarHorarioServicioOrdenServicio,
    isPending: isValidarHorarioServicioOrdenServicioPending,
  } = useValidarHorarioServicioOrdenServicio();

  // Formulario crear orden de servicio
  const {
    form: formOrdenServicio,
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

  const {
    form: formOrdenServicioEdit,
    setForm: setFormOrdenServicioEdit,
    resetForm: resetFormOrdenServicioEdit,
  } = useForm<UpdateOrdenServicioDto>({
    fechaInicio: "",
    fechaFin: "",
    fechaActualizacion: "",
    precioTotal: 0,
    servicios: [],
  });

  const [configuracionServicioTarifa, setConfiguracionServicioTarifa] =
    useState<CreateOrdenServicioTarifaDto[]>([]);

  const [configuracionServicioTarifaEdit, setConfiguracionServicioTarifaEdit] =
    useState<UpdateOrdenServicioTarifaDtoInternal[]>([]);

  // Sample data for order details modal
  const [selectedOrderDetail, setSelectedOrderDetail] =
    useState<OrdenServicio | null>(null);

  const handleCloseModal = () => {
    setIsOpenAdd(false);
    setIsEditing(false);
    setCurrentStep(1);
    setSelectedTipoServicio(null);
    setSelectedPuesto(null);
    setSelectedServices([]);
    setSelectedTarifa(null);
    setIsIndefinite(false);
    resetFormOrdenServicio();
    resetFormOrdenServicioEdit();
    setIdentificador({ prefijo: "", codigo: 0, codigoTipoServicio: 0 });
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (identificador.codigoTipoServicio === 0) {
        toast.error("El prefijo es requerido");
        return;
      }

      if (identificador.codigo === 0) {
        toast.error("El código es requerido");
        return;
      }

      formOrdenServicio.numeroOrdenServicio = `${identificador.prefijo}-${identificador.codigo}`;

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
            tarifasPeriodoActivoByIdTipoServicio(
              identificador.codigoTipoServicio,
            );
            setCurrentStep(4);
          },
        },
      );
      setSelectedServices([]);
      return;
    }

    if (currentStep === 5) {
      const campoHorario = configuracionServicioTarifa.some(
        (service) => service.horaInicio === "" && service.horaFin === "",
      );
      if (campoHorario) {
        toast.error("Los campos de hora son requeridos");
        return;
      }

      // Va a recorrer todos los servicios seleccionados y va a utilizar el endpoint de

      try {
        const response = await Promise.allSettled(
          configuracionServicioTarifa.map(async (servicio) => {
            return validarHorarioServicioOrdenServicio({
              idTarifa: servicio.idTarifa,
              idServicio: servicio.idServicio || 0,
              horaInicio: timeFormat(servicio.horaInicio),
              horaFin:
                servicio.horaFin === ""
                  ? "00:00:00"
                  : timeFormat(servicio.horaFin),
            });
          }),
        );
        const success = response.every((r) => r.status === "fulfilled");
        if (success) {
          setCurrentStep(6);
          toast.success("Horarios validados correctamente");
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
            const response = await getPrecioOrdenServicio({
              horaInicio: servicio.horaInicio,
              horaFin: servicio.horaFin === "" ? "00:00:00" : servicio.horaFin,
              fechaFin: isIndefinite ? null : formOrdenServicio.fechaFin,
              fechaInicio: formOrdenServicio.fechaInicio,
              idTarifa: servicio.idTarifa,
              idServicio: servicio.idServicio || 0,
            });

            if (response.status === 201) {
              servicio.precio = response.data.precio;
              precioTotal += response.data.precio;
              setMensajeRespuesta(response.data.message);
            }
            return response;
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
        setFormOrdenServicio({
          ...formOrdenServicio,
          precioTotal: precioTotal,
        });
        toast.success(
          "Rango horario personal y precio de orden de servicio validados correctamente",
        );
        setCurrentStep(7);
      }
      return;
    }

    if (currentStep < 7) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleNextEdit = async () => {
    if (currentStep === 1) {
      updateValidateFechasOrdenServicio(
        {
          id: selectedOrderDetail?.idOrdenServicio || 0,
          data: {
            fechaInicio: formOrdenServicioEdit.fechaInicio,
            fechaFin: isIndefinite ? null : formOrdenServicioEdit.fechaFin,
            fechaActualizacion: new Date().toISOString(),
          },
        },
        {
          onSuccess: () => {
            setCurrentStep(2);
          },
        },
      );
      return;
    }

    if (currentStep === 2) {
      let allValidated = true;
      let precioTotal = 0;
      try {
        const responseRangoHorarioValidacion = await Promise.allSettled(
          configuracionServicioTarifaEdit.map(async (servicio) => {
            return validarRangoHorarioPersonalOrdenServicio({
              horaInicio: servicio.horaInicio,
              horaFin: servicio.horaFin === "" ? "00:00:00" : servicio.horaFin,
              personal: servicio.personal,
            });
          }),
        );

        const responsePrecioOrdenServicio = await Promise.allSettled(
          configuracionServicioTarifaEdit.map(async (servicio) => {
            const response = await getPrecioOrdenServicio({
              horaInicio: servicio.horaInicio,
              horaFin: servicio.horaFin === "" ? "00:00:00" : servicio.horaFin,
              fechaFin: isIndefinite ? null : formOrdenServicioEdit.fechaFin,
              fechaInicio: formOrdenServicioEdit.fechaInicio,
              idTarifa: servicio.idTarifa,
              idServicio: servicio.idServicio || 0,
            });

            if (response.status === 201) {
              servicio.precio = response.data.precio;
              precioTotal += response.data.precio;
              setMensajeRespuesta(response.data.message);
            }
            return response;
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
        setFormOrdenServicioEdit({
          ...formOrdenServicioEdit,
          precioTotal: precioTotal,
        });
        toast.success(
          "Rango horario personal y precio de orden de servicio validados correctamente",
        );
        setCurrentStep(3);
      }
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveOrder = async () => {
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

  const handleUpdateOrder = async () => {
    // Clean the services data to match UpdateOrdenServicioTarifaDto structure
    const cleanedServicios = configuracionServicioTarifaEdit.map(
      ({ idServicio, ...rest }) => rest,
    );

    const ordenesDeServicioMutation: UpdateOrdenServicioDto = {
      fechaInicio: formOrdenServicioEdit.fechaInicio,
      fechaFin: isIndefinite ? null : formOrdenServicioEdit.fechaFin,
      precioTotal: formOrdenServicioEdit.precioTotal,
      fechaActualizacion: new Date().toISOString(),
      servicios: cleanedServicios,
    };

    actualizarOrdenServicio(
      {
        id: selectedOrderDetail?.idOrdenServicio || 0,
        data: ordenesDeServicioMutation,
      },
      {
        onSuccess: () => {
          handleCloseModal();
          setIsEditing(false);
        },
      },
    );
  };

  const handleEditOrder = async (idOrdenServicio: number) => {
    const ordenServicioById = await obtenerOrdenServicioById(idOrdenServicio);
    setFormOrdenServicioEdit({
      ...ordenServicioById?.data,
      fechaInicio: ordenServicioById?.data?.fechaInicio || "",
      fechaFin: ordenServicioById?.data?.fechaFin || null,
      fechaActualizacion: ordenServicioById?.data?.fechaActualizacion || "",
      precioTotal: ordenServicioById?.data?.precioTotal || 0,
      servicios: [],
    });

    setConfiguracionServicioTarifaEdit(
      ordenServicioById?.data?.tarifas.map((servicio) => ({
        idTarifa: servicio.idTarifa.idTarifa,
        cantidadPersonal: servicio.cantidadPersonal,
        horaInicio: servicio.horaInicio,
        horaFin: servicio.horaFin,
        precio: servicio.precio || 0,
        personal: [], // Will be populated when user assigns staff
        // Keep idServicio for internal component logic, but remove before sending to API
        idServicio: servicio.idTarifa.idServicio.idServicio,
      })) || [],
    );

    console.log(
      "ordenServicioById?.data?.tarifas: ",
      ordenServicioById?.data?.tarifas,
    );
    setSelectedServices(
      ordenServicioById?.data?.tarifas.map((servicio) => ({
        ...servicio.idTarifa.idServicio,
      })) || [],
    );

    console.log("ordenServicioByIdQuery?.data: ", ordenServicioById?.data);
    setIsIndefinite(ordenServicioById?.data?.fechaFin === null);
  };

  const handleLiquidarOrdenServicio = (idOrdenServicio: number) => {
    console.log("idOrdenServicio: ", idOrdenServicio);
  };

  const handleValidarEmpleadosDisponibles = async (
    idServicio: number,
    indexEmpleado: number,
  ) => {
    const servicio = isEditing
      ? configuracionServicioTarifaEdit.find((s) => s.idServicio === idServicio)
      : configuracionServicioTarifa.find((s) => s.idServicio === idServicio);

    // Ensure personal array exists and has the required index
    if (!servicio?.personal || !servicio.personal[indexEmpleado]) {
      console.warn("Personal data not found for validation");
      return;
    }

    const fechaInicio = isEditing
      ? formOrdenServicioEdit.fechaInicio
      : formOrdenServicio.fechaInicio;
    const fechaFin = isEditing
      ? isIndefinite
        ? null
        : formOrdenServicioEdit.fechaFin
      : isIndefinite
        ? null
        : formOrdenServicio.fechaFin;

    await validarEmpleadosDisponibles({
      fechaInicio,
      fechaFin,
      horaInicio: servicio.personal[indexEmpleado].horaInicio || "00:00:00",
      horaFin: servicio.personal[indexEmpleado].horaFin || "00:00:00",
    });
  };

  const handleSelectedServices = (servicio: Servicio) => {
    if (!selectedServices.includes(servicio)) {
      setSelectedServices((prev) => [...prev, servicio]);
    } else {
      setSelectedServices((prev) => prev.filter((s) => s !== servicio));
    }
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
    setConfiguracionServicioTarifa(initialConfig);
  }, [selectedServices]);

  const columns: ColumnDef<OrdenServicio>[] = [
    {
      accessorKey: "numeroOrdenServicio",
      header: "Id. Orden de Servicio",
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap text-black">
          {row.original.ordenServicioId.descripcionId}
        </span>
      ),
    },
    {
      header: "cliente",
      accessorKey: "idLocacion.idCliente.nombre",
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap text-black capitalize">
          {row.original.idLocacion?.idCliente.nombre || "No especificado"}
        </span>
      ),
    },
    {
      accessorKey: "idLocacion",
      header: "Puesto",
      cell: ({ row }) => (
        <span className="flex flex-col gap-1 font-medium whitespace-nowrap text-black capitalize">
          {row.original.idLocacion?.nombre || "No especificado"}
          <span className="text-sm text-gray-500">
            {row.original.idLocacion?.direccion}
          </span>
        </span>
      ),
    },
    {
      accessorKey: "fechas",
      header: "Fechas",
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap text-gray-500">
          Inicio: {row.original.fechaInicio} - Fin:{" "}
          {row.original.fechaFin || "Indefinida"}
        </span>
      ),
    },
    {
      accessorKey: "precioTotal",
      header: "Precio Total",
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap text-green-500">
          {priceFormat(Number(row.original.precioTotal))}
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
                handleEditOrder(row.original.idOrdenServicio);
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
              Icon={MessageCircle}
              label="Comentarios"
              onClick={() => {
                // setIsEditing(true);
                // setSelectedOrderDetail(row.original);
                // handleEditOrder(row.original.idOrdenServicio);
              }}
            />
            <ButtonAction
              Icon={CircleDollarSignIcon}
              label="Liquidar"
              onClick={() => {
                handleLiquidarOrdenServicio(row.original.idOrdenServicio);
              }}
            />
            <ButtonAction
              Icon={TrashIcon}
              label="Eliminar"
              onClick={() => {
                setIsOpenDelete(true);
                setSelectedOrderDetail(row.original);
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
          <SeleccionarIdentificadorOrden
            identificador={identificador}
            setIdentificador={setIdentificador}
          />
        );

      case 2:
        return (
          <SeleccionarPuestoCliente
            formOrdenServicio={formOrdenServicio}
            setFormOrdenServicio={setFormOrdenServicio}
            setSelectedPuesto={setSelectedPuesto}
          />
        );

      case 3:
        return (
          <ConfigurarFechaOrdenServicio
            formOrdenServicio={formOrdenServicio}
            setFormOrdenServicio={(newForm) =>
              setFormOrdenServicio(newForm as CreateOrdenServicioDto)
            }
            isIndefinite={isIndefinite}
            setIsIndefinite={setIsIndefinite}
          />
        );

      case 4:
        return (
          <SeleccionarServicio
            selectedServices={selectedServices}
            tarifasPeriodoActivoByIdTipoServicioData={
              tarifasPeriodoActivoByIdTipoServicioData?.data || []
            }
            tipoServiciosQuery={tipoServiciosQuery?.data || []}
            handleSelectedServices={handleSelectedServices}
            setConfiguracionServicioTarifa={setConfiguracionServicioTarifa}
            setSelectedTarifa={setSelectedTarifa}
          />
        );

      case 5:
        return (
          <ConfigurarHorariosServicios
            selectedServices={selectedServices}
            configuracionServicioTarifa={configuracionServicioTarifa}
            setConfiguracionServicioTarifa={setConfiguracionServicioTarifa}
          />
        );

      case 6:
        return (
          <AsignacionPersonalServicio
            selectedServices={selectedServices}
            configuracionServicioTarifa={configuracionServicioTarifa}
            setConfiguracionServicioTarifa={setConfiguracionServicioTarifa}
            handleValidarEmpleadosDisponibles={
              handleValidarEmpleadosDisponibles
            }
            validarEmpleadosDisponiblesData={
              validarEmpleadosDisponiblesData?.data || []
            }
            isValidarEmpleadosDisponiblesPending={
              isValidarEmpleadosDisponiblesPending
            }
          />
        );
      case 7:
        return (
          <PreviewInformacionOrden
            selectedPuesto={selectedPuesto}
            selectedTarifa={selectedTarifa}
            formOrdenServicio={formOrdenServicio}
            configuracionServicioTarifa={configuracionServicioTarifa}
            mensajeRespuesta={mensajeRespuesta}
            isIndefinite={isIndefinite}
          />
        );

      default:
        return null;
    }
  };

  const renderStepEditContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ConfigurarFechaOrdenServicio
            formOrdenServicio={formOrdenServicioEdit}
            setFormOrdenServicio={(newForm) =>
              setFormOrdenServicioEdit(newForm as UpdateOrdenServicioDto)
            }
            isIndefinite={isIndefinite}
            setIsIndefinite={setIsIndefinite}
          />
        );

      case 2:
        return (
          <AsignacionPersonalServicio
            selectedServices={selectedServices}
            configuracionServicioTarifa={configuracionServicioTarifaEdit}
            setConfiguracionServicioTarifa={setConfiguracionServicioTarifaEdit}
            handleValidarEmpleadosDisponibles={
              handleValidarEmpleadosDisponibles
            }
            isValidarEmpleadosDisponiblesPending={
              isValidarEmpleadosDisponiblesPending
            }
            validarEmpleadosDisponiblesData={
              validarEmpleadosDisponiblesData?.data || []
            }
          />
        );

      case 3:
        return (
          <PreviewInformacionOrden
            isEditing={isEditing}
            selectedPuesto={selectedOrderDetail?.idLocacion || null}
            selectedTarifa={selectedTarifa}
            formOrdenServicio={formOrdenServicioEdit}
            configuracionServicioTarifa={configuracionServicioTarifaEdit}
            mensajeRespuesta={mensajeRespuesta}
            isIndefinite={isIndefinite}
          />
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
          enablePagination={true}
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
                disabled={
                  isValidateFechasOrdenServicioPending ||
                  isGetPrecioOrdenPending ||
                  isCrearOrdenServicioPending ||
                  isValidarIdOrdenServicioPending ||
                  isValidarRangoHorarioPersonalOrdenServicioPending ||
                  isValidarHorarioServicioOrdenServicioPending ||
                  (currentStep === 1 &&
                    (identificador.codigoTipoServicio === 0 ||
                      identificador.codigo === 0)) ||
                  (currentStep === 2 && !formOrdenServicio.idLocacion) ||
                  (currentStep === 3 && !formOrdenServicio.fechaInicio) ||
                  (currentStep === 4 &&
                    configuracionServicioTarifa.length === 0)
                  // TODO: Revisar validaciones de los pasos
                }
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
        isOpen={isEditing}
        onClose={() => {
          setIsEditing(false);
        }}
        clickOutsideClose={false}
        title={"Editar orden de servicio"}
        size="3xl"
      >
        <>
          {/* Step Indicator */}
          <div className="flex items-center justify-center px-6 py-6">
            {[1, 2, 3].map((step) => (
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
                {step < 3 && (
                  <div
                    className={`mx-2 h-0.5 w-16 ${step < currentStep ? `bg-green-500` : `bg-gray-200`}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {renderStepEditContent()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 px-6 pt-6 pb-4">
            <div className="text-sm text-gray-500">
              Paso {currentStep} de {3}
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
                onClick={currentStep < 3 ? handleNextEdit : handleUpdateOrder}
                // disabled={
                //   isValidateFechasOrdenServicioPending ||
                //   isGetPrecioOrdenPending ||
                //   (currentStep === 1 &&
                //     (identificador.codigoTipoServicio === 0 ||
                //       identificador.codigo === 0)) ||
                //   (currentStep === 2 && !formOrdenServicio.idLocacion)
                //   // TODO: Revisar validaciones de los pasos
                // }
                className={`inline-flex cursor-pointer items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  currentStep < 3
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                } ${isActualizarOrdenServicioPending ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {isActualizarOrdenServicioPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Actualizando...
                  </div>
                ) : currentStep < 3 ? (
                  "Siguiente"
                ) : (
                  "Actualizar Orden"
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
              Servicio{" "}
              {selectedOrderDetail?.tarifas?.length &&
              selectedOrderDetail.tarifas.length > 1
                ? "s"
                : ""}
            </h3>
            {selectedOrderDetail?.tarifas.map((tarifa) => (
              <div
                className="grid grid-cols-1 gap-4 text-sm text-gray-700 md:grid-cols-2"
                key={tarifa.idTarifa.idServicio.idServicio}
              >
                <div>
                  <p>
                    <span className="font-medium">Nombre:</span>{" "}
                    {tarifa.idTarifa.idServicio.codigo}
                  </p>
                  <p>
                    <span className="font-medium">Categoría:</span>{" "}
                    {tarifa.idTarifa.idServicio.idTipoServicio.descripcion}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="font-medium">Precio:</span> ${" "}
                    {tarifa.idTarifa.precioTotal.toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Descripción:</span>{" "}
                    {tarifa.idTarifa.idServicio.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Sección de Fechas y Horarios */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Calendar className="h-5 w-5 text-blue-600" />
              Fecha orden de servicio
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
                    ? new Date(
                        selectedOrderDetail?.fechaFin || "",
                      ).toLocaleDateString("es-ES")
                    : "Indefinida"}
                </p>
              </div>
            </div>
          </div>

          {/* Sección de Estado */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              Estado de la orden de servicio
            </h3>
            <OrderStateLabel
              state={selectedOrderDetail?.idEstadoOrdenServicio?.nombre || ""}
            />
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
        onDelete={() => {
          deleteOrdenServicio(selectedOrderDetail?.idOrdenServicio || 0, {
            onSuccess: () => {
              setIsOpenDelete(false);
              setSelectedOrderDetail(null);
            },
          });
        }}
        onClose={() => setIsOpenDelete(false)}
      />
    </Section>
  );
}
