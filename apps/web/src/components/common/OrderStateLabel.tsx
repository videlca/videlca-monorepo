import { EstadosOrden } from "../../types/estados_orden";

export const OrderStateLabel = ({ state }: { state: string }) => {
  const stateColor = {
    [EstadosOrden.CANCELADO]: "bg-red-200 text-red-600",
    [EstadosOrden.PROGRAMADO]: "bg-blue-200 text-blue-600",
    [EstadosOrden.POR_INICIAR]: "bg-yellow-200 text-yellow-600",
    [EstadosOrden.INICIADO]: "bg-green-200 text-green-600",
    [EstadosOrden.POR_TERMINAR]: "bg-purple-200 text-purple-600",
    [EstadosOrden.TERMINADO]: "bg-gray-200 text-gray-600",
  };
  return (
    <span
      className={`rounded-full px-2 py-1 text-sm font-semibold capitalize ${stateColor[state as EstadosOrden]}`}
    >
      {state}
    </span>
  );
};
