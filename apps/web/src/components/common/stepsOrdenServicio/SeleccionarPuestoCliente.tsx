import {
  Building2,
  Check,
  MapPin,
  Phone,
  PlusIcon,
  Search,
  User,
  XIcon,
} from "lucide-react";
import type { Puesto } from "../../../types";
import { usePuestosActivo } from "../../../api/queryFunctions/clientes";
import type { CreateOrdenServicioDto } from "../../../api/dtos/orden-servicio";
import { useState } from "react";
import { SimpleModal } from "../SimpleModal";
import { ButtonAction } from "../ButtonAction";
import { useNavigate } from "@tanstack/react-router";

export const SeleccionarPuestoCliente = ({
  formOrdenServicio,
  setFormOrdenServicio,
  setSelectedPuesto,
}: {
  formOrdenServicio: CreateOrdenServicioDto;
  setFormOrdenServicio: (formOrdenServicio: CreateOrdenServicioDto) => void;
  setSelectedPuesto: (puesto: Puesto) => void;
}) => {
  const [isOpenCreatePuesto, setIsOpenCreatePuesto] = useState(false);
  const { data: puestosQuery } = usePuestosActivo();
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Seleccionar Puesto
        </h3>
        <p className="text-sm text-gray-600">
          Busque y seleccione el cliente y el puesto donde se prestará el
          servicio
        </p>
      </div>

      {/* Buscador de puestos */}
      <div className="flex flex-row justify-between gap-2">
        <div className="flex-1">
          <select
            id="search"
            value={""}
            onChange={() => {}}
            className="w-full rounded-md border border-gray-300 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required={false}
            disabled={false}
          >
            <option value="" disabled defaultValue={""}>
              Seleccionar filtro
            </option>
          </select>
        </div>
        <div className="relative flex-2">
          <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre del cliente, puesto o dirección..."
            className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Puestos encontrados ({puestosQuery?.data?.length})
        </p>
        <div className="justify-end">
          <button
            className="flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            onClick={() => setIsOpenCreatePuesto(true)}
          >
            <PlusIcon className="h-4 w-4" />
            Crear Puesto
          </button>
        </div>
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto">
        {puestosQuery?.data?.map((puesto) => (
          <div
            key={puesto.idLocacion}
            className={`cursor-pointer rounded-lg border p-4 transition-all duration-200 ${
              formOrdenServicio.idLocacion === puesto.idLocacion
                ? "border-blue-500 bg-blue-50 shadow-sm"
                : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
            }`}
            onClick={() => {
              setFormOrdenServicio({
                ...formOrdenServicio,
                idLocacion: puesto.idLocacion,
              });
              setSelectedPuesto(puesto);
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-gray-900">{puesto.nombre}</h4>
                  {formOrdenServicio.idLocacion === puesto.idLocacion && (
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
