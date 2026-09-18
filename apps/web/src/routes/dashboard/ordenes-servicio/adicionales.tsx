import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { format, getYear } from "date-fns";
import { es } from "date-fns/locale";
import type { ColumnDef } from "@tanstack/react-table";
import { Check, PlusIcon } from "lucide-react";

import { Section } from "../../../components/ui/dashboard/Section";
import { ButtonAction } from "../../../components/common/ButtonAction";
import Table from "../../../components/common/Table";
import { SimpleModal } from "../../../components/common/SimpleModal";
import { FormsModal } from "../../../components/ui/modals/FormsModal";
import { ConfirmarDelete } from "../../../components/ui/modals/ConfirmarDelete";
import { MoreActionsButton } from "../../../components/ui/common/MoreActionsButton";

import { NombreAdicional } from "../../../components/common/stepsAdicionales/NombreAdicional";
import { SeleccionarClienteAdicional } from "../../../components/common/stepsAdicionales/SeleccionarClienteAdicional";
import {
  VigenciaAdicional,
  type VigenciaState,
} from "../../../components/common/stepsAdicionales/VigenciaAdicional";
import {
  PreciosAdicional,
  type CampoCalculadoAdicional,
} from "../../../components/common/stepsAdicionales/PreciosAdicional";

import { useServerPagination } from "../../../hooks/useServerPagination";
import {
  useAdicionales,
  useCreateAdicional,
  useUpdateAdicional,
  useCancelarAdicional,
  useDeleteAdicional,
} from "../../../api/queryFunctions/adicionales";
import type { Adicional } from "../../../api/types/adicionales";
import type { CreateAdicionalDto, UpdateAdicionalDto } from "../../../api/dtos";
import type { Cliente } from "../../../types";
import { priceFormat } from "../../../utils/PriceFormat";
import { safeParseDate } from "../../../utils/DateUtils";
import { calcularTotalesAdicional } from "../../../utils/calcularTotalesAdicional";

export const Route = createFileRoute("/dashboard/ordenes-servicio/adicionales")({
  component: RouteComponent,
});

const totalSteps = 4;

const currentYear = getYear(new Date());
const currentMonth = new Date().getMonth() + 1;
const defaultVigencia: VigenciaState = {
  anoInicio: currentYear,
  mesInicio: currentMonth,
  anoFin: currentYear,
  mesFin: currentMonth,
};

const formatMes = (fecha: string) =>
  format(safeParseDate(fecha), "MMMM yyyy", { locale: es });

