import { useState } from "react";
import { EmailsInput } from "../../common/EmailsInput";
import { SimpleModal } from "../../common/SimpleModal";
import type { CorreosDto, EnviarCorreoDto } from "../../../api/dtos/common";
import type { ApiResponse } from "../../../api/types";
import type { UseMutateFunction } from "@tanstack/react-query";
import { useCorreosDefault } from "../../../api/queryFunctions/configuracion/correos-defecto";

type MutationWithId = UseMutateFunction<
  ApiResponse<any>,
  Error,
  { id: number; data: EnviarCorreoDto },
  unknown
>;

type MutationWithoutId = UseMutateFunction<
  ApiResponse<any>,
  Error,
  EnviarCorreoDto,
  unknown
>;

interface EnvioCorreosProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  envioCorreoPending: boolean;
  id?: number;
  mutationEmail: MutationWithId | MutationWithoutId;
}

export const EnvioCorreos = ({
  isOpen,
  setIsOpen,
  id,
  mutationEmail,
  envioCorreoPending,
}: EnvioCorreosProps) => {
  const [emails, setEmails] = useState<CorreosDto[]>([]);

  const { data: correosDefault } = useCorreosDefault();
  const correos = correosDefault?.data?.map((correo) => correo.email) || [];

  const handleSendEmail = () => {
    const correoData: EnviarCorreoDto = { correos: emails };
    const options = {
      onSuccess: () => {
        setIsOpen(false);
        setEmails([]);
      },
    };

    if (id !== undefined) {
      (mutationEmail as MutationWithId)({ id, data: correoData }, options);
    } else {
      (mutationEmail as MutationWithoutId)(correoData, options);
    }
  };

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false);
        setEmails([]);
      }}
      title="Ingresar correos para enviar el documento"
      size="xl"
    >
      <div className="space-y-6">
        <EmailsInput
          defaultEmails={correos}
          emails={emails.map((email) => email.email)}
          setEmails={(emails) =>
            setEmails(emails.map((email) => ({ email: email })))
          }
          placeholder="Ingrese un correo electrónico"
        />

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            onClick={() => {
              setIsOpen(false);
              setEmails([]);
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={emails.length === 0 || envioCorreoPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
            onClick={() => {
              handleSendEmail();
            }}
          >
            Enviar
          </button>
        </div>
      </div>
    </SimpleModal>
  );
};
