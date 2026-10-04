import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { WizardFooter, WizardStepper } from "../../../components/ui/common/Wizard";
import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Table from "../../../components/common/Table";
import { ServiciosOrdenResumen } from "../../../components/common/ServiciosOrdenResumen";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { useState } from "react";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import {
  useAnularOrdenServicio,
  useCancelarOrdenServicio,
  useCreateOrdenServicio,
  useDeleteOrdenServicio,
  useDescargarPdf,
  useEnviarPdfPorCorreo,
  useGetOrdenesServicio,
  useGetOrdenServicioById,
  useGetPrecioOrdenServicio,
  useImprimirPdf,
  useUpdateOrdenServicio,
  useUpdateValidateFechasOrdenServicio,
  useValidarEmpleadosDisponibles,
  useValidarHorarioServicioOrdenServicio,
  useValidarIdOrdenServicio,
  useValidateFechasOrdenServicio,
  useFilterOrdenesServicio,
  useValidarRangoHorarioPersonalOrdenServicio,
} from "../../../api/queryFunctions/orden-servicio";
import {
  type CreateOrdenServicioDto,
  type CreateOrdenServicioTarifaDto,
  type CreateOrdenServicioDetalleDto,
  type UpdateOrdenServicioDto,
  type UpdateOrdenServicioTarifaDto,
  OrdenServicioFilterColumn,
  OrigenServicioEnum,
} from "../../../api/dtos";
import type { OrdenServicio, PrecioOrdenResponse } from "../../../api/types/orden-servicio";
import { useTipoServiciosActivo } from "../../../api/queryFunctions/servicios";
import { useTarifasPeriodoActivoByIdTipoServicio } from "../../../api/queryFunctions/tarifas";
import { priceFormat } from "../../../utils/PriceFormat";
import { timeFormat } from "../../../utils/TimeFormat";
import { dateFormat } from "../../../utils/DateFormat";

