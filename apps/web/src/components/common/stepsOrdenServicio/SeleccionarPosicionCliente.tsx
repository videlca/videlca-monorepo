import { Building2, Check, MapPin, Phone, Search, User } from "lucide-react";
import type { Posicion } from "../../../types";
import { usePosicionesActivo } from "../../../api/queryFunctions/clientes";
import type { CreateOrdenServicioDto } from "../../../api/dtos/orden-servicio";

export const SeleccionarPosicionCliente = ({
  formOrdenServicio,
  setFormOrdenServicio,
  setSelectedPosicion,
}: {
  formOrdenServicio: CreateOrdenServicioDto;
  setFormOrdenServicio: (formOrdenServicio: CreateOrdenServicioDto) => void;
  setSelectedPosicion: (posicion: Posicion) => void;
}) => {
  const { data: posicionesQuery } = usePosicionesActivo();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Seleccionar Localización
        </h3>
        <p className="text-sm text-gray-600">
          Busque y seleccione el cliente y la localización donde se prestará el
          servicio
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
        {posicionesQuery?.data?.map((posicion) => (
          <div
            key={posicion.idLocacion}
            className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
              formOrdenServicio.idLocacion === posicion.idLocacion
                ? "border-blue-500 bg-blue-50 shadow-sm"
                : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
            }`}
            onClick={() => {
              setFormOrdenServicio({
                ...formOrdenServicio,
                idLocacion: posicion.idLocacion,
              });
              setSelectedPosicion(posicion);
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-gray-900">
                    {posicion.nombre}
                  </h4>
                  {formOrdenServicio.idLocacion === posicion.idLocacion && (
                    <div className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-blue-600">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="mb-1 flex items-center gap-1 text-sm text-gray-600">
                  <Building2 className="h-3 w-3" />
                  <span>{posicion.idCliente.nombre}</span>
                </div>
                <div className="mb-1 flex items-center gap-1 text-sm text-gray-600">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {posicion.direccion} - {posicion.idCiudad.descripcion}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>
                      {posicion.primerNombreResponsable}{" "}
                      {posicion.primerApellidoResponsable}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{posicion.telefono}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
