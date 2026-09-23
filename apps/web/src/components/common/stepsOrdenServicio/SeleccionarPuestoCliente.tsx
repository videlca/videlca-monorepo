import {
  Building2,
  Check,
  IdCard,
  MapPin,
  Phone,
  PlusIcon,
  Search,
  Tag,
  User,
  XIcon,
} from "lucide-react";
import type { Cliente, Puesto } from "../../../types";
import { useFilterPuestos, useFilterClientes } from "../../../api/queryFunctions/clientes";
import { useEffect, useState } from "react";
import { SimpleModal } from "../SimpleModal";
import { ButtonAction } from "../ButtonAction";
import { useNavigate } from "@tanstack/react-router";
import { LocacionFilterColumn, ClienteFilterColumn } from "../../../api/dtos/clientes";
import type { UseFormSetValue } from "react-hook-form";
import {
  TIPO_SERVICIO_MONITOREO_ALARMAS,
  TIPO_SERVICIO_VIGILANCIA_Y_ESCOLTA,
} from "./tipoServicioConstantes";

const CLIENTE_COLUMN_LABELS: Record<ClienteFilterColumn, string> = {
  [ClienteFilterColumn.NUMERO_IDENTIFICACION]: "Número de identificación",
  [ClienteFilterColumn.NOMBRE]: "Nombre",
  [ClienteFilterColumn.TIPO_CLIENTE]: "Tipo de cliente",
  [ClienteFilterColumn.SUBSEGMENTACION]: "Subsegmentación",
};

