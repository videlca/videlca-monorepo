import { useState } from "react";
import { InputSelect } from "../../../common/InputSelect";
import { useClientes } from "../../../../api/queryFunctions/clientes";
import type { GruposLiquidaciones } from "../../../../api/types";

// "0" = sin filtro (InputSelect no permite limpiar la seleccion, asi que se ofrece como opcion)
const TODOS = "0";

// FILTRO DE GRUPOS DE LIQUIDACION POR TIPO DE CLIENTE Y CLIENTE (pantallas de exportacion). Se aplica sobre los
// grupos ya cargados. Las opciones salen de la lista de clientes (todos, no solo activos: hay grupos de clientes
// que ya fueron desactivados); el tipo de un grupo es el tipo de su cliente
export const useFiltroClienteGrupos = () => {
  const [tipoCliente, setTipoCliente] = useState<string>(TODOS);
  const [cliente, setCliente] = useState<string>(TODOS);

  const { data } = useClientes();
  const clientes = data?.data?.data ?? [];
  const tipoPorCliente = new Map(
    clientes.map((c) => [c.idCliente, c.idTipoCliente?.idTipoCliente]),
  );

  const tiposClienteOptions = [
    { id: Number(TODOS), descripcion: "Todos los tipos" },
    ...Array.from(
      new Map(
        clientes
          .filter((c) => c.idTipoCliente)
          .map((c) => [c.idTipoCliente.idTipoCliente, c.idTipoCliente.descripcion]),
      ),
      ([id, descripcion]) => ({ id, descripcion }),
    ).sort((a, b) => a.descripcion.localeCompare(b.descripcion)),
  ];

  // Con un tipo de cliente elegido, el selector de cliente solo muestra los clientes de ese tipo
  const clientesOptions = [
    { id: Number(TODOS), descripcion: "Todos los clientes" },
    ...clientes
      .filter(
        (c) =>
          tipoCliente === TODOS ||
          c.idTipoCliente?.idTipoCliente === Number(tipoCliente),
      )
      .map((c) => ({ id: c.idCliente, descripcion: c.nombre }))
      .sort((a, b) => a.descripcion.localeCompare(b.descripcion)),
  ];

  const cambiarTipoCliente = (tipo: string) => {
    setTipoCliente(tipo);
    // Si el cliente elegido no es de este tipo, se vuelve a "Todos los clientes"
    if (
      tipo !== TODOS &&
      cliente !== TODOS &&
      tipoPorCliente.get(Number(cliente)) !== Number(tipo)
    ) {
      setCliente(TODOS);
    }
  };

  const filtrar = (grupos: GruposLiquidaciones[]) =>
    grupos.filter(
      (grupo) =>
        (tipoCliente === TODOS ||
          (grupo.idCliente != null &&
            tipoPorCliente.get(grupo.idCliente.idCliente) === Number(tipoCliente))) &&
        (cliente === TODOS || grupo.idCliente?.idCliente === Number(cliente)),
    );

  return {
    tipoCliente,
    cliente,
    setCliente,
    cambiarTipoCliente,
    tiposClienteOptions,
    clientesOptions,
    filtrar,
    hayFiltro: tipoCliente !== TODOS || cliente !== TODOS,
  };
};

export function FiltroClienteGrupos({
  filtro,
}: {
  filtro: ReturnType<typeof useFiltroClienteGrupos>;
}) {
  return (
    <>
      <div className="min-w-48 flex-1">
        <InputSelect
          label="Tipo cliente"
          placeholder="Selecciona un tipo de cliente"
          id="filtroTipoClienteExportacion"
          value={filtro.tipoCliente}
          onChange={(e) => filtro.cambiarTipoCliente(e.target.value)}
          options={filtro.tiposClienteOptions}
        />
      </div>
      <div className="min-w-48 flex-1">
        <InputSelect
          label="Cliente"
          placeholder="Selecciona un cliente"
          id="filtroClienteExportacion"
          value={filtro.cliente}
          onChange={(e) => filtro.setCliente(e.target.value)}
          options={filtro.clientesOptions}
        />
      </div>
    </>
  );
}
