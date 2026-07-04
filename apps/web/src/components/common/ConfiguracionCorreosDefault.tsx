import { useEffect, useState } from "react";
import { ButtonAction } from "./ButtonAction";
import { InputForm } from "./InputForm";
import { CheckIcon, ChevronDown, PlusIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import type { CreateCorreoDefaultDto } from "../../api/dtos/configuracion";
import { useEstadoOrden } from "../../api/queryFunctions/configuracion";
import { useEstadosApp } from "../../api/queryFunctions/configuracion/estado-app";
import { useCreateCorreoDefault } from "../../api/queryFunctions/configuracion/correos-defecto";

export function ConfiguracionCorreosDefault({
  setIsOpenAddCorreoDefault,
  correosPendientes,
  setCorreosPendientes: _setCorreosPendientes,
  onSaveSuccess: _onSaveSuccess,
}: {
  setIsOpenAddCorreoDefault: (isOpen: boolean) => void;
  correosPendientes: CreateCorreoDefaultDto[];
  setCorreosPendientes: (correos: CreateCorreoDefaultDto[]) => void;
  onSaveSuccess: () => void;
}) {
  const [correos, setCorreos] =
    useState<CreateCorreoDefaultDto[]>(correosPendientes);
  const [correoInput, setCorreoInput] = useState<CreateCorreoDefaultDto>({
    descripcion: "",
    email: "",
    estados: [],
    estadosApp: [],
  });
  // Auto-expand all existing emails to show their configured states
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(
    new Set(correosPendientes.map((c) => c.email)),
  );

  const { data: estadosOrdenServicio } = useEstadoOrden();
  const { data: estadosApp } = useEstadosApp();
  const { mutate: createCorreoDefault, isPending: isCreatingCorreoDefault } =
    useCreateCorreoDefault();

  // Sync correos state when correosPendientes changes
  useEffect(() => {
    setCorreos(correosPendientes);
    setExpandedEmails(new Set(correosPendientes.map((c) => c.email)));
  }, [correosPendientes]);

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
    if (correoInput.descripcion.trim() === "") {
      toast.error("La descripción no puede estar vacía");
      return;
    }

    if (correoInput.email.trim() === "") {
      toast.error("El correo electrónico no puede estar vacío");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoInput.email)) {
      toast.error("Por favor ingrese un correo electrónico válido");
      return;
    }

    // Check if email already exists
    if (
      correos?.some(
        (correoGroup) => correoGroup.email === correoInput.email.trim(),
      )
    ) {
      toast.error("Este correo electrónico ya está configurado");
      return;
    }

    const newCorreo: CreateCorreoDefaultDto = {
      email: correoInput.email.trim(),
      descripcion: correoInput.descripcion.trim(),
      estados: [],
      estadosApp: [],
    };

    setCorreos([...correos, newCorreo]);
    // Auto-expand the newly added email
    setExpandedEmails((prev) => new Set([...prev, newCorreo.email]));
    setCorreoInput({
      descripcion: "",
      email: "",
      estados: [],
      estadosApp: [],
    });
  };

  const handleConfirmAndSaveChanges = () => {
    createCorreoDefault(
      {
        correos: [...correos],
      },
      {
        onSuccess: () => {
          setCorreos([]);
          setCorreoInput({
            descripcion: "",
            email: "",
            estados: [],
            estadosApp: [],
          });
          setExpandedEmails(new Set());
          setIsOpenAddCorreoDefault(false);
        },
      },
    );
  };

  const handleRemoveCorreo = (email: string) => {
    setCorreos(correos.filter((correoGroup) => correoGroup.email !== email));
    // Also remove from expanded state
    setExpandedEmails((prev) => {
      const newSet = new Set(prev);
      newSet.delete(email);
      return newSet;
    });
  };

  const handleEstadoChange = (
    email: string,
    idEstadoOrdenServicio: number,
    checked: boolean,
  ) => {
    setCorreos(
      correos?.map((correoGroup) =>
        correoGroup.email === email
          ? {
            ...correoGroup,
            estados: checked
              ? [...(correoGroup.estados || []), idEstadoOrdenServicio]
              : (correoGroup.estados || []).filter(
                (id) => id !== idEstadoOrdenServicio,
              ),
          }
          : correoGroup,
      ),
    );
  };

  const handleEstadoAppChange = (
    email: string,
    idEstadoApp: number,
    checked: boolean,
  ) => {
    setCorreos(
      correos.map((correoGroup) =>
        correoGroup.email === email
          ? {
            ...correoGroup,
            estadosApp: checked
              ? [...(correoGroup.estadosApp || []), idEstadoApp]
              : (correoGroup.estadosApp || []).filter(
                (id) => id !== idEstadoApp,
              ),
          }
          : correoGroup,
      ),
    );
  };

  return (
    <div className="space-y-4">
      {/* Formulario para añadir correos */}
      <div className="col-span-2 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-col gap-2">
          <InputForm
            label="Descripción*"
            placeholder="Descripción del correo"
            type="text"
            id="descripcion"
            value={correoInput.descripcion}
            onChange={(e) =>
              setCorreoInput({
                ...correoInput,
                descripcion: e.target.value,
              })
            }
          />
          <InputForm
            label="Correo*"
            placeholder="Correo electrónico"
            type="email"
            id="email"
            value={correoInput.email}
            onChange={(e) =>
              setCorreoInput({
                ...correoInput,
                email: e.target.value,
              })
            }
          />
          <p className="text-sm text-gray-500">
            Presione el botón de "Añadir" para agregar un nuevo correo a la
            lista
          </p>
          <div className="flex justify-end gap-2">
            <ButtonAction
              Icon={PlusIcon}
              label="Añadir"
              type="button"
              onClick={handleAddCorreo}
            />
            <ButtonAction
              Icon={CheckIcon}
              label="Confirmar y guardar cambios"
              type="button"
              onClick={handleConfirmAndSaveChanges}
              disabled={isCreatingCorreoDefault}
            />
          </div>
        </div>
      </div>

      {/* Lista de correos configurados */}
      <div className="mt-4 flex h-full flex-col gap-2 overflow-y-auto">
        {correos?.length > 0 &&
          correos
            .flatMap((correoGroup) => correoGroup)
            .map((correo) => (
              <div
                key={correo.email}
                className="flex flex-col gap-2 rounded-md border border-gray-200 bg-gray-50 px-4 py-4"
              >
                <div className="flex flex-row items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {correo.email}
                    </p>
                    <p className="text-xs text-gray-500">
                      {correo.descripcion}
                    </p>
                  </div>
                  <div className="space-x-2">
                    <button
                      type="button"
                      className="cursor-pointer rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-200"
                      onClick={() => toggleEmailStates(correo.email)}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${expandedEmails.has(correo.email) ? "rotate-180" : ""
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
                <div
                  className={expandedEmails.has(correo.email) ? "" : "hidden"}
                >
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Estados de Notificación
                    <span className="ml-1 text-xs text-gray-500">
                      (
                      {(correo.estados || []).length +
                        (correo.estadosApp || []).length}{" "}
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
                            id={`estado-${correo.email}-${estado.nombre}-${estado.idEstadoOrdenServicio}`}
                            checked={(correo.estados || []).includes(
                              estado.idEstadoOrdenServicio,
                            )}
                            onChange={(e) =>
                              handleEstadoChange(
                                correo.email,
                                estado.idEstadoOrdenServicio,
                                e.target.checked,
                              )
                            }
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`estado-${correo.email}-${estado.nombre}-${estado.idEstadoOrdenServicio}`}
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
                  <>
                    <hr className="mt-2 border-b border-gray-200" />
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {estadosApp?.data?.data?.map((estado) => (
                        <div
                          key={estado.nombre}
                          className="flex items-start space-x-2 rounded-md p-2 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            id={`estadoApp-${correo.email}-${estado.nombre}-${estado.idEstadoApp}`}
                            checked={(correo.estadosApp || []).includes(
                              estado.idEstadoApp,
                            )}
                            onChange={(e) =>
                              handleEstadoAppChange(
                                correo.email,
                                estado.idEstadoApp,
                                e.target.checked,
                              )
                            }
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`estadoApp-${correo.email}-${estado.nombre}-${estado.idEstadoApp}`}
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
                  </>
                </div>
              </div>
            ))}
        {(correos?.length === 0 ||
          correos.flatMap((correoGroup) => correoGroup).length === 0) && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-2 py-10 text-center text-sm text-gray-500">
              No hay correos configurados
            </div>
          )}
      </div>
    </div>
  );
}