export const SeleccionarPuestoCliente = ({
  idLocacion,
  idCliente,
  setValue,
  setSelectedPuesto,
  setSelectedCliente,
  tipoServicioNombre,
}: {
  idLocacion: number;
  idCliente: number;
  setValue: UseFormSetValue<any>;
  setSelectedPuesto: (puesto: Puesto) => void;
  setSelectedCliente: (cliente: Cliente) => void;
  tipoServicioNombre?: string;
}) => {
  const esOrdenMonitoreo = tipoServicioNombre === TIPO_SERVICIO_MONITOREO_ALARMAS;
  const esVigilanciaYEscolta =
    tipoServicioNombre === TIPO_SERVICIO_VIGILANCIA_Y_ESCOLTA;

  const [isOpenCreatePuesto, setIsOpenCreatePuesto] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [searchColumn, setSearchColumn] = useState<
    LocacionFilterColumn | ClienteFilterColumn
  >(LocacionFilterColumn.NOMBRE);
  const [filteredPuestos, setFilteredPuestos] = useState<Puesto[]>();
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>();
  // Solo relevante para "Vigilancia y escolta": el usuario elige si la orden se asigna a un puesto o directo
  // a un cliente (ver commit backend 8cd811e). "Monitoreo de alarmas" siempre busca por cliente, sin importar
  // este estado (ver buscarPorCliente)
  const [modoBusqueda, setModoBusqueda] = useState<"puesto" | "cliente">(
    "puesto",
  );

  const buscarPorCliente =
    esOrdenMonitoreo || (esVigilanciaYEscolta && modoBusqueda === "cliente");

  // Si el tipo de servicio deja de ser "Vigilancia y escolta" (el usuario volvio al paso 1 y cambio de tipo),
  // se reinicia el modo para que la proxima vez que vuelva a ser vigilancia y escolta arranque en "puesto"
  useEffect(() => {
    if (!esVigilanciaYEscolta) {
      setModoBusqueda("puesto");
    }
  }, [esVigilanciaYEscolta]);

  // Al cambiar el modo de busqueda (puesto vs cliente) se reinicia la busqueda: las columnas de filtro son
  // distintas para Locacion (puesto) y Cliente, no tiene sentido conservar una seleccion que ya no aplica.
  // Tambien se limpia el campo contrario al que aplica ahora, para no enviar accidentalmente ambos ids al crear
  // la orden (el backend rechaza idLocacion + idCliente juntos)
  useEffect(() => {
    setSearchText("");
    setDebouncedSearchText("");
    setFilteredPuestos(undefined);
    setFilteredClientes(undefined);
    setSearchColumn(
      buscarPorCliente ? ClienteFilterColumn.NOMBRE : LocacionFilterColumn.NOMBRE,
    );
    if (buscarPorCliente) {
      setValue("idLocacion", 0);
    } else {
      setValue("idCliente", 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscarPorCliente]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchText]);

  const { mutate: filterPuestos } = useFilterPuestos();
  const { mutate: filterClientes } = useFilterClientes();

  useEffect(() => {
    if (debouncedSearchText.trim().length === 0) {
      setFilteredPuestos(undefined);
      setFilteredClientes(undefined);
      return;
    }

    if (buscarPorCliente) {
      filterClientes(
        {
          column: searchColumn as ClienteFilterColumn,
          query: debouncedSearchText,
          pagination: false,
        },
        {
          onSuccess: (data) => {
            setFilteredClientes(data.data?.data);
          },
        },
      );
    } else {
      filterPuestos(
        {
          column: searchColumn as LocacionFilterColumn,
          query: debouncedSearchText,
          pagination: false,
        },
        {
          onSuccess: (data) => {
            setFilteredPuestos(data.data?.data);
          },
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchText, searchColumn, buscarPorCliente]);

  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          {buscarPorCliente ? "Seleccionar Cliente" : "Seleccionar Puesto"}
        </h3>
        <p className="text-sm text-gray-600">
          {esOrdenMonitoreo
            ? "Busque y seleccione el cliente al que se le prestará el servicio de monitoreo de alarmas"
            : buscarPorCliente
              ? "Busque y seleccione el cliente al que se le prestará el servicio"
              : "Busque y seleccione el cliente y el puesto donde se prestada el servicio"}
        </p>
      </div>

      {esVigilanciaYEscolta && (
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setModoBusqueda("puesto")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
                modoBusqueda === "puesto"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Buscar por Puesto
            </button>
            <button
              type="button"
              onClick={() => setModoBusqueda("cliente")}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
                modoBusqueda === "cliente"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Buscar por Cliente
            </button>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="flex flex-row justify-between gap-2">
        <div className="flex-1">
          <select
            id="search"
            value={searchColumn}
            onChange={(e) => {
              setSearchColumn(
                e.target.value as LocacionFilterColumn | ClienteFilterColumn,
              );
              if (buscarPorCliente) {
                setValue("idCliente", 0);
              } else {
                setValue("idLocacion", 0);
              }
            }}
            className="w-full rounded-md border border-gray-300 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="" disabled>
              Seleccionar columna
            </option>
            {buscarPorCliente
              ? Object.values(ClienteFilterColumn).map((column) => (
                  <option key={column} value={column}>
                    {CLIENTE_COLUMN_LABELS[column]}
                  </option>
                ))
              : [
                  <option key="nombre" value="nombre">
                    Nombre
                  </option>,
                  <option key="direccion" value="direccion">
                    Dirección
                  </option>,
                  <option key="cliente" value="cliente">
                    Cliente
                  </option>,
                  <option key="ciudad" value="ciudad">
                    Ciudad
                  </option>,
                ]}
          </select>
        </div>
        <div className="relative flex-2">
          <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={
              buscarPorCliente
                ? "Buscar por nombre, identificación, tipo o subsegmentación del cliente..."
                : "Buscar por nombre del cliente, puesto o dirección..."
            }
            className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              if (buscarPorCliente) {
                setValue("idCliente", 0);
              } else {
                setValue("idLocacion", 0);
              }
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          {buscarPorCliente
            ? `Clientes encontrados (${filteredClientes?.length || 0})`
            : `Puestos encontrados (${filteredPuestos?.length || 0})`}
        </p>
        {/* {!buscarPorCliente && (
          <div className="justify-end">
            <button
              className="flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              onClick={() => setIsOpenCreatePuesto(true)}
            >
              <PlusIcon className="h-4 w-4" />
              Crear Puesto
            </button>
          </div>
        )} */}
      </div>

      <div className="max-h-80 min-h-40 space-y-3 overflow-y-auto">
        {buscarPorCliente ? (
          <>
            {filteredClientes?.map((cliente) => (
              <div
                key={cliente.idCliente}
                className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                  idCliente === cliente.idCliente
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
                onClick={() => {
                  setValue("idCliente", cliente.idCliente);
                  setSelectedCliente(cliente);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium text-gray-900">
                        {cliente.nombre}
                      </h4>
                      {idCliente === cliente.idCliente && (
                        <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="mb-1 flex items-center gap-1 text-sm text-gray-600">
                      <IdCard className="h-3 w-3" />
                      <span>{cliente.numeroIdentificacion}</span>
                    </div>
                    {cliente.idTipoCliente && (
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span>{cliente.idTipoCliente.descripcion}</span>
                        </div>
                        {cliente.idSubSegmentacion && (
                          <span>{cliente.idSubSegmentacion.descripcion}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredClientes?.length === 0 && (
              <p className="text-center text-sm text-gray-500">
                No se encontraron clientes.
              </p>
            )}
            {filteredClientes === undefined && (
              <p className="text-center text-sm text-gray-500">
                Seleccione una columna y un texto para buscar clientes.
              </p>
            )}
          </>
        ) : (
          <>
            {filteredPuestos?.map((puesto) => (
              <div
                key={puesto.idLocacion}
                className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
                  idLocacion === puesto.idLocacion
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
                onClick={() => {
                  setValue("idLocacion", puesto.idLocacion);
                  setSelectedPuesto(puesto);
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium text-gray-900">{puesto.nombre}</h4>
                      {idLocacion === puesto.idLocacion && (
                        <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="mb-1 flex items-center gap-1 text-sm text-gray-600">
                      <Building2 className="h-3 w-3" />
                      <span>{puesto.idCliente.nombre}</span>
                    </div>
                    <div className="mb-1 flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {puesto.direccion} - {puesto.idCiudad.descripcion}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>
                          {puesto.primerNombreResponsable}{" "}
                          {puesto.primerApellidoResponsable}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span>{puesto.telefono}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredPuestos?.length === 0 && (
              <p className="text-center text-sm text-gray-500">
                No se encontraron puestos.
              </p>
            )}
            {filteredPuestos === undefined && (
              <p className="text-center text-sm text-gray-500">
                Seleccione una columna y un texto para buscar puestos.
              </p>
            )}
          </>
        )}
      </div>

      <SimpleModal
        isOpen={isOpenCreatePuesto}
        onClose={() => setIsOpenCreatePuesto(false)}
        size="md"
      >
        <h3 className="text-center text-lg font-medium">Crear Puesto</h3>
        <p className="text-center text-sm text-gray-600">
          Será dirigido a la vista de creación de puesto. En caso de querer
          crear un puesto, por favor, haga clic en el botón "Crear Puesto".
        </p>
        <div className="flex justify-center gap-2 pt-4">
          <ButtonAction
            Icon={XIcon}
            label="Cancelar"
            onClick={() => setIsOpenCreatePuesto(false)}
          />
          <ButtonAction
            Icon={Check}
            label="Crear Puesto"
            onClick={() => {
              setIsOpenCreatePuesto(false);
              navigate({
                to: "/dashboard/clientes",
              });
            }}
            color="blue"
          />
        </div>
      </SimpleModal>
    </div>
  );
};
