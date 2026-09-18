import { Building2, Check, IdCard, Search, Tag } from "lucide-react";
import type { Cliente } from "../../../types";
import { useFilterClientes } from "../../../api/queryFunctions/clientes";
import { useEffect, useState } from "react";
import { ClienteFilterColumn } from "../../../api/dtos/clientes";
import type { UseFormSetValue } from "react-hook-form";
import type { CreateAdicionalDto } from "../../../api/dtos";

const CLIENTE_COLUMN_LABELS: Record<ClienteFilterColumn, string> = {
  [ClienteFilterColumn.NUMERO_IDENTIFICACION]: "Número de identificación",
  [ClienteFilterColumn.NOMBRE]: "Nombre",
  [ClienteFilterColumn.TIPO_CLIENTE]: "Tipo de cliente",
  [ClienteFilterColumn.SUBSEGMENTACION]: "Subsegmentación",
};

export const SeleccionarClienteAdicional = ({
  idCliente,
  setValue,
  setSelectedCliente,
}: {
  idCliente: number;
  setValue: UseFormSetValue<CreateAdicionalDto>;
  setSelectedCliente: (cliente: Cliente) => void;
}) => {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const [searchColumn, setSearchColumn] = useState<ClienteFilterColumn>(
    ClienteFilterColumn.NOMBRE,
  );
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchText]);

  const { mutate: filterClientes } = useFilterClientes();

  useEffect(() => {
    if (debouncedSearchText.trim().length === 0) {
      setFilteredClientes(undefined);
      return;
    }

    filterClientes(
      {
        column: searchColumn,
        query: debouncedSearchText,
        pagination: false,
      },
      {
        onSuccess: (data) => {
          setFilteredClientes(data.data?.data);
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchText, searchColumn]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Seleccionar Cliente
        </h3>
        <p className="text-sm text-gray-600">
          Busque y seleccione el cliente al que se le cobrará este adicional
        </p>
      </div>

      {/* Buscador */}
      <div className="flex flex-row justify-between gap-2">
        <div className="flex-1">
          <select
            id="search"
            value={searchColumn}
            onChange={(e) => {
              setSearchColumn(e.target.value as ClienteFilterColumn);
              setValue("idCliente", 0);
            }}
            className="w-full rounded-md border border-gray-300 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="" disabled>
              Seleccionar columna
            </option>
            {Object.values(ClienteFilterColumn).map((column) => (
              <option key={column} value={column}>
                {CLIENTE_COLUMN_LABELS[column]}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex-2">
          <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, identificación, tipo o subsegmentación del cliente..."
            className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setValue("idCliente", 0);
            }}
          />
        </div>
      </div>

      <p className="text-sm text-gray-700">
        Clientes encontrados ({filteredClientes?.length || 0})
      </p>

      <div className="max-h-80 min-h-40 space-y-3 overflow-y-auto">
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
                  <h4 className="font-medium text-gray-900">{cliente.nombre}</h4>
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
      </div>
    </div>
  );
};
