import { usePrefijosTipoServicio } from "../../../api/queryFunctions/servicios";

export const SeleccionarIdentificadorOrden = ({
  identificador,
  setIdentificador,
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
}) => {
  const { data: prefijosQuery } = usePrefijosTipoServicio();

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
          min={0}
          placeholder="0000"
          value={identificador.codigo}
          maxLength={10}
          onChange={(e) =>
            setIdentificador({
              ...identificador,
              codigo: Number(e.target.value),
            })
          }
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
    </div>
  );
};
