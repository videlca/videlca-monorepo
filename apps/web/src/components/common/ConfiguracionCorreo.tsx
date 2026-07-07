import { useState } from "react";
import { ButtonAction } from "./ButtonAction";
import { InputForm } from "./InputForm";
import { ChevronDown, PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import type { CreateCorreoDto } from "../../api/dtos/clientes";
import { useEstadoOrden } from "../../api/queryFunctions/configuracion";

interface ConfiguracionCorreoProps {
  correos: CreateCorreoDto[];
  onCorreosChange: (correos: CreateCorreoDto[]) => void;
}

interface CorreoInput {
  nombre: string;
  apellido: string;
  correo: string;
  estados: number[];
}

export function ConfiguracionCorreo({
  correos,
  onCorreosChange,
}: ConfiguracionCorreoProps) {
  const [correoInput, setCorreoInput] = useState<CorreoInput>({
    nombre: "",
    apellido: "",
    correo: "",
    estados: [],
  });
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());

  const { data: estadosOrdenServicio } = useEstadoOrden();

  const toggleEmailStates = (email: string) => {
    setExpandedEmails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(email)) {
        newSet.delete(email);
      } else {
        newSet.add(email);
      }
      return newSet;
    });
  };

  const handleAddCorreo = () => {
    // Validate required fields
    if (correoInput.nombre.trim() === "") {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    if (correoInput.apellido.trim() === "") {
      toast.error("El apellido no puede estar vacío");
      return;
    }

    if (correoInput.correo.trim() === "") {
      toast.error("El correo electrónico no puede estar vacío");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoInput.correo)) {
      toast.error("Por favor ingrese un correo electrónico válido");
      return;
    }

    // Check if email already exists
    if (correos.some((c) => c.email === correoInput.correo.trim())) {
      toast.error("Este correo electrónico ya está configurado");
      return;
    }

    const newCorreo: CreateCorreoDto = {
      email: correoInput.correo.trim(),
      nombre: correoInput.nombre.trim(),
      apellido: correoInput.apellido.trim(),
      estados: [],
    };

    onCorreosChange([...correos, newCorreo]);
    setCorreoInput({
      nombre: "",
      apellido: "",
      correo: "",
      estados: [],
    });
  };

  const handleRemoveCorreo = (email: string) => {
    onCorreosChange(correos.filter((c) => c.email !== email));
  };

  const handleEstadoChange = (
    email: string,
    idEstadoOrdenServicio: number,
    checked: boolean,
  ) => {
    onCorreosChange(
      correos.map((c) =>
        c.email === email
          ? {
              ...c,
              estados: checked
                ? [...c.estados, idEstadoOrdenServicio]
                : c.estados.filter((id) => id !== idEstadoOrdenServicio),
            }
          : c,
      ),
    );
  };

  return (
    <div className="space-y-4">
      {/* Formulario para añadir correos */}
      <div className="col-span-2 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-col gap-2">
          <InputForm
            label="Primer nombre responsable*"
            placeholder="Primer nombre responsable"
            type="text"
            id="primerNombreResponsable"
            value={correoInput.nombre}
            onChange={(e) =>
              setCorreoInput({
                ...correoInput,
                nombre: e.target.value,
              })
            }
          />
          <InputForm
            label="Apellido*"
            placeholder="Apellido"
            type="text"
            id="apellido"
            value={correoInput.apellido}
            onChange={(e) =>
              setCorreoInput({
                ...correoInput,
                apellido: e.target.value,
              })
            }
          />
          <InputForm
            label="Correo*"
            placeholder="Correo"
            type="email"
            id="correo"
            value={correoInput.correo}
            onChange={(e) =>
              setCorreoInput({
                ...correoInput,
                correo: e.target.value,
              })
            }
          />
          <p className="text-sm text-gray-500">
            Presione el botón de "Añadir" para agregar un nuevo correo a la
            lista
          </p>
          <div className="flex justify-end">
            <ButtonAction
              Icon={PlusIcon}
              label="Añadir"
              type="button"
              onClick={handleAddCorreo}
            />
          </div>
        </div>
      </div>

      {/* Lista de correos configurados */}
      <div className="mt-4 flex flex-col gap-2">
        {correos.length > 0 &&
          correos.map((correo) => (
            <div
              key={correo.email}
              className="flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50 px-4 py-4"
            >
              <div className="flex flex-row items-center justify-between gap-2">
                <p className="text-sm font-medium text-gray-900">
                  {correo.email}
                </p>
                <div className="space-x-2">
                  <button
                    type="button"
                    className="cursor-pointer rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-200"
                    onClick={() => toggleEmailStates(correo.email)}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        expandedEmails.has(correo.email) ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <button
                    type="button"
                    className="cursor-pointer rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-200 hover:text-red-500"
                    onClick={() => handleRemoveCorreo(correo.email)}
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className={expandedEmails.has(correo.email) ? "" : "hidden"}>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Estados de Notificación
                  <span className="ml-1 text-xs text-gray-500">
                    (
                    {
                      correo.estados.length
                      // + (correo.estadosApp?.length || 0)}{" "}
                    }{" "}
                    seleccionados)
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  {estadosOrdenServicio?.data?.data
                    ?.filter((estado) => estado.estado) // Solo estados activos
                    .map((estado) => (
                      <div
                        key={estado.nombre}
                        className="flex items-start space-x-2 rounded-md p-2 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          id={`estado-${correo.email}-${estado.idEstadoOrdenServicio}`}
                          checked={(correo.estados || []).includes(
                            estado.idEstadoOrdenServicio,
                          )}
                          onChange={(e) =>
                            handleEstadoChange(
                              correo.email,
                              estado.idEstadoOrdenServicio,
                              e.target.checked,
                              // false,
                            )
                          }
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`estado-${correo.email}-${estado.idEstadoOrdenServicio}`}
                            className="cursor-pointer text-sm font-medium text-gray-700 capitalize"
                          >
                            {estado.nombre}
                          </label>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {estado.descripcion}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
                {/* {isAppStates && ( */}
                {/* <>
                    <hr className="mt-2 border-b border-gray-200" />
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {estadosApp?.data?.map((estado) => (
                        <div
                          key={estado.nombre}
                          className="flex items-start space-x-2 rounded-md p-2 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            id={`estadoApp-${correo.email}-${estado.nombre}`}
                            checked={(correo.estadosApp || []).includes(
                              estado.nombre,
                            )}
                            onChange={(e) =>
                              handleEstadoChange(
                                correo.email,
                                estado.nombre,
                                e.target.checked,
                                true,
                              )
                            }
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`estadoApp-${correo.email}-${estado.nombre}`}
                              className="cursor-pointer text-sm font-medium text-gray-700 capitalize"
                            >
                              {estado.nombre}
                            </label>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {estado.descripcion}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </> */}
                {/* )} */}
              </div>
            </div>
          ))}
        {correos.length === 0 && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-2 py-10 text-center text-sm text-gray-500">
            No hay correos configurados
          </div>
        )}
      </div>
    </div>
  );
}
