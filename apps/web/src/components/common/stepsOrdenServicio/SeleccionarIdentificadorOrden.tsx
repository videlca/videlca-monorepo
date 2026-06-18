import { useEffect } from "react";
import { usePrefijosTipoServicio } from "../../../api/queryFunctions/servicios";

export const SeleccionarIdentificadorOrden = ({
  identificador,
  setIdentificador,
  nextIdOrdenServicio,
}: {
  identificador: {
    codigoTipoServicio: number;
    prefijo: string;
    codigo: number;
  };
  setIdentificador: (identificador: {
    codigoTipoServicio: number;
    prefijo: string;
    codigo: number;
  }) => void;
  nextIdOrdenServicio: number;
}) => {
  const { data: prefijosQuery } = usePrefijosTipoServicio();

  useEffect(() => {
    setIdentificador({
      ...identificador,
      codigo: nextIdOrdenServicio === 0 ? 1 : nextIdOrdenServicio,
    });
  }, [nextIdOrdenServicio]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Seleccionar Identificador de Orden de Servicio
        </h3>
        <p className="text-sm text-gray-600">
          Ingrese el código de la orden de servicio para identificarla de forma
          única
        </p>
      </div>
      {/* <div className="mt-4 space-y-1 rounded-lg border border-yellow-500 bg-yellow-50 px-4 py-2 text-left">
        <h4 className="text-base font-medium text-yellow-600">Nota:</h4>{" "}
        <p className="text-xs text-yellow-600">
          El siguiente identificador de orden de servicio es el siguiente:{" "}
          <b>{nextIdOrdenServicio}</b>
        </p>
      </div> */}
      <label className="text-sm text-gray-700" htmlFor="numeroOrdenServicio">
        Código de Orden de Servicio
      </label>
      <div className="flex flex-row gap-2">
        <select
          name="prefijo"
          id="prefijo"
          value={identificador.codigoTipoServicio || 0}
          onChange={(e) => {
            setIdentificador({
              ...identificador,
              codigoTipoServicio: Number(e.target.value),
              prefijo: e.target.options[e.target.selectedIndex].text,
            });
          }}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Seleccione un prefijo</option>
          {prefijosQuery?.data?.map((prefijo) => (
            <option key={prefijo.idTipoServicio} value={prefijo.idTipoServicio}>
              {prefijo.prefijo}
            </option>
          )) || []}
        </select>
        <span className="flex items-center text-sm text-gray-700">-</span>
        <input
          type="number"
          name="codigoOrdenServicio"
          id="codigoOrdenServicio"
          value={identificador.codigo}
          disabled={true}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
    </div>
  );
};
