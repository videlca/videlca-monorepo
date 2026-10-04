import { StepHeader } from "../../ui/common/StepHeader";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { SelectableCard } from "../../ui/common/SelectableCard";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import SearchIcon from "@mui/icons-material/Search";
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
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <StepHeader
          title="Seleccionar Cliente"
          description="Busque y seleccione el cliente al que se le cobrará este adicional"
        />

      {/* Buscador */}
      <div className="flex flex-row justify-between gap-2">
        <TextField
          select
          id="search"
          label="Columna"
          value={searchColumn}
          onChange={(e) => {
            setSearchColumn(e.target.value as ClienteFilterColumn);
            setValue("idCliente", 0);
          }}
          sx={{ flex: 1 }}
          slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
        >
          <MenuItem value="" disabled>
            Seleccionar columna
          </MenuItem>
          {Object.values(ClienteFilterColumn).map((column) => (
            <MenuItem key={column} value={column}>
              {CLIENTE_COLUMN_LABELS[column]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          placeholder="Buscar por nombre, identificación, tipo o subsegmentación del cliente..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setValue("idCliente", 0);
          }}
          sx={{ flex: 2 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </div>

      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        Clientes encontrados ({filteredClientes?.length || 0})
      </Typography>

      <div className="flex max-h-80 min-h-40 flex-col gap-3 overflow-y-auto">
        {filteredClientes?.map((cliente) => (
          <SelectableCard
            key={cliente.idCliente}
            selected={idCliente === cliente.idCliente}
            onClick={() => {
              setValue("idCliente", cliente.idCliente);
              setSelectedCliente(cliente);
            }}
          >
            <Typography variant="body1" className="flex items-center gap-2" sx={{ fontWeight: 500, mb: 0.5 }}>
              <BusinessOutlinedIcon fontSize="small" color="primary" />
              {cliente.nombre}
            </Typography>
            <Typography variant="body2" color="text.secondary" className="flex items-center gap-1">
              <BadgeOutlinedIcon sx={{ fontSize: 14 }} />
              {cliente.numeroIdentificacion}
            </Typography>
            {cliente.idTipoCliente && (
              <Typography variant="body2" color="text.secondary" className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <LocalOfferOutlinedIcon sx={{ fontSize: 14 }} />
                  {cliente.idTipoCliente.descripcion}
                </span>
                {cliente.idSubSegmentacion && (
                  <span>{cliente.idSubSegmentacion.descripcion}</span>
                )}
              </Typography>
            )}
          </SelectableCard>
        ))}
        {filteredClientes?.length === 0 && (
          <Typography variant="body2" color="text.secondary" align="center">
            No se encontraron clientes.
          </Typography>
        )}
        {filteredClientes === undefined && (
          <Typography variant="body2" color="text.secondary" align="center">
            Seleccione una columna y un texto para buscar clientes.
          </Typography>
        )}
      </div>
    </div>
  );
};
