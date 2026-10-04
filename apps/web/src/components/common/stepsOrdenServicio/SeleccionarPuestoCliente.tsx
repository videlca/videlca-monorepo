import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { SelectableCard } from "../../ui/common/SelectableCard";
import { StepHeader } from "../../ui/common/StepHeader";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import SearchIcon from "@mui/icons-material/Search";
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
  const limpiarSeleccion = () => {
    if (buscarPorCliente) {
      setValue("idCliente", 0);
    } else {
      setValue("idLocacion", 0);
    }
  };
  const mensajeVacio = (texto: string) => (
    <Typography variant="body2" color="text.secondary" align="center">
      {texto}
    </Typography>
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <StepHeader
        title={buscarPorCliente ? "Seleccionar Cliente" : "Seleccionar Puesto"}
        description={
          esOrdenMonitoreo
            ? "Busque y seleccione el cliente al que se le prestará el servicio de monitoreo de alarmas"
            : buscarPorCliente
              ? "Busque y seleccione el cliente al que se le prestará el servicio"
              : "Busque y seleccione el cliente y el puesto donde se prestada el servicio"
        }
      />

      {esVigilanciaYEscolta && (
        <div className="flex justify-center">
          <ToggleButtonGroup
            exclusive
            size="small"
            color="primary"
            value={modoBusqueda}
            onChange={(_, modo: "puesto" | "cliente" | null) => modo && setModoBusqueda(modo)}
          >
            <ToggleButton value="puesto" sx={{ px: 2 }}>
              Buscar por Puesto
            </ToggleButton>
            <ToggleButton value="cliente" sx={{ px: 2 }}>
              Buscar por Cliente
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      )}

      {/* Buscador */}
      <div className="flex flex-row gap-2">
        <TextField
          select
          id="search"
          label="Columna"
          value={searchColumn}
          onChange={(e) => {
            setSearchColumn(
              e.target.value as LocacionFilterColumn | ClienteFilterColumn,
            );
            limpiarSeleccion();
          }}
          sx={{ flex: 1 }}
          slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
        >
          <MenuItem value="" disabled>
            Seleccionar columna
          </MenuItem>
          {buscarPorCliente
            ? Object.values(ClienteFilterColumn).map((column) => (
                <MenuItem key={column} value={column}>
                  {CLIENTE_COLUMN_LABELS[column]}
                </MenuItem>
              ))
            : [
                <MenuItem key="nombre" value="nombre">
                  Nombre
                </MenuItem>,
                <MenuItem key="direccion" value="direccion">
                  Dirección
                </MenuItem>,
                <MenuItem key="cliente" value="cliente">
                  Cliente
                </MenuItem>,
                <MenuItem key="ciudad" value="ciudad">
                  Ciudad
                </MenuItem>,
              ]}
        </TextField>
        <TextField
          placeholder={
            buscarPorCliente
              ? "Buscar por nombre, identificación, tipo o subsegmentación del cliente..."
              : "Buscar por nombre del cliente, puesto o dirección..."
          }
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            limpiarSeleccion();
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
        {buscarPorCliente
          ? `Clientes encontrados (${filteredClientes?.length || 0})`
          : `Puestos encontrados (${filteredPuestos?.length || 0})`}
      </Typography>

      <div className="flex max-h-80 min-h-40 flex-col gap-3 overflow-y-auto">
        {buscarPorCliente ? (
          <>
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
            {filteredClientes?.length === 0 && mensajeVacio("No se encontraron clientes.")}
            {filteredClientes === undefined &&
              mensajeVacio("Seleccione una columna y un texto para buscar clientes.")}
          </>
        ) : (
          <>
            {filteredPuestos?.map((puesto) => (
              <SelectableCard
                key={puesto.idLocacion}
                selected={idLocacion === puesto.idLocacion}
                onClick={() => {
                  setValue("idLocacion", puesto.idLocacion);
                  setSelectedPuesto(puesto);
                }}
              >
                <Typography variant="body1" className="flex items-center gap-2" sx={{ fontWeight: 500, mb: 0.5 }}>
                  <PlaceOutlinedIcon fontSize="small" color="primary" />
                  {puesto.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary" className="flex items-center gap-1">
                  <BusinessOutlinedIcon sx={{ fontSize: 14 }} />
                  {puesto.idCliente.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary" className="flex items-center gap-1">
                  <PlaceOutlinedIcon sx={{ fontSize: 14 }} />
                  {puesto.direccion} - {puesto.idCiudad.descripcion}
                </Typography>
                <Typography variant="body2" color="text.secondary" className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <PersonOutlinedIcon sx={{ fontSize: 14 }} />
                    {puesto.primerNombreResponsable} {puesto.primerApellidoResponsable}
                  </span>
                  <span className="flex items-center gap-1">
                    <PhoneOutlinedIcon sx={{ fontSize: 14 }} />
                    {puesto.telefono}
                  </span>
                </Typography>
              </SelectableCard>
            ))}
            {filteredPuestos?.length === 0 && mensajeVacio("No se encontraron puestos.")}
            {filteredPuestos === undefined &&
              mensajeVacio("Seleccione una columna y un texto para buscar puestos.")}
          </>
        )}
      </div>

      <SimpleModal
        isOpen={isOpenCreatePuesto}
        onClose={() => setIsOpenCreatePuesto(false)}
        size="md"
      >
        <Typography variant="h4" component="h3" align="center">
          Crear Puesto
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          Será dirigido a la vista de creación de puesto. En caso de querer
          crear un puesto, por favor, haga clic en el botón "Crear Puesto".
        </Typography>
        <div className="flex justify-center gap-2 pt-4">
          <ButtonAction
            Icon={CloseIcon}
            label="Cancelar"
            color="blue-light"
            type="button"
            onClick={() => setIsOpenCreatePuesto(false)}
          />
          <ButtonAction
            Icon={CheckIcon}
            label="Crear Puesto"
            type="button"
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
