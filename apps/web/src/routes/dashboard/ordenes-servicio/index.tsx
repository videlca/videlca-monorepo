import { createFileRoute } from "@tanstack/react-router";
import { Section } from "../../../components/ui/dashboard/Section";
import type { ColumnDef } from "@tanstack/react-table";
import { ButtonAction } from "../../../components/common/ButtonAction";
import { Check, PlusIcon } from "lucide-react";
import Table from "../../../components/common/Table";
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
  type UpdateOrdenServicioDto,
  type UpdateOrdenServicioTarifaDto,
  OrdenServicioFilterColumn,
} from "../../../api/dtos";
import type { OrdenServicio } from "../../../api/types/orden-servicio";
import { useTipoServiciosActivo } from "../../../api/queryFunctions/servicios";
import { useTarifasPeriodoActivoByIdTipoServicio } from "../../../api/queryFunctions/tarifas";
import { priceFormat } from "../../../utils/PriceFormat";
import { timeFormat } from "../../../utils/TimeFormat";
import { dateFormat } from "../../../utils/DateFormat";

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
  const [selectedServices, setSelectedServices] = useState<Servicio[]>([]);

  const [mensajeRespuesta, setMensajeRespuesta] = useState<string>("");

  const [isIndefinite, setIsIndefinite] = useState(false);

  const { mutate: filterOrdenesServicio, isPending: isFilteringOrdenesServicio } = useFilterOrdenesServicio();
  const [filteredOrdenesServicio, setFilteredOrdenesServicio] = useState<OrdenServicio[] | null>(null);
  const [ordenServicioEditData, setOrdenServicioEditData] =
    useState<OrdenServicio | null>(null);

  // Paginación server-side
  const { page, setPage, pageSize, setPageSize, paginationParams } = useServerPagination(5);

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

  const handleCloseModal = () => {
    setIsOpenAdd(false);
    setIsEditing(false);
    setCurrentStep(1);
    setSelectedPuesto(null);
    setConfiguracionServicioTarifa([]);
    setSelectedServices([]);
    setIsIndefinite(false);
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
          onSuccess: () => {
            setCurrentStep(2);
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

      validateFechasOrdenServicio(
        {
          fechaInicio: dateFormat(new Date(watchCreate("fechaInicio"))),
          fechaFin: isIndefinite
            ? null
            : dateFormat(new Date(watchCreate("fechaFin") || "")),
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
      let precioTotal = 0;
      let allValidated = true;
      const campoHorario = configuracionServicioTarifa.some(
        (service) => service.horaInicio === "" && service.horaFin === "",
      );
      if (campoHorario) {
        toast.error("Los campos de hora son requeridos");
        return;
      }

      // Va a recorrer todos los servicios seleccionados y va a utilizar el endpoint de

      try {
        const responseHorarioServicio = await Promise.allSettled(
          configuracionServicioTarifa.map(async (servicio) => {
            return validarHorarioServicioOrdenServicio({
              idTarifa: servicio.idTarifa || 0,
              idServicio: servicio.idServicio || 0,
              horaInicio: timeFormat(servicio.horaInicio),
              horaFin:
                servicio.horaFin === ""
                  ? "00:00:00"
                  : timeFormat(servicio.horaFin),
            });
          }),
        );

        const responsePrecioOrdenServicio = await Promise.allSettled(
          configuracionServicioTarifa.map(async (servicio) => {
            const response = await getPrecioOrdenServicio({
              horaInicio: servicio.horaInicio,
              horaFin: servicio.horaFin === "" ? "00:00:00" : servicio.horaFin,
              fechaFin: isIndefinite ? null : watchCreate("fechaFin"),
              fechaInicio: watchCreate("fechaInicio"),
              idTarifa: servicio.idTarifa || 0,
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
          responseHorarioServicio.every((r) => r.status === "fulfilled") &&
          responsePrecioOrdenServicio.every((r) => r.status === "fulfilled");

        if (allValidated) {
          setValueCreate("precioTotal", precioTotal);
          toast.success(
            "Rango horario personal y precio de orden de servicio validados correctamente",
          );
          setCurrentStep(6);
        }
      } catch (error) {
        console.log(error);
        toast.error(
          "Error al validar el rango horario personal y el precio de la orden de servicio",
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

    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleNextEdit = async () => {
    if (currentStep === 1) {
      let precioTotal = 0;

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
          onSuccess: async () => {
            try {
              const responsePrecioOrdenServicio = await Promise.allSettled(
                configuracionServicioTarifaEdit.map(async (servicio) => {
                  const response = await getPrecioOrdenServicio({
                    horaInicio: servicio.horaInicio,
                    horaFin: servicio.horaFin === "" ? "00:00:00" : servicio.horaFin,
                    fechaFin: isIndefinite ? null : watchEdit("fechaFin"),
                    fechaInicio: watchEdit("fechaInicio"),
                    idTarifa: servicio.idTarifa || 0,
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

              const allValidated = responsePrecioOrdenServicio.every(
                (r) => r.status === "fulfilled",
              );

              if (allValidated) {
                setValueEdit("precioTotal", precioTotal);
                toast.success("Precio de orden de servicio validados correctamente");
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
    const ordenesDeServicioMutation: CreateOrdenServicioDto = {
      numeroOrdenServicio: data.numeroOrdenServicio,
      idLocacion: data.idLocacion || 0,
      fechaInicio: data.fechaInicio,
      fechaFin: isIndefinite ? null : data.fechaFin,
      precioTotal: data.precioTotal,
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

    const data = watchEdit();
    const ordenesDeServicioMutation: UpdateOrdenServicioDto = {
      fechaInicio: data.fechaInicio,
      fechaFin: isIndefinite ? null : data.fechaFin,
      precioTotal: data.precioTotal,
      fechaActualizacion: new Date().toISOString(),
      // servicios: cleanedServicios,
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
    resetEdit({
      ...ordenServicioById?.data,
      fechaInicio: ordenServicioById?.data?.fechaInicio || "",
      fechaFin: ordenServicioById?.data?.fechaFin || null,
      fechaActualizacion: ordenServicioById?.data?.fechaActualizacion || "",
      precioTotal: ordenServicioById?.data?.precioTotal || 0,
      // servicios: [],
    });

    setConfiguracionServicioTarifaEdit(
      ordenServicioById?.data?.tarifas.map((servicio) => ({
        idTarifa: servicio.idTarifa.idTarifa,
        cantidadPersonal: servicio.cantidadPersonal,
        horaInicio: servicio.horaInicio,
        horaFin: servicio.horaFin,
        precio: servicio.precio || 0,
        personal: [],
        idServicio: servicio.idTarifa.idServicio.idServicio,
      })) || [],
    );

    setSelectedServices(
      ordenServicioById?.data?.tarifas.map((servicio) => ({
        ...servicio.idTarifa.idServicio,
      })) || [],
    );

    setIsIndefinite(ordenServicioById?.data?.fechaFin === null);
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

  const handleSelectedServices = (servicio: Servicio) => {
    if (!selectedServices.includes(servicio)) {
      setSelectedServices((prev) => [...prev, servicio]);
    } else {
      setSelectedServices((prev) => prev.filter((s) => s !== servicio));
    }
  };

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
                setIsOpenDetails(true);
                setSelectedOrderDetail(row.original);
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
            idLocacion={watchCreate("idLocacion")}
            setValue={setValueCreate}
            setSelectedPuesto={setSelectedPuesto}
          />
        );

      case 3:
        return (
          <ConfigurarFechaOrdenServicio
            register={registerCreate}
            setValue={setValueCreate}
            isIndefinite={isIndefinite}
            setIsIndefinite={setIsIndefinite}
          />
        );

      case 4:
        return (
          <SeleccionarServicio
            selectedServices={selectedServices}
            tarifasPeriodoActivoByIdTipoServicioData={
              tarifasPeriodoActivoByIdTipoServicioData?.data?.data || []
            }
            tipoServiciosQuery={tipoServiciosQuery?.data?.data || []}
            handleSelectedServices={handleSelectedServices}
            setConfiguracionServicioTarifa={setConfiguracionServicioTarifa}
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
      case 6: { // antes paso 7
        const tarifasDetalleCreate = configuracionServicioTarifa
          .map((config) =>
            (tarifasPeriodoActivoByIdTipoServicioData?.data?.data ?? []).find(
              (t) => t.idTarifa === config.idTarifa,
            ),
          )
          .filter((t) => t !== undefined);

        return (
          <PreviewInformacionOrden
            selectedPuesto={selectedPuesto}
            formOrdenServicio={watchCreate()}
            configuracionServicioTarifa={configuracionServicioTarifa}
            mensajeRespuesta={mensajeRespuesta}
            isIndefinite={isIndefinite}
            // @ts-ignore
            tarifasDetalle={tarifasDetalleCreate}
          />
        );
      }

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

      case 2: { // antes paso 3
        const tarifasDetalleEdit = configuracionServicioTarifaEdit
          .map((config) =>
            selectedOrderDetail?.tarifas?.find(
              (t) => t.idTarifa.idTarifa === config.idTarifa,
            )?.idTarifa,
          )
          .filter((t) => t !== undefined);

        return (
          <PreviewInformacionOrden
            isEditing={isEditing}
            selectedPuesto={selectedOrderDetail?.idLocacion || null}
            formOrdenServicio={watchEdit()}
            configuracionServicioTarifa={configuracionServicioTarifaEdit}
            mensajeRespuesta={mensajeRespuesta}
            isIndefinite={isIndefinite}
            // @ts-ignore
            tarifasDetalle={tarifasDetalleEdit}
          />
        );
      }

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
          data={filteredOrdenesServicio ?? ordenesDeServicioQuery?.data?.data ?? []}
          serverPagination={true}
          totalRows={ordenesDeServicioQuery?.data?.pagination?.total ?? 0}
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
          {/* Step Indicator */}
          <div className="flex items-center justify-center px-6 py-6">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${step < currentStep
                    ? "bg-green-500 text-white"
                    : step === currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                    }`}
                >
                  {step < currentStep ? <Check className="h-4 w-4" /> : step}
                </div>
                {step < 6 && (
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
              Paso {currentStep} de {6}
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
                onClick={currentStep < 6 ? handleNext : handleSaveOrder}
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
                  (currentStep === 2 && !watchCreate("idLocacion")) ||
                  (currentStep === 3 && !watchCreate("fechaInicio")) ||
                  (currentStep === 4 &&
                    configuracionServicioTarifa.length === 0)
                  // TODO: Revisar validaciones de los pasos
                }
                className={`inline-flex cursor-pointer items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${currentStep < 6
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-green-600 hover:bg-green-700"
                  } ${isCrearOrdenServicioPending ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {isCrearOrdenServicioPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Creando...
                  </div>
                ) : currentStep < 6 ? (
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
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${step < currentStep
                    ? "bg-green-500 text-white"
                    : step === currentStep
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                    }`}
                >
                  {step < currentStep ? <Check className="h-4 w-4" /> : step}
                </div>
                {step < 2 && (
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
              Paso {currentStep} de {2}
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
                onClick={currentStep < 2 ? handleNextEdit : handleUpdateOrder}
                disabled={
                  isValidateFechasOrdenServicioPending ||
                  isGetPrecioOrdenPending
                }
                className={`inline-flex cursor-pointer items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${currentStep < 2
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-green-600 hover:bg-green-700"
                  } ${isActualizarOrdenServicioPending ? "cursor-not-allowed opacity-50" : ""}`}
              >
                {isActualizarOrdenServicioPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Actualizando...
                  </div>
                ) : currentStep < 2 ? (
                  "Siguiente"
                ) : (
                  "Actualizar Orden"
                )}
              </button>
            </div>
          </div>
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