function RouteComponent() {
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [isOpenCancelar, setIsOpenCancelar] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [selectedAdicional, setSelectedAdicional] = useState<Adicional | null>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [vigencia, setVigencia] = useState<VigenciaState>(defaultVigencia);
  const [isIndefinido, setIsIndefinido] = useState(true);
  const [camposManualesCreate, setCamposManualesCreate] = useState<Set<CampoCalculadoAdicional>>(
    new Set(),
  );
  const [camposManualesEdit, setCamposManualesEdit] = useState<Set<CampoCalculadoAdicional>>(
    new Set(),
  );

  const {
    register: registerCreate,
    reset: resetCreate,
    setValue: setValueCreate,
    watch: watchCreate,
    getValues: getValuesCreate,
  } = useForm<CreateAdicionalDto>({
    defaultValues: {
      nombre: "",
      idCliente: 0,
      mesInicio: "",
      mesFin: null,
      costosDirectos: 0,
      seguroVida: 0,
      aui: 0,
      costosDirectosSeguroVida: 0,
      precioAntesIva: 0,
      iva: 0,
      precioTotal: 0,
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    watch: watchEdit,
  } = useForm<UpdateAdicionalDto>({
    defaultValues: {
      nombre: "",
      mesInicio: "",
      mesFin: null,
      costosDirectos: 0,
      seguroVida: 0,
      aui: 0,
      costosDirectosSeguroVida: 0,
      precioAntesIva: 0,
      iva: 0,
      precioTotal: 0,
    },
  });

  const toggleManualCreate = (campo: CampoCalculadoAdicional, manual: boolean) => {
    setCamposManualesCreate((prev) => {
      const next = new Set(prev);
      if (manual) next.add(campo);
      else next.delete(campo);
      return next;
    });
  };

  const toggleManualEdit = (campo: CampoCalculadoAdicional, manual: boolean) => {
    setCamposManualesEdit((prev) => {
      const next = new Set(prev);
      if (manual) next.add(campo);
      else next.delete(campo);
      return next;
    });
  };

  const { page, pageSize, paginationParams, handlePageChange, handlePageSizeChange } =
    useServerPagination(10);

  const { data: adicionalesQuery, isLoading: isLoadingAdicionales } =
    useAdicionales(paginationParams);
  const { mutate: crearAdicional, isPending: isCreatingAdicional } = useCreateAdicional();
  const { mutate: actualizarAdicional, isPending: isUpdatingAdicional } = useUpdateAdicional();
  const { mutate: cancelarAdicionalMutate } = useCancelarAdicional();
  const { mutate: eliminarAdicional } = useDeleteAdicional();

  const handleOpenAdd = () => {
    setCurrentStep(1);
    setSelectedCliente(null);
    setVigencia(defaultVigencia);
    setIsIndefinido(true);
    setCamposManualesCreate(new Set());
    resetCreate();
    setIsOpenAdd(true);
  };

  const handleCloseAdd = () => setIsOpenAdd(false);

  const handlePrevious = () => setCurrentStep((prev) => prev - 1);

  const handleNext = () => {
    const values = getValuesCreate();

    if (currentStep === 1 && !values.nombre?.trim()) {
      toast.error("El nombre del adicional es requerido");
      return;
    }

    if (currentStep === 2 && !values.idCliente) {
      toast.error("Debe seleccionar un cliente");
      return;
    }

    if (
      currentStep === 3 &&
      !isIndefinido &&
      vigencia.anoFin * 12 + vigencia.mesFin < vigencia.anoInicio * 12 + vigencia.mesInicio
    ) {
      toast.error("El mes de fin debe ser posterior o igual al mes de inicio");
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handleCreateAdicional = () => {
    const values = getValuesCreate();
    const costosDirectos = Number.isNaN(values.costosDirectos as number)
      ? 0
      : Number(values.costosDirectos ?? 0);
    const seguroVida = Number.isNaN(values.seguroVida as number)
      ? 0
      : Number(values.seguroVida ?? 0);
    const aui = Number.isNaN(values.aui as number) ? 0 : Number(values.aui ?? 0);

    if (costosDirectos < 0 || seguroVida < 0 || aui < 0) {
      toast.error("Los valores de precio no pueden ser negativos");
      return;
    }

    crearAdicional(
      {
        nombre: values.nombre,
        idCliente: values.idCliente,
        mesInicio: values.mesInicio,
        mesFin: isIndefinido ? null : values.mesFin,
        costosDirectos,
        seguroVida,
        aui,
        costosDirectosSeguroVida: Number(values.costosDirectosSeguroVida) || 0,
        precioAntesIva: Number(values.precioAntesIva) || 0,
        iva: Number(values.iva) || 0,
        precioTotal: Number(values.precioTotal) || 0,
      },
      {
        onSuccess: (response) => {
          if (response.status === 200 || response.status === 201) {
            setIsOpenAdd(false);
          }
        },
      },
    );
  };

  const handleOpenEdit = (adicional: Adicional) => {
    setSelectedAdicional(adicional);

    const inicio = safeParseDate(adicional.mesInicio);
    const fin = adicional.mesFin ? safeParseDate(adicional.mesFin) : null;
    setVigencia({
      anoInicio: inicio.getFullYear(),
      mesInicio: inicio.getMonth() + 1,
      anoFin: fin ? fin.getFullYear() : inicio.getFullYear(),
      mesFin: fin ? fin.getMonth() + 1 : inicio.getMonth() + 1,
    });
    setIsIndefinido(adicional.mesFin === null);

    const costosDirectos = Number(adicional.costosDirectos);
    const seguroVida = Number(adicional.seguroVida);
    const aui = Number(adicional.aui);
    const costosDirectosSeguroVida = Number(adicional.costosDirectosSeguroVida);
    const precioAntesIva = Number(adicional.precioAntesIva);
    const iva = Number(adicional.iva);
    const precioTotal = Number(adicional.precioTotal);

    // Clasifica cada campo calculado como "manual" si su valor guardado no coincide con lo que la
    // formula automatica produciria hoy a partir de los valores crudos guardados — es la unica forma
    // de saber si en su momento se dejo en automatico o se edito a mano, ya que no se persiste ese flag
    const auto = calcularTotalesAdicional(costosDirectos, seguroVida, aui);
    const manuales = new Set<CampoCalculadoAdicional>();
    if (costosDirectosSeguroVida !== auto.costosDirectosSeguroVida) manuales.add("costosDirectosSeguroVida");
    if (precioAntesIva !== auto.precioAntesIva) manuales.add("precioAntesIva");
    if (iva !== auto.iva) manuales.add("iva");
    if (precioTotal !== auto.precioTotal) manuales.add("precioTotal");
    setCamposManualesEdit(manuales);

    resetEdit({
      nombre: adicional.nombre,
      mesInicio: adicional.mesInicio,
      mesFin: adicional.mesFin,
      costosDirectos,
      seguroVida,
      aui,
      costosDirectosSeguroVida,
      precioAntesIva,
      iva,
      precioTotal,
    });

    setIsOpenEdit(true);
  };

  const onSubmitEdit = (data: UpdateAdicionalDto) => {
    if (!selectedAdicional) return;

    const costosDirectos = Number.isNaN(data.costosDirectos as number)
      ? 0
      : Number(data.costosDirectos ?? 0);
    const seguroVida = Number.isNaN(data.seguroVida as number)
      ? 0
      : Number(data.seguroVida ?? 0);
    const aui = Number.isNaN(data.aui as number) ? 0 : Number(data.aui ?? 0);

    if (costosDirectos < 0 || seguroVida < 0 || aui < 0) {
      toast.error("Los valores de precio no pueden ser negativos");
      return;
    }

    actualizarAdicional(
      {
        id: selectedAdicional.idAdicional,
        data: {
          nombre: data.nombre,
          mesInicio: data.mesInicio,
          mesFin: isIndefinido ? null : data.mesFin,
          costosDirectos,
          seguroVida,
          aui,
          costosDirectosSeguroVida: Number(data.costosDirectosSeguroVida) || 0,
          precioAntesIva: Number(data.precioAntesIva) || 0,
          iva: Number(data.iva) || 0,
          precioTotal: Number(data.precioTotal) || 0,
        },
      },
      {
        onSuccess: (response) => {
          if (response.status === 200 || response.status === 201) {
            setIsOpenEdit(false);
          }
        },
      },
    );
  };

  const handleOpenCancelar = (adicional: Adicional) => {
    setSelectedAdicional(adicional);
    setIsOpenCancelar(true);
  };

  const handleOpenDelete = (adicional: Adicional) => {
    setSelectedAdicional(adicional);
    setIsOpenDelete(true);
  };

  const columns: ColumnDef<Adicional>[] = [
    {
      header: "Nombre",
      accessorKey: "nombre",
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap text-gray-700">
          {row.original.nombre}
        </span>
      ),
    },
    {
      header: "Cliente",
      accessorKey: "idCliente",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-gray-700">
          {row.original.idCliente?.nombre}
        </span>
      ),
    },
    {
      header: "Mes Inicio",
      accessorKey: "mesInicio",
      cell: ({ row }) => (
        <span className="capitalize whitespace-nowrap text-gray-600">
          {formatMes(row.original.mesInicio)}
        </span>
      ),
    },
    {
      header: "Mes Fin",
      accessorKey: "mesFin",
      cell: ({ row }) =>
        row.original.mesFin ? (
          <span className="capitalize whitespace-nowrap text-gray-600">
            {formatMes(row.original.mesFin)}
          </span>
        ) : (
          <span className="whitespace-nowrap text-gray-500">Indefinido</span>
        ),
    },
    {
      header: "Precio Total",
      accessorKey: "precioTotal",
      cell: ({ row }) => (
        <span className="font-medium whitespace-nowrap text-green-600">
          {priceFormat(Number(row.original.precioTotal))}
        </span>
      ),
    },
    {
      header: "Estado",
      accessorKey: "estado",
      cell: ({ row }) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            row.original.estado
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {row.original.estado ? "Activo" : "Cancelado"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <MoreActionsButton
          menuId={`adicional-${row.original.idAdicional}`}
          actions={[
            {
              label: "Editar",
              onClick: () => handleOpenEdit(row.original),
            },
            ...(row.original.estado
              ? [
                  {
                    label: "Cancelar",
                    onClick: () => handleOpenCancelar(row.original),
                    color: "yellow" as const,
                  },
                ]
              : []),
            {
              label: "Eliminar",
              onClick: () => handleOpenDelete(row.original),
              color: "red" as const,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Section>
      <div className="flex flex-col gap-8">
        <div className="flex justify-end">
          <ButtonAction Icon={PlusIcon} label="Agregar Adicional" onClick={handleOpenAdd} />
        </div>
        <Table
          columns={columns}
          data={adicionalesQuery?.data?.data ?? []}
          serverPagination
          totalRows={adicionalesQuery?.data?.pagination?.total ?? 0}
          currentPage={page}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSize={pageSize}
          enableFiltering={false}
          enablePagination
          loading={isLoadingAdicionales}
          emptyMessage="No hay adicionales registrados"
        />
      </div>

      {/* Wizard de creación */}
      <SimpleModal
        isOpen={isOpenAdd}
        onClose={handleCloseAdd}
        clickOutsideClose={false}
        title="Agregar Adicional"
        size="3xl"
      >
        <>
          <div className="flex items-center justify-center px-6 py-6">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
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
                {step < totalSteps && (
                  <div
                    className={`mx-2 h-0.5 w-16 ${step < currentStep ? "bg-green-500" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 1 && <NombreAdicional register={registerCreate} />}
            {currentStep === 2 && (
              <SeleccionarClienteAdicional
                idCliente={watchCreate("idCliente")}
                setValue={setValueCreate}
                setSelectedCliente={setSelectedCliente}
              />
            )}
            {currentStep === 3 && (
              <VigenciaAdicional
                setValue={setValueCreate}
                vigencia={vigencia}
                setVigencia={setVigencia}
                isIndefinido={isIndefinido}
                setIsIndefinido={setIsIndefinido}
              />
            )}
            {currentStep === 4 && (
              <PreciosAdicional
                setValue={setValueCreate}
                costosDirectos={watchCreate("costosDirectos") ?? 0}
                seguroVida={watchCreate("seguroVida") ?? 0}
                aui={watchCreate("aui") ?? 0}
                costosDirectosSeguroVida={watchCreate("costosDirectosSeguroVida") ?? 0}
                precioAntesIva={watchCreate("precioAntesIva") ?? 0}
                iva={watchCreate("iva") ?? 0}
                precioTotal={watchCreate("precioTotal") ?? 0}
                camposManuales={camposManualesCreate}
                onToggleManual={toggleManualCreate}
              />
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 px-6 pt-6 pb-4">
            <div className="text-sm text-gray-500">
              Paso {currentStep} de {totalSteps}
              {selectedCliente && currentStep > 2 ? ` · ${selectedCliente.nombre}` : ""}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex cursor-pointer items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                onClick={handleCloseAdd}
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
                onClick={currentStep < totalSteps ? handleNext : handleCreateAdicional}
                disabled={isCreatingAdicional}
                className={`inline-flex cursor-pointer items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  currentStep < totalSteps
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {isCreatingAdicional
                  ? "Creando..."
                  : currentStep < totalSteps
                    ? "Siguiente"
                    : "Crear Adicional"}
              </button>
            </div>
          </div>
        </>
      </SimpleModal>

      {/* Edición */}
      <SimpleModal
        isOpen={isOpenEdit}
        onClose={() => setIsOpenEdit(false)}
        title="Editar Adicional"
        size="2xl"
      >
        <FormsModal
          onSubmit={handleSubmitEdit(onSubmitEdit)}
          isLoading={isUpdatingAdicional}
          updating={true}
          onCancel={() => setIsOpenEdit(false)}
        >
          <div className="flex flex-col gap-6">
            <p className="text-sm text-gray-600">
              Cliente:{" "}
              <span className="font-medium text-gray-800">
                {selectedAdicional?.idCliente?.nombre}
              </span>{" "}
              (no se puede cambiar)
            </p>
            <NombreAdicional register={registerEdit} showHeader={false} />
            <VigenciaAdicional
              setValue={setValueEdit}
              vigencia={vigencia}
              setVigencia={setVigencia}
              isIndefinido={isIndefinido}
              setIsIndefinido={setIsIndefinido}
              showHeader={false}
            />
            <PreciosAdicional
              setValue={setValueEdit}
              costosDirectos={watchEdit("costosDirectos") ?? 0}
              seguroVida={watchEdit("seguroVida") ?? 0}
              aui={watchEdit("aui") ?? 0}
              costosDirectosSeguroVida={watchEdit("costosDirectosSeguroVida") ?? 0}
              precioAntesIva={watchEdit("precioAntesIva") ?? 0}
              iva={watchEdit("iva") ?? 0}
              precioTotal={watchEdit("precioTotal") ?? 0}
              camposManuales={camposManualesEdit}
              onToggleManual={toggleManualEdit}
              showHeader={false}
            />
          </div>
        </FormsModal>
      </SimpleModal>

      <ConfirmarDelete
        isOpenDelete={isOpenCancelar}
        text={`¿Estás seguro de querer cancelar el adicional "${selectedAdicional?.nombre}"? Dejará de cobrarse desde este momento, sin importar el mes de fin configurado.`}
        actionLabel="Cancelar"
        onClose={() => setIsOpenCancelar(false)}
        onDelete={() => {
          if (!selectedAdicional) return;
          cancelarAdicionalMutate(selectedAdicional.idAdicional, {
            onSuccess: (response) => {
              if (response.status === 200 || response.status === 201) {
                setIsOpenCancelar(false);
              }
            },
          });
        }}
      />

      <ConfirmarDelete
        isOpenDelete={isOpenDelete}
        text={`¿Estás seguro de querer eliminar el adicional "${selectedAdicional?.nombre}"? Esta acción no se puede deshacer.`}
        onClose={() => setIsOpenDelete(false)}
        onDelete={() => {
          if (!selectedAdicional) return;
          eliminarAdicional(selectedAdicional.idAdicional, {
            onSuccess: (response) => {
              if (response.status === 200 || response.status === 201) {
                setIsOpenDelete(false);
              }
            },
          });
        }}
      />
    </Section>
  );
}