import { OrderStateLabel } from "../../../components/common/OrderStateLabel";
import type { Cliente, Puesto } from "../../../types";
import { toast } from "sonner";
import type { Servicio } from "../../../api/types/servicio";
import type { Tarifa } from "../../../api/types/periodo";
import { SeleccionarIdentificadorOrden } from "../../../components/common/stepsOrdenServicio/SeleccionarIdentificadorOrden";
import { ConfigurarFechaOrdenServicio } from "../../../components/common/stepsOrdenServicio/ConfigurarFechaOrdenServicio";
import { COBRO_PARCIAL_INICIAL, type CobroParcial } from "../../../utils/cobroParcial";
import { SeleccionarOrigenServicio } from "../../../components/common/stepsOrdenServicio/SeleccionarOrigenServicio";
import { SeleccionarServicio } from "../../../components/common/stepsOrdenServicio/SeleccionarServicio";
import { ConfigurarHorariosServicios } from "../../../components/common/stepsOrdenServicio/ConfigurarHorariosServicios";
import { ConfigurarHorarioAMedida } from "../../../components/common/stepsOrdenServicio/ConfigurarHorarioAMedida";
import { AsignacionPersonalServicio } from "../../../components/common/stepsOrdenServicio/AsignacionPersonalServicio";
import { PreviewInformacionOrden } from "../../../components/common/stepsOrdenServicio/PreviewInformacionOrden";
import { SeleccionarPuestoCliente } from "../../../components/common/stepsOrdenServicio/SeleccionarPuestoCliente";
import { TIPO_SERVICIO_MONITOREO_ALARMAS } from "../../../components/common/stepsOrdenServicio/tipoServicioConstantes";
import { ObservacionesOrdenServicio } from "../../../components/ui/modals/ObservacionesOrdenServicio";
import { useGetObservacionesOrdenServicio } from "../../../api/queryFunctions/orden-servicio/observaciones";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";
import { EnvioCorreos } from "../../../components/ui/modals/EnvioCorreos";
import { OrdenDetalles } from "../../../components/ui/modals/OrdenDetalles";
import { useForm } from "react-hook-form";
import { useGetNextIdOrdenServicio } from "../../../api/queryFunctions/orden-servicio/orden-servicio-id";
import { printBase64PDF } from "../../../utils/printBase64File";
import { queryClient } from "../../../App";
import type { ServerFilterColumn } from "../../../components/common/Table";
import { useServerPagination } from "../../../hooks/useServerPagination";

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
  const [confirmConfig, setConfirmConfig] = useState<{
    text: string;
    action: () => void;
    actionLabel?: string;
  }>({
    text: "",
    action: () => { },
  });
  const [isOpenObservaciones, setIsOpenObservaciones] = useState(false);
  const [isOpenEmail, setIsOpenEmail] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [identificador, setIdentificador] = useState<{
    prefijo: string;
    codigo: number;
    codigoTipoServicio: number;
  }>({ prefijo: "", codigo: 0, codigoTipoServicio: 0 });

  const [selectedPuesto, setSelectedPuesto] = useState<Puesto | null>(null);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedServices, setSelectedServices] = useState<Servicio[]>([]);

  const [mensajeRespuesta, setMensajeRespuesta] = useState<string>("");
  // Respuesta completa de POST /orden-servicio/obtener-precio: trae el total de la orden y el
  // desglose de precio de cada servicio, se usa directo en el paso de vista previa (PreviewInformacionOrden)
  const [precioOrdenDetalle, setPrecioOrdenDetalle] =
    useState<PrecioOrdenResponse | null>(null);

  const [isIndefinite, setIsIndefinite] = useState(false);
  const [cobroParcial, setCobroParcial] = useState<CobroParcial>(COBRO_PARCIAL_INICIAL);

  // Paso 4: origen de la orden de servicio (catalogo / a la medida). "a la medida" reemplaza los pasos de
  // seleccionar servicios + horarios por un unico horario para toda la orden (ver ConfigurarHorarioAMedida)
  const [origenServicio, setOrigenServicio] = useState<OrigenServicioEnum | null>(null);
  const [horarioAMedida, setHorarioAMedida] = useState<{ horaInicio: string; horaFin: string }>({
    horaInicio: "",
    horaFin: "",
  });
  // El flujo "a la medida" no tiene paso de seleccionar servicios ni de configurar horarios por servicio, por
  // lo que tiene un paso menos que el flujo por catalogo
  const totalSteps = origenServicio === OrigenServicioEnum.A_MEDIDA ? 6 : 7;

  const { mutate: filterOrdenesServicio, isPending: isFilteringOrdenesServicio } = useFilterOrdenesServicio();
  const [filteredOrdenesServicio, setFilteredOrdenesServicio] = useState<OrdenServicio[] | null>(null);
  const [ordenServicioEditData, setOrdenServicioEditData] =
    useState<OrdenServicio | null>(null);

  // Paginación server-side
  const { page, setPage, pageSize, setPageSize, paginationParams } = useServerPagination(20);

  // Queries y mutaciones
  const { data: ordenesDeServicioQuery } = useGetOrdenesServicio(paginationParams);
  const { data: tipoServiciosQuery } = useTipoServiciosActivo();
  const { data: nextIdOrdenServicioQuery } = useGetNextIdOrdenServicio();

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

  const { mutate: updateValidateFechasOrdenServicio } =
    useUpdateValidateFechasOrdenServicio();

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
  const { mutate: cancelarOrdenServicio } = useCancelarOrdenServicio();
  const { mutate: anularOrdenServicio } = useAnularOrdenServicio();

  // Validaciones
  const {
    mutate: validarIdOrdenServicio,
    isPending: isValidarIdOrdenServicioPending,
  } = useValidarIdOrdenServicio();
  // const {
  //   mutateAsync: validarEmpleadosDisponibles,
  //   data: validarEmpleadosDisponiblesData,
  //   isPending: isValidarEmpleadosDisponiblesPending,
  // } = useValidarEmpleadosDisponibles();

  const {
    mutateAsync: validarRangoHorarioPersonalOrdenServicio,
    isPending: isValidarRangoHorarioPersonalOrdenServicioPending,
  } = useValidarRangoHorarioPersonalOrdenServicio();

  const {
    mutateAsync: validarHorarioServicioOrdenServicio,
    isPending: isValidarHorarioServicioOrdenServicioPending,
  } = useValidarHorarioServicioOrdenServicio();

  // Observaciones
  // Estado para controlar qué observaciones cargar
  const [selectedOrderIdForObservaciones, setSelectedOrderIdForObservaciones] =
    useState<number | null>(null);

  // Query para obtener observaciones
  const { data: observacionesQueryData } = useGetObservacionesOrdenServicio(
    selectedOrderIdForObservaciones || 0,
  );

  // Generacion de archivos
  const { mutate: enviarPdfPorCorreo, isPending: enviarCorreoPending } =
    useEnviarPdfPorCorreo();
  const { mutate: descargarPdf } = useDescargarPdf();
  const { mutateAsync: imprimirPdf } = useImprimirPdf();

  // Formulario crear orden de servicio
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    setValue: setValueCreate,
    watch: watchCreate,
  } = useForm<CreateOrdenServicioDto>({
    defaultValues: {
      fechaInicio: "",
      fechaFin: "",
      fechaCreacion: "",
      idLocacion: 0,
      precioTotal: 0,
      numeroOrdenServicio: "",
      servicios: [],
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    watch: watchEdit,
  } = useForm<UpdateOrdenServicioDto>({
    defaultValues: {
      fechaInicio: "",
      fechaFin: "",
      fechaActualizacion: "",
      precioTotal: 0,
      // servicios: [],
    },
  });

  const [configuracionServicioTarifa, setConfiguracionServicioTarifa] =
    useState<CreateOrdenServicioTarifaDto[]>([]);

  const [configuracionServicioTarifaEdit, setConfiguracionServicioTarifaEdit] =
    useState<UpdateOrdenServicioTarifaDtoInternal[]>([]);

  // Sample data for order details modal
  const [selectedOrderDetail, setSelectedOrderDetail] =
    useState<OrdenServicio | null>(null);

  // Tipo de servicio seleccionado en el paso 1 (usado en el paso 2 para saber si se debe buscar cliente o
  // locacion, y en el paso 4 para saber si se debe preguntar el origen de la orden o fijarlo automaticamente,
  // ver SeleccionarPuestoCliente y SeleccionarOrigenServicio)
  const tipoServicioSeleccionado = tipoServiciosQuery?.data?.data?.find(
    (tipo) => tipo.idTipoServicio === identificador.codigoTipoServicio,
  );
  const esOrdenMonitoreo =
    tipoServicioSeleccionado?.nombre === TIPO_SERVICIO_MONITOREO_ALARMAS;

  const handleCloseModal = () => {
    setIsOpenAdd(false);
    setIsEditing(false);
    setCurrentStep(1);
    setSelectedPuesto(null);
    setSelectedCliente(null);
    setConfiguracionServicioTarifa([]);
    setSelectedServices([]);
    setIsIndefinite(false);
    setCobroParcial(COBRO_PARCIAL_INICIAL);
    setPrecioOrdenDetalle(null);
    setMensajeRespuesta("");
    setOrigenServicio(null);
    setHorarioAMedida({ horaInicio: "", horaFin: "" });
    resetCreate();
    resetEdit();
    setIdentificador({ prefijo: "", codigo: nextIdOrdenServicioQuery?.data || 0, codigoTipoServicio: 0 });
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

      const numeroStr = `${identificador.prefijo}-${identificador.codigo}`;
      setValueCreate("numeroOrdenServicio", numeroStr);

      validarIdOrdenServicio(
        {
          descripcionId: numeroStr,
        },
        {
          // apiHandler no rechaza las llamadas POST que responden con error (ver src/api/config.ts): resuelve
          // con status 4xx/5xx en vez de lanzar, por eso onSuccess se dispara igual y hay que revisar el status
          // de la respuesta antes de avanzar de paso (el toast de error ya lo muestra el hook internamente)
          onSuccess: (response) => {
            if (response.status === 200 || response.status === 201) {
              setCurrentStep(2);
            }
          },
        },
      );
      return;
    }

    if (currentStep === 3) {
      if (watchCreate("fechaInicio") === "") {
        toast.error("La fecha de inicio es requerida");
        return;
      }

      if (watchCreate("fechaFin") === "" && !isIndefinite) {
        toast.error("La fecha de fin es requerida o debe ser indefinida");
        return;
      }

      if (cobroParcial.activo) {
        if (cobroParcial.diaInicio == null || cobroParcial.diaFin == null) {
          toast.error("Seleccione el día de inicio y el día de fin del cobro parcial");
          return;
        }
        if (cobroParcial.diaInicio > cobroParcial.diaFin) {
          toast.error("El día de inicio de cobro no puede ser mayor al día de fin (el rango debe quedar dentro del mismo mes)");
          return;
        }
      }

      validateFechasOrdenServicio(
        {
          fechaInicio: dateFormat(new Date(watchCreate("fechaInicio"))),
          fechaFin: isIndefinite
            ? null
            : dateFormat(new Date(watchCreate("fechaFin") || "")),
        },
        {
          // Ver nota en el paso 1: apiHandler resuelve (no rechaza) las respuestas de error de POST, hay que
          // revisar el status antes de avanzar (ej: fecha de fin anterior a la fecha de inicio)
          onSuccess: (response) => {
            if (response.status === 200 || response.status === 201) {
              tarifasPeriodoActivoByIdTipoServicio(
                identificador.codigoTipoServicio,
              );
              setCurrentStep(4);
            }
          },
        },
      );
      setSelectedServices([]);
      return;
    }

    // Paso 4: origen de la orden de servicio (catalogo / a la medida)
    if (currentStep === 4) {
      if (!origenServicio) {
        toast.error("Debe seleccionar el origen de la orden de servicio");
        return;
      }

      if (origenServicio === OrigenServicioEnum.A_MEDIDA && cobroParcial.activo) {
        setCobroParcial(COBRO_PARCIAL_INICIAL);
        toast.info("El cobro parcial mensual solo aplica para órdenes de catálogo, se desactivó");
      }

      // Al entrar/cambiar de origen se descarta cualquier seleccion de servicio u horario del otro camino
      setSelectedServices([]);
      setConfiguracionServicioTarifa([]);
      setHorarioAMedida({ horaInicio: "", horaFin: "" });
      setCurrentStep(5);
      return;
    }

    // Paso 5 (solo A LA MEDIDA): un unico horario para toda la orden + calculo de precio dia por dia
    if (currentStep === 5 && origenServicio === OrigenServicioEnum.A_MEDIDA) {
      if (horarioAMedida.horaInicio === "" || horarioAMedida.horaFin === "") {
        toast.error("Las horas de inicio y fin son requeridas");
        return;
      }

      try {
        const responsePrecioOrden = await getPrecioOrdenServicio({
          origenServicio: OrigenServicioEnum.A_MEDIDA,
          fechaInicio: watchCreate("fechaInicio"),
          fechaFin: isIndefinite ? null : watchCreate("fechaFin"),
          horaInicio: timeFormat(horarioAMedida.horaInicio),
          horaFin: timeFormat(horarioAMedida.horaFin),
        });

        const precioValidado =
          (responsePrecioOrden.status === 200 || responsePrecioOrden.status === 201) &&
          !!responsePrecioOrden.data;

        if (precioValidado && responsePrecioOrden.data) {
          const precioData = responsePrecioOrden.data;
          setPrecioOrdenDetalle(precioData);
          setMensajeRespuesta(precioData.message);
          setValueCreate("precioTotal", precioData.precio || 0);

          // Se guarda tal cual el desglose que devolvio el backend (una fila por cada dia del rango), es
          // exactamente lo que se reenvia al crear la orden, sin volver a calcular nada en el front
          setConfiguracionServicioTarifa(precioData.servicios);

          toast.success("Precio de la orden de servicio calculado correctamente");
          setCurrentStep(6);
        }
      } catch (error) {
        console.log(error);
        toast.error("Error al calcular el precio de la orden de servicio");
      }
      return;
    }

    // Paso 6 (solo CATALOGO): validar horario de cada servicio elegido + calculo de precio
    if (currentStep === 6 && origenServicio === OrigenServicioEnum.CATALOGO) {
      // const campoHorario = configuracionServicioTarifa.some(
      //   (service) => service.horaInicio === "" && service.horaFin === "",
      // );
      // if (campoHorario) {
      //   toast.error("Los campos de hora son requeridos");
      //   return;
      // }

      try {
        const [responseHorarioServicio, responsePrecioOrden] = await Promise.all([
          Promise.allSettled(
            configuracionServicioTarifa.map(async (servicio) => {
              return validarHorarioServicioOrdenServicio({
                origenServicio: OrigenServicioEnum.CATALOGO,
                idTarifa: servicio.idTarifa,
                horaInicio: timeFormat(servicio.horaInicio),
                horaFin:
                  servicio.horaFin === ""
                    ? "00:00:00"
                    : timeFormat(servicio.horaFin),
                // Dias de la semana en que se presta el servicio (ver SelectorDiasSemana en
                // ConfigurarHorariosServicios), default true si el usuario no los toco
                lunes: servicio.lunes,
                martes: servicio.martes,
                miercoles: servicio.miercoles,
                jueves: servicio.jueves,
                viernes: servicio.viernes,
                sabado: servicio.sabado,
                domingo: servicio.domingo,
                incluyeFestivos: servicio.incluyeFestivos,
              });
            }),
          ),
          getPrecioOrdenServicio({
            origenServicio: OrigenServicioEnum.CATALOGO,
            fechaInicio: watchCreate("fechaInicio"),
            fechaFin: isIndefinite ? null : watchCreate("fechaFin"),
            servicios: configuracionServicioTarifa.map((servicio) => ({
              idTarifa: servicio.idTarifa || 0,
              horaInicio: servicio.horaInicio,
              horaFin: servicio.horaFin === "" ? "00:00:00" : servicio.horaFin,
              lunes: servicio.lunes,
              martes: servicio.martes,
              miercoles: servicio.miercoles,
              jueves: servicio.jueves,
              viernes: servicio.viernes,
              sabado: servicio.sabado,
              domingo: servicio.domingo,
              incluyeFestivos: servicio.incluyeFestivos,
            })),
          }),
        ]);

        const precioValidado =
          (responsePrecioOrden.status === 200 || responsePrecioOrden.status === 201) &&
          !!responsePrecioOrden.data;

        if (precioValidado && responsePrecioOrden.data) {
          const precioData = responsePrecioOrden.data;
          setPrecioOrdenDetalle(precioData);
          setMensajeRespuesta(precioData.message);
          setValueCreate("precioTotal", precioData.precio || 0);

          // Se guarda tal cual el desglose que devolvio el backend (conserva el idServicio interno de cada
          // fila, usado en los pasos ya recorridos y en la vista previa), es lo que se reenvia al crear la orden.
          // El backend no devuelve de vuelta los dias de la semana seleccionados (no forman parte del desglose
          // de precio), por eso tambien se conservan desde el estado anterior para no perderlos. Se empareja
          // por POSICION (precioData.servicios[i] con prev[i]), no por idTarifa: al permitir varias unidades
          // del mismo servicio puede haber varias filas con el mismo idTarifa, y el backend responde en el
          // mismo orden y con el mismo largo en que se envio el arreglo "servicios" en la peticion
          setConfiguracionServicioTarifa((prev) =>
            precioData.servicios.map((detalle, index) => {
              const original = prev[index];
              return {
                ...detalle,
                idServicio: original?.idServicio,
                lunes: original?.lunes,
                martes: original?.martes,
                miercoles: original?.miercoles,
                jueves: original?.jueves,
                viernes: original?.viernes,
                sabado: original?.sabado,
                domingo: original?.domingo,
                incluyeFestivos: original?.incluyeFestivos,
              };
            }),
          );
        }

        // apiHandler no rechaza las llamadas POST/PATCH/etc que responden con error (ver src/api/config.ts):
        // devuelve un ApiResponse con status 4xx/5xx en vez de lanzar. Por eso "fulfilled" en Promise.allSettled
        // no significa que la validacion haya pasado, hay que revisar el status de cada respuesta resuelta
        const allValidated =
          responseHorarioServicio.every(
            (r) =>
              r.status === "fulfilled" &&
              (r.value.status === 200 || r.value.status === 201),
          ) && precioValidado;

        if (allValidated) {
          toast.success(
            "Horario y precio de la orden de servicio validados correctamente",
          );
          setCurrentStep(7);
        }
      } catch (error) {
        console.log(error);
        toast.error(
          "Error al validar el horario y el precio de la orden de servicio",
        );
      }
      return;
    }

    // if (currentStep === 6) {
    //   let allValidated = true;
    //   let precioTotal = 0;
    //   try {
    //     const responseRangoHorarioValidacion = await Promise.allSettled(
    //       configuracionServicioTarifa.map(async (servicio) => {
    //         return validarRangoHorarioPersonalOrdenServicio({
    //           horaInicio: servicio.horaInicio,
    //           horaFin: servicio.horaFin === "" ? "00:00:00" : servicio.horaFin,
    //           personal: servicio.personal,
    //         });
    //       }),
    //     );

    //     const responsePrecioOrdenServicio = await Promise.allSettled(
    //       configuracionServicioTarifa.map(async (servicio) => {
    //         const response = await getPrecioOrdenServicio({
    //           horaInicio: servicio.horaInicio,
    //           horaFin: servicio.horaFin === "" ? "00:00:00" : servicio.horaFin,
    //           fechaFin: isIndefinite ? null : formOrdenServicio.fechaFin,
    //           fechaInicio: formOrdenServicio.fechaInicio,
    //           idTarifa: servicio.idTarifa || 0,
    //           idServicio: servicio.idServicio || 0,
    //         });

    //         if (response.status === 201) {
    //           servicio.precio = response.data.precio;
    //           precioTotal += response.data.precio;
    //           setMensajeRespuesta(response.data.message);
    //         }
    //         return response;
    //       }),
    //     );

    //     allValidated =
    //       responseRangoHorarioValidacion.every(
    //         (r) => r.status === "fulfilled",
    //       ) &&
    //       responsePrecioOrdenServicio.every((r) => r.status === "fulfilled");
    //   } catch (error) {
    //     console.log(error);
    //   }

    //   if (allValidated) {
    //     setFormOrdenServicio({
    //       ...formOrdenServicio,
    //       precioTotal: precioTotal,
    //     });
    //     toast.success(
    //       "Rango horario personal y precio de orden de servicio validados correctamente",
    //     );
    //     setCurrentStep(7);
    //   }
    //   return;
    // }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleNextEdit = async () => {
    if (currentStep === 1) {
      updateValidateFechasOrdenServicio(
        {
          id: selectedOrderDetail?.idOrdenServicio || 0,
          data: {
            fechaInicio: watchEdit("fechaInicio"),
            fechaFin: isIndefinite ? null : watchEdit("fechaFin"),
            fechaActualizacion: new Date().toISOString(),
          },
        },
        {
          // Ver nota en handleNext: apiHandler resuelve (no rechaza) las respuestas de error de POST, hay que
          // revisar el status antes de calcular el precio y avanzar (si no, una fecha invalida seguiria de
          // largo hasta el precio y podria terminar avanzando de paso igual)
          onSuccess: async (response) => {
            if (response.status !== 200 && response.status !== 201) {
              return;
            }

            try {
              // La edicion solo soporta ordenes de origen "catalogo" (no hay forma de editar el horario unico
              // de una orden "a la medida" desde aqui, servicios va comentado en el update de todas formas)
              // Igual que en la creacion, un solo llamado calcula el precio de todos los servicios de la orden
              const responsePrecioOrden = await getPrecioOrdenServicio({
                origenServicio: OrigenServicioEnum.CATALOGO,
                fechaInicio: watchEdit("fechaInicio"),
                fechaFin: isIndefinite ? null : watchEdit("fechaFin"),
                servicios: configuracionServicioTarifaEdit.map((servicio) => ({
                  idTarifa: servicio.idTarifa || 0,
                  horaInicio: servicio.horaInicio,
                  horaFin: servicio.horaFin === "" ? "00:00:00" : servicio.horaFin,
                })),
              });

              const precioValidado =
                (responsePrecioOrden.status === 200 || responsePrecioOrden.status === 201) &&
                !!responsePrecioOrden.data;

              if (precioValidado && responsePrecioOrden.data) {
                const precioData = responsePrecioOrden.data;
                setPrecioOrdenDetalle(precioData);
                setMensajeRespuesta(precioData.message);
                setValueEdit("precioTotal", precioData.precio || 0);

                // Se hace match por posicion: precioData.servicios respeta el mismo orden en que se enviaron
                // (ya no trae idServicio para matchear por id, ver PrecioServicioOrdenResponse)
                setConfiguracionServicioTarifaEdit((prev) =>
                  prev.map((servicio, index) => {
                    const detalle = precioData.servicios[index];
                    return detalle ? { ...servicio, precio: detalle.precio || 0 } : servicio;
                  }),
                );

                toast.success("Precio de orden de servicio validado correctamente");
                setCurrentStep(2);
              }
            } catch (error) {
              console.log(error);
              toast.error("Error al validar el precio de la orden de servicio");
            }
          },
        },
      );

      return;
    }

    // if (currentStep === 2) {
    //   let allValidated = true;
    //   let precioTotal = 0;
    //   try {
    //     const responseRangoHorarioValidacion = await Promise.allSettled(
    //       configuracionServicioTarifaEdit.map(async (servicio) => {
    //         return validarRangoHorarioPersonalOrdenServicio({
    //           horaInicio: servicio.horaInicio,
    //           horaFin: servicio.horaFin === "" ? "00:00:00" : servicio.horaFin,
    //           personal: servicio.personal,
    //         });
    //       }),
    //     );

    //     const responsePrecioOrdenServicio = await Promise.allSettled(
    //       configuracionServicioTarifaEdit.map(async (servicio) => {
    //         const response = await getPrecioOrdenServicio({
    //           horaInicio: servicio.horaInicio,
    //           horaFin: servicio.horaFin === "" ? "00:00:00" : servicio.horaFin,
    //           fechaFin: isIndefinite ? null : formOrdenServicioEdit.fechaFin,
    //           fechaInicio: formOrdenServicioEdit.fechaInicio,
    //           idTarifa: servicio.idTarifa || 0,
    //           idServicio: servicio.idServicio || 0,
    //         });

    //         if (response.status === 201) {
    //           servicio.precio = response.data.precio;
    //           precioTotal += response.data.precio;
    //           setMensajeRespuesta(response.data.message);
    //         }
    //         return response;
    //       }),
    //     );

    //     allValidated =
    //       responseRangoHorarioValidacion.every(
    //         (r) => r.status === "fulfilled",
    //       ) &&
    //       responsePrecioOrdenServicio.every((r) => r.status === "fulfilled");
    //   } catch (error) {
    //     console.log(error);
    //   }

    //   if (allValidated) {
    //     setFormOrdenServicioEdit({
    //       ...formOrdenServicioEdit,
    //       precioTotal: precioTotal,
    //     });
    //     toast.success(
    //       "Rango horario personal y precio de orden de servicio validados correctamente",
    //     );
    //     setCurrentStep(2);
    //   }
    //   return;
    // }

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveOrder = async () => {
    const data = watchCreate();

    // configuracionServicioTarifa guarda tal cual cada fila que devolvio /obtener-precio (ver handleNext), que
    // trae ademas "message" (y en teoria "costos_horas") e idServicio (uso interno del front, ver
    // CreateOrdenServicioTarifaDto). El backend valida con forbidNonWhitelisted: cualquier propiedad fuera de
    // CreateOrdenServicioDetalleDto revienta la creacion ("property X should not exist"), por eso se arma el
    // objeto explicitamente en vez de solo quitar los campos que no se necesitan
    const servicios: CreateOrdenServicioDetalleDto[] = configuracionServicioTarifa.map((servicio) => ({
      idTarifa: servicio.idTarifa,
      horaInicio: servicio.horaInicio,
      horaFin: servicio.horaFin,
      cantidadHoras: servicio.cantidadHoras,
      fecha: servicio.fecha,
      // Dias de la semana tal cual se seleccionaron en el paso de horarios (solo tienen valor en modo
      // catalogo; en a_medida quedan undefined y el backend los ignora)
      lunes: servicio.lunes,
      martes: servicio.martes,
      miercoles: servicio.miercoles,
      jueves: servicio.jueves,
      viernes: servicio.viernes,
      sabado: servicio.sabado,
      domingo: servicio.domingo,
      incluyeFestivos: servicio.incluyeFestivos,
      costosDirectos: servicio.costosDirectos,
      seguroVida: servicio.seguroVida,
      costosDirectosSeguroVida: servicio.costosDirectosSeguroVida,
      aui: servicio.aui,
      precioAntesIva: servicio.precioAntesIva,
      iva: servicio.iva,
      precio: servicio.precio,
    }));

    // Monitoreo de alarmas siempre envia idCliente. Vigilancia y escolta envia idLocacion O idCliente, segun
    // el modo que el usuario haya elegido en el paso 2 (ver SeleccionarPuestoCliente): nunca ambos, el backend
    // rechaza idLocacion en 0 aunque el campo sea opcional (@IsPositive), por eso no se envia cuando no aplica
    const ordenesDeServicioMutation: CreateOrdenServicioDto = {
      origenServicio: origenServicio || OrigenServicioEnum.CATALOGO,
      numeroOrdenServicio: data.numeroOrdenServicio,
      ...(data.idCliente
        ? { idCliente: data.idCliente }
        : { idLocacion: data.idLocacion || 0 }),
      fechaInicio: data.fechaInicio,
      fechaFin: isIndefinite ? null : data.fechaFin,
      ...(cobroParcial.activo &&
      isIndefinite &&
      origenServicio === OrigenServicioEnum.CATALOGO &&
      cobroParcial.diaInicio != null &&
      cobroParcial.diaFin != null
        ? { diaInicioCobro: cobroParcial.diaInicio, diaFinCobro: cobroParcial.diaFin }
        : {}),
      fechaCreacion: new Date().toISOString(),
      servicios,
    };

    crearOrdenServicio(ordenesDeServicioMutation, {
      // Ver nota en handleNext: apiHandler resuelve (no rechaza) las respuestas de error de POST, hay que
      // revisar el status antes de cerrar el modal (si no, un error del backend al crear cerraria el modal
      // igual y se perderia toda la informacion ya diligenciada)
      onSuccess: (response) => {
        if (response.status === 200 || response.status === 201) {
          handleCloseModal();
        }
      },
    });
  };

  const handleUpdateOrder = async () => {
    const data = watchEdit();

    // El backend ya no acepta precioTotal al actualizar (lo recalcula el mismo a partir del desglose, ver
    // updateOrdenServicio en el backend): enviarlo revienta la validacion (forbidNonWhitelisted -> 400
    // "property precioTotal should not exist"), igual que ya se maneja en handleSaveOrder para la creacion.
    // Si la nueva fecha fin no es null, el backend necesita el horario de cada servicio para recalcular el
    // precio con las nuevas fechas: "servicios" para catalogo (debe traer el mismo idTarifa que ya tiene la
    // orden) y horaInicio/horaFin de nivel superior para a la medida (un unico horario para toda la orden).
    // El horario no se vuelve a editar aca, se reenvia tal cual ya esta guardado en cada fila
    const ordenesDeServicioMutation: UpdateOrdenServicioDto = {
      fechaInicio: data.fechaInicio,
      fechaFin: isIndefinite ? null : data.fechaFin,
      fechaActualizacion: new Date().toISOString(),
      servicios: configuracionServicioTarifaEdit.map((servicio) => ({
        idTarifa: servicio.idTarifa,
        horaInicio: servicio.horaInicio,
        horaFin: servicio.horaFin,
      })),
      // A la medida: cada fila de configuracionServicioTarifaEdit es UN DIA del rango, no el horario completo
      // de la orden (ver calcularPrecioAMedida en el backend) — solo el primer dia trae el horaInicio real de
      // la orden (los demas quedan en "00:00") y solo el ultimo dia trae el horaFin real (los demas quedan en
      // "24:00"/fin de dia). Por eso se ordena por fecha y se toma horaInicio del primero y horaFin del
      // ultimo, en vez de asumir que la fila en la posicion 0 ya trae el horario completo
      ...(() => {
        const filasOrdenadas = [...configuracionServicioTarifaEdit].sort(
          (a, b) => new Date(a.fecha || 0).getTime() - new Date(b.fecha || 0).getTime(),
        );
        return {
          horaInicio: filasOrdenadas[0]?.horaInicio,
          horaFin: filasOrdenadas[filasOrdenadas.length - 1]?.horaFin,
        };
      })(),
    };

    actualizarOrdenServicio(
      {
        id: selectedOrderDetail?.idOrdenServicio || 0,
        data: ordenesDeServicioMutation,
      },
      {
        // Ver nota en handleSaveOrder: apiHandler resuelve (no rechaza) las respuestas de error de POST/PATCH,
        // hay que revisar el status antes de cerrar el modal (si no, un error del backend al actualizar
        // cerraria el modal igual y se perderia la edicion)
        onSuccess: (response) => {
          if (response.status === 200 || response.status === 201) {
            handleCloseModal();
            setIsEditing(false);
          }
        },
      },
    );
  };

  const handleEditOrder = async (idOrdenServicio: number) => {
    const ordenServicioById = await obtenerOrdenServicioById(idOrdenServicio);
    resetEdit({
      ...ordenServicioById?.data,
      fechaInicio: ordenServicioById?.data?.fechaInicio || "",
      fechaFin: ordenServicioById?.data?.fechaFin || null,
      fechaActualizacion: ordenServicioById?.data?.fechaActualizacion || "",
      precioTotal: ordenServicioById?.data?.precioTotal || 0,
      // servicios: [],
    });

    // El backend expone el desglose de la orden como "detalles" (ya no "tarifas"), y cada fila ya no trae
    // cantidadPersonal/personal (ver OrdenServicioDetalle en el backend) — se dejan en blanco solo para
    // cumplir con UpdateOrdenServicioTarifaDto, no se usan ni se envian en la actualizacion. "fecha" solo
    // trae valor en ordenes "a la medida" (cada fila es un dia del rango) y se usa en handleUpdateOrder para
    // reconstruir el horaInicio/horaFin real de la orden (ver ese comentario para el porque)
    setConfiguracionServicioTarifaEdit(
      ordenServicioById?.data?.detalles?.map((detalle) => ({
        idTarifa: detalle.idTarifa?.idTarifa || 0,
        cantidadPersonal: 0,
        horaInicio: detalle.horaInicio,
        horaFin: detalle.horaFin,
        precio: detalle.precio || 0,
        personal: [],
        idServicio: detalle.idTarifa?.idServicio?.idServicio,
        fecha: detalle.fecha,
      })) || [],
    );

    setSelectedServices(
      ordenServicioById?.data?.detalles?.map((detalle) => ({
        ...detalle?.idTarifa?.idServicio,
      })) || [],
    );

    setIsIndefinite(ordenServicioById?.data?.fechaFin === null);
  };

  const handleViewOrder = async (idOrdenServicio: number) => {
    const ordenServicioById = await obtenerOrdenServicioById(idOrdenServicio);
    if (ordenServicioById?.data) {
      setSelectedOrderDetail(ordenServicioById.data);
      setIsOpenDetails(true);
    }
  };

  const handleDownloadPdf = (idOrdenServicio: number) => {
    descargarPdf(idOrdenServicio);
  };

  const handlePrintPdf = async (idOrdenServicio: number) => {
    const { data } = await imprimirPdf(idOrdenServicio);
    if (data) {
      printBase64PDF(data.file);
    }
  };



  // const handleValidarEmpleadosDisponibles = async (
  //   idServicio: number,
  //   indexEmpleado: number,
  // ) => {
  //   const servicio = isEditing
  //     ? configuracionServicioTarifaEdit.find((s) => s.idServicio === idServicio)
  //     : configuracionServicioTarifa.find((s) => s.idServicio === idServicio);

  //   if (!servicio?.personal || !servicio.personal[indexEmpleado]) {
  //     console.warn("Personal data not found for validation");
  //     return;
  //   }

  //   const fechaInicio = isEditing
  //     ? formOrdenServicioEdit.fechaInicio
  //     : formOrdenServicio.fechaInicio;
  //   const fechaFin = isEditing
  //     ? isIndefinite
  //       ? null
  //       : formOrdenServicioEdit.fechaFin
  //     : isIndefinite
  //       ? null
  //       : formOrdenServicio.fechaFin;

  //   await validarEmpleadosDisponibles({
  //     fechaInicio,
  //     fechaFin,
  //     horaInicio: servicio.personal[indexEmpleado].horaInicio || "00:00:00",
  //     horaFin: servicio.personal[indexEmpleado].horaFin || "00:00:00",
  //   });
  // };

  // Agrega una unidad mas del servicio de esta tarifa: selectedServices y configuracionServicioTarifa se
  // mantienen siempre del mismo largo y en el mismo orden (una entrada por cada unidad seleccionada, no una
  // por servicio distinto), asi la fila en configuracionServicioTarifa[i] siempre corresponde al servicio en
  // selectedServices[i] (mismo criterio que ya usa PreviewInformacionOrden para emparejar por posicion)
  const handleIncrementarServicio = (tarifa: Tarifa) => {
    setSelectedServices((prev) => [...prev, tarifa.idServicio]);
    setConfiguracionServicioTarifa((prev) => [
      ...prev,
      {
        idTarifa: tarifa.idTarifa,
        idServicio: tarifa.idServicio.idServicio,
        horaInicio: "",
        horaFin: "",
        precio: 0,
        // Dias de la semana en que se presta el servicio: todos empiezan seleccionados
        // (equivale a "todos los dias"), el usuario los ajusta en ConfigurarHorariosServicios
        lunes: true,
        martes: true,
        miercoles: true,
        jueves: true,
        viernes: true,
        sabado: true,
        domingo: true,
        incluyeFestivos: true,
      },
    ]);
  };

  // Quita la ultima unidad agregada de este servicio (LIFO), tanto de selectedServices como de
  // configuracionServicioTarifa, para conservar el emparejamiento por posicion entre ambos arreglos
  const handleDecrementarServicio = (tarifa: Tarifa) => {
    let ultimoIndice = -1;
    for (let i = selectedServices.length - 1; i >= 0; i--) {
      if (selectedServices[i].idServicio === tarifa.idServicio.idServicio) {
        ultimoIndice = i;
        break;
      }
    }
    if (ultimoIndice === -1) return;

    setSelectedServices((prev) => prev.filter((_, i) => i !== ultimoIndice));
    setConfiguracionServicioTarifa((prev) =>
      prev.filter((_, i) => i !== ultimoIndice),
    );
  };

  // Ajusta la cantidad de unidades de este servicio al valor que el usuario escribio directamente
  // en el input, agregando o quitando unidades hasta alcanzarlo (misma logica de emparejamiento por
  // posicion entre selectedServices y configuracionServicioTarifa que handleIncrementar/DecrementarServicio)
  const handleSetCantidadServicio = (tarifa: Tarifa, cantidad: number) => {
    const cantidadObjetivo = Number.isFinite(cantidad)
      ? Math.max(0, Math.floor(cantidad))
      : 0;
    const cantidadActual = selectedServices.filter(
      (s) => s.idServicio === tarifa.idServicio.idServicio,
    ).length;
    const diferencia = cantidadObjetivo - cantidadActual;

    if (diferencia > 0) {
      setSelectedServices((prev) => [
        ...prev,
        ...Array(diferencia).fill(tarifa.idServicio),
      ]);
      setConfiguracionServicioTarifa((prev) => [
        ...prev,
        ...Array.from({ length: diferencia }, () => ({
          idTarifa: tarifa.idTarifa,
          idServicio: tarifa.idServicio.idServicio,
          horaInicio: "",
          horaFin: "",
          precio: 0,
          lunes: true,
          martes: true,
          miercoles: true,
          jueves: true,
          viernes: true,
          sabado: true,
          domingo: true,
          incluyeFestivos: true,
        })),
      ]);
    } else if (diferencia < 0) {
      let restantesPorQuitar = -diferencia;
      const indicesAQuitar = new Set<number>();
      for (
        let i = selectedServices.length - 1;
        i >= 0 && restantesPorQuitar > 0;
        i--
      ) {
        if (selectedServices[i].idServicio === tarifa.idServicio.idServicio) {
          indicesAQuitar.add(i);
          restantesPorQuitar--;
        }
      }
      setSelectedServices((prev) =>
        prev.filter((_, i) => !indicesAQuitar.has(i)),
      );
      setConfiguracionServicioTarifa((prev) =>
        prev.filter((_, i) => !indicesAQuitar.has(i)),
      );
    }
  };

  const columns: ColumnDef<OrdenServicio>[] = [
    {
      accessorKey: "numeroOrdenServicio",
      header: "Id. Orden de Servicio",
      // El chevron despliega/oculta el resumen de servicios de esta fila (ver renderExpandedRow en <Table>)
      cell: ({ row }) => (
        <Button
          size="small"
          color="inherit"
          onClick={row.getToggleExpandedHandler()}
          title={row.getIsExpanded() ? "Ocultar servicios" : "Ver servicios"}
          startIcon={
            <ChevronRightIcon
              sx={{
                color: "text.secondary",
                transition: "transform .2s",
                transform: row.getIsExpanded() ? "rotate(90deg)" : "none",
              }}
            />
          }
          sx={{ fontWeight: 500 }}
        >
          {row.original.ordenServicioId.descripcionId}
        </Button>
      ),
    },
    {
      header: "cliente",
      accessorKey: "idLocacion.idCliente.nombre",
      // Vigilancia y escolta: cliente del puesto. Monitoreo de alarmas: cliente asignado directo a la orden
      // (idLocacion es null en ese caso, ver esOrdenMonitoreo)
      cell: ({ row }) => (
        <span className="whitespace-nowrap capitalize">
          {row.original.idLocacion?.idCliente.nombre ||
            row.original.idCliente?.nombre ||
            "No especificado"}
        </span>
      ),
    },
    {
      accessorKey: "idLocacion",
      header: "Puesto",
      cell: ({ row }) => (
        <span className="flex flex-col gap-1 whitespace-nowrap capitalize">
          {row.original.idLocacion?.nombre ||
            (row.original.idCliente ? "N/A" : "No especificado")}
          <Typography variant="caption" color="text.secondary">
            {row.original.idLocacion?.direccion}
          </Typography>
        </span>
      ),
    },
    {
      accessorKey: "fechas",
      header: "Fechas",
      cell: ({ row }) => (
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
          Inicio: {row.original.fechaInicio} - Fin:{" "}
          {row.original.fechaFin || "Indefinida"}
        </Typography>
      ),
    },
    {
      accessorKey: "precioTotal",
      header: "Precio Total",
      cell: ({ row }) => (
        <Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: "nowrap", color: "success.main" }}>
          {priceFormat(Number(row.original.precioTotal))}
        </Typography>
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
      cell: ({ row }) => (
        <MoreActionsButton
          menuId={`actions-${row.original.idOrdenServicio}`}
          actions={[
            {
              label: "Editar",
              onClick: () => {
                setIsEditing(true);
                setSelectedOrderDetail(row.original);
                handleEditOrder(row.original.idOrdenServicio);
              },
            },
            {
              label: "Ver",
              onClick: () => {
                handleViewOrder(row.original.idOrdenServicio);
              },
            },
            {
              label: "Observaciones",
              onClick: () => {
                setIsOpenObservaciones(true);
                setSelectedOrderDetail(row.original);
                setSelectedOrderIdForObservaciones(
                  row.original.idOrdenServicio,
                );
              },
            },
            {
              label: "Descargar PDF",
              onClick: () => {
                handleDownloadPdf(row.original.idOrdenServicio);
              },
            },
            {
              label: "Enviar por correo",
              onClick: () => {
                setIsOpenEmail(true);
                setSelectedOrderDetail(row.original);
              },
            },
            {
              label: "Imprimir PDF",
              onClick: () => {
                handlePrintPdf(row.original.idOrdenServicio);
              },
            },
            {
              label: "Anular",
              onClick: () => {
                setSelectedOrderDetail(row.original);
                setConfirmConfig({
                  text: "¿Estás seguro de querer anular esta orden de servicio?",
                  actionLabel: "Anular Orden",
                  action: () => {
                    anularOrdenServicio(row.original.idOrdenServicio, {
                      onSuccess: () => {
                        setIsOpenDelete(false);
                        setSelectedOrderDetail(null);
                      },
                    });
                  },
                });
                setIsOpenDelete(true);
              },
              color: "yellow" as const,
            },
            {
              label: "Eliminar",
              onClick: () => {
                setSelectedOrderDetail(row.original);
                setConfirmConfig({
                  text: "¿Estás seguro de querer eliminar esta orden de servicio? Esta acción no se puede deshacer.",
                  actionLabel: "Eliminar",
                  action: () => {
                    deleteOrdenServicio(row.original.idOrdenServicio, {
                      onSuccess: () => {
                        setIsOpenDelete(false);
                        setSelectedOrderDetail(null);
                      },
                    });
                  },
                });
                setIsOpenDelete(true);
              },
              color: "red" as const,
            },
          ]}
        />
      ),
    },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <SeleccionarIdentificadorOrden
            identificador={identificador}
            setIdentificador={setIdentificador}
            nextIdOrdenServicio={nextIdOrdenServicioQuery?.data || 0}
          />
        );

      case 2:
        return (
          <SeleccionarPuestoCliente
            idLocacion={watchCreate("idLocacion") || 0}
            idCliente={watchCreate("idCliente") || 0}
            setValue={setValueCreate}
            setSelectedPuesto={setSelectedPuesto}
            setSelectedCliente={setSelectedCliente}
            tipoServicioNombre={tipoServicioSeleccionado?.nombre}
          />
        );

      case 3:
        return (
          <ConfigurarFechaOrdenServicio
            register={registerCreate}
            setValue={setValueCreate}
            isIndefinite={isIndefinite}
            setIsIndefinite={setIsIndefinite}
            cobroParcial={cobroParcial}
            setCobroParcial={setCobroParcial}
          />
        );

      case 4:
        return (
          <SeleccionarOrigenServicio
            tipoServicioNombre={tipoServicioSeleccionado?.nombre}
            origenServicio={origenServicio}
            setOrigenServicio={setOrigenServicio}
          />
        );

      // A LA MEDIDA: unico horario para toda la orden, no hay paso de seleccionar servicios
      // CATALOGO: seleccionar uno o varios servicios del catalogo del periodo activo
      case 5:
        return origenServicio === OrigenServicioEnum.A_MEDIDA ? (
          <ConfigurarHorarioAMedida
            horarioAMedida={horarioAMedida}
            setHorarioAMedida={setHorarioAMedida}
          />
        ) : (
          <SeleccionarServicio
            selectedServices={selectedServices}
            tarifasPeriodoActivoByIdTipoServicioData={
              tarifasPeriodoActivoByIdTipoServicioData?.data?.data || []
            }
            tipoServiciosQuery={tipoServiciosQuery?.data?.data || []}
            handleIncrementarServicio={handleIncrementarServicio}
            handleDecrementarServicio={handleDecrementarServicio}
            handleSetCantidadServicio={handleSetCantidadServicio}
          />
        );

      // case 6: // Asignacion de personal
      //   return (
      //     <AsignacionPersonalServicio
      //       selectedServices={selectedServices}
      //       configuracionServicioTarifa={configuracionServicioTarifa}
      //       setConfiguracionServicioTarifa={setConfiguracionServicioTarifa}
      //       handleValidarEmpleadosDisponibles={
      //         handleValidarEmpleadosDisponibles
      //       }
      //       validarEmpleadosDisponiblesData={
      //         validarEmpleadosDisponiblesData?.data || []
      //       }
      //       isValidarEmpleadosDisponiblesPending={
      //         isValidarEmpleadosDisponiblesPending
      //       }
      //     />
      //   );

      // A LA MEDIDA: el paso 5 ya calculo el precio, aqui va directo a la vista previa (ultimo paso)
      // CATALOGO: configurar horarios por servicio (aqui se calcula el precio, ver handleNext)
      case 6:
        return origenServicio === OrigenServicioEnum.A_MEDIDA ? (
          <PreviewInformacionOrden
            selectedPuesto={selectedPuesto}
            selectedCliente={selectedCliente}
            formOrdenServicio={watchCreate()}
            configuracionServicioTarifa={configuracionServicioTarifa}
            selectedServices={selectedServices}
            mensajeRespuesta={mensajeRespuesta}
            isIndefinite={isIndefinite}
            precioOrdenDetalle={precioOrdenDetalle}
            cobroParcial={cobroParcial}
          />
        ) : (
          <ConfigurarHorariosServicios
            selectedServices={selectedServices}
            configuracionServicioTarifa={configuracionServicioTarifa}
            setConfiguracionServicioTarifa={setConfiguracionServicioTarifa}
          />
        );

      // CATALOGO unicamente: vista previa (para A LA MEDIDA la vista previa ya es el paso 6)
      case 7:
        return (
          <PreviewInformacionOrden
            selectedPuesto={selectedPuesto}
            selectedCliente={selectedCliente}
            formOrdenServicio={watchCreate()}
            configuracionServicioTarifa={configuracionServicioTarifa}
            selectedServices={selectedServices}
            mensajeRespuesta={mensajeRespuesta}
            isIndefinite={isIndefinite}
            precioOrdenDetalle={precioOrdenDetalle}
            cobroParcial={cobroParcial}
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
            register={registerEdit}
            setValue={setValueEdit}
            isIndefinite={isIndefinite}
            setIsIndefinite={setIsIndefinite}
          />
        );

      // case 2:
      //   return (
      //     <AsignacionPersonalServicio
      //       selectedServices={selectedServices}
      //       configuracionServicioTarifa={configuracionServicioTarifaEdit}
      //       setConfiguracionServicioTarifa={(configuracionServicioTarifa) =>
      //         setConfiguracionServicioTarifaEdit(
      //           configuracionServicioTarifa as UpdateOrdenServicioTarifaDtoInternal[],
      //         )
      //       }
      //       handleValidarEmpleadosDisponibles={
      //         handleValidarEmpleadosDisponibles
      //       }
      //       isValidarEmpleadosDisponiblesPending={
      //         isValidarEmpleadosDisponiblesPending
      //       }
      //       validarEmpleadosDisponiblesData={
      //         validarEmpleadosDisponiblesData?.data || []
      //       }
      //     />
      //   );

      case 2: // antes paso 3
        return (
          <PreviewInformacionOrden
            isEditing={isEditing}
            selectedPuesto={selectedOrderDetail?.idLocacion || null}
            selectedCliente={selectedOrderDetail?.idCliente || null}
            formOrdenServicio={watchEdit()}
            configuracionServicioTarifa={configuracionServicioTarifaEdit}
            selectedServices={selectedServices}
            mensajeRespuesta={mensajeRespuesta}
            isIndefinite={isIndefinite}
            precioOrdenDetalle={precioOrdenDetalle}
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
            Icon={AddIcon}
            label="Agregar orden de servicio"
            onClick={() => {
              setIsOpenAdd(true);
            }}
          />
        </div>
        <Table
          columns={columns}
          data={filteredOrdenesServicio ?? ordenesDeServicioQuery?.data?.data ?? []}
          getRowId={(orden) => String(orden.idOrdenServicio)}
          renderExpandedRow={(orden) => <ServiciosOrdenResumen orden={orden} />}
          serverPagination={!filteredOrdenesServicio}
          totalRows={filteredOrdenesServicio ? filteredOrdenesServicio.length : (ordenesDeServicioQuery?.data?.pagination?.total ?? 0)}
          currentPage={page}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(0);
          }}
          pageSize={pageSize}
          enableFiltering={true}
          enablePagination={true}
          filterColumns={[
            { label: "Número de orden", value: OrdenServicioFilterColumn.NUMERO_ORDEN },
            { label: "Locación", value: OrdenServicioFilterColumn.LOCACION },
            { label: "Cliente", value: OrdenServicioFilterColumn.CLIENTE },
            { label: "Estado", value: OrdenServicioFilterColumn.ESTADO },
          ] satisfies ServerFilterColumn[]}
          onServerFilter={(column, query) => {
            filterOrdenesServicio(
              { column: column as OrdenServicioFilterColumn, query, pagination: false },
              {
                onSuccess: (data) => {
                  setFilteredOrdenesServicio(data.data?.data ?? []);
                },
              },
            );
          }}
          onServerFilterClear={() => setFilteredOrdenesServicio(null)}
          serverFilterLoading={isFilteringOrdenesServicio}
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
          <WizardStepper currentStep={currentStep} totalSteps={totalSteps} />

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto px-2 py-4">
            {renderStepContent()}
          </div>

          <WizardFooter
            currentStep={currentStep}
            totalSteps={totalSteps}
            onCancel={handleCloseModal}
            onPrevious={handlePrevious}
            onNext={currentStep < totalSteps ? handleNext : handleSaveOrder}
            nextDisabled={
              isValidateFechasOrdenServicioPending ||
              isGetPrecioOrdenPending ||
              isCrearOrdenServicioPending ||
              isValidarIdOrdenServicioPending ||
              isValidarRangoHorarioPersonalOrdenServicioPending ||
              isValidarHorarioServicioOrdenServicioPending ||
              (currentStep === 1 &&
                (identificador.codigoTipoServicio === 0 ||
                  identificador.codigo === 0)) ||
              (currentStep === 2 &&
                !watchCreate("idCliente") &&
                !watchCreate("idLocacion")) ||
              (currentStep === 3 && !watchCreate("fechaInicio")) ||
              (currentStep === 3 &&
                cobroParcial.activo &&
                (cobroParcial.diaInicio == null || cobroParcial.diaFin == null)) ||
              (currentStep === 4 && !origenServicio) ||
              (currentStep === 5 &&
                origenServicio === OrigenServicioEnum.CATALOGO &&
                configuracionServicioTarifa.length === 0) ||
              (currentStep === 5 &&
                origenServicio === OrigenServicioEnum.A_MEDIDA &&
                (horarioAMedida.horaInicio === "" ||
                  horarioAMedida.horaFin === ""))
              // TODO: Revisar validaciones de los pasos
            }
            loading={isCrearOrdenServicioPending}
            finalLabel="Crear Orden"
            loadingLabel="Creando..."
          />
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
          <WizardStepper currentStep={currentStep} totalSteps={2} />

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto px-2 py-4">
            {renderStepEditContent()}
          </div>

          <WizardFooter
            currentStep={currentStep}
            totalSteps={2}
            onCancel={handleCloseModal}
            onPrevious={handlePrevious}
            onNext={currentStep < 2 ? handleNextEdit : handleUpdateOrder}
            nextDisabled={
              isValidateFechasOrdenServicioPending || isGetPrecioOrdenPending
            }
            loading={isActualizarOrdenServicioPending}
            finalLabel="Actualizar Orden"
            loadingLabel="Actualizando..."
          />
        </>
      </SimpleModal>

      <OrdenDetalles
        isOpenDetails={isOpenDetails}
        setIsOpenDetails={setIsOpenDetails}
        selectedOrderDetail={selectedOrderDetail || ({} as OrdenServicio)}
        setSelectedOrderDetail={setSelectedOrderDetail}
      />

      <EnvioCorreos
        isOpen={isOpenEmail}
        setIsOpen={setIsOpenEmail}
        id={selectedOrderDetail?.idOrdenServicio || 0}
        mutationEmail={enviarPdfPorCorreo}
        envioCorreoPending={enviarCorreoPending}
      />

      <ObservacionesOrdenServicio
        isOpenObservaciones={isOpenObservaciones}
        setIsOpenObservaciones={(isOpen) => {
          setIsOpenObservaciones(isOpen);
          if (!isOpen) {
            setSelectedOrderIdForObservaciones(null);
          }
        }}
        selectedOrderDetail={selectedOrderDetail || ({} as OrdenServicio)}
        setSelectedOrderDetail={setSelectedOrderDetail}
        observacionesQueryData={observacionesQueryData?.data?.data || []}
      />

      <ConfirmarDelete
        isOpenDelete={isOpenDelete}
        text={confirmConfig.text}
        onDelete={confirmConfig.action}
        actionLabel={confirmConfig.actionLabel}
        onClose={() => setIsOpenDelete(false)}
      />
    </Section>
  );
}
