import { useState } from "react";
import { EmailsInput } from "../../common/EmailsInput";
import { SimpleModal } from "../../common/SimpleModal";
import type { CorreosDto, EnviarCorreoDto } from "../../../api/dtos/common";
import type { ApiResponse } from "../../../api/types";
import type { UseMutateFunction } from "@tanstack/react-query";

export const EnvioCorreos = ({
  isOpen,
  setIsOpen,
  id,
  mutationEmail,
}: {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  id: number;
  mutationEmail: UseMutateFunction<
    ApiResponse<any>,
    Error,
    {
      id: number;
      data: EnviarCorreoDto;
    },
    unknown
  >;
}) => {
  const [emails, setEmails] = useState<CorreosDto[]>([]);

  const handleSendEmail = (idOrdenServicio: number) => {
    mutationEmail(
      {
        id: idOrdenServicio,
        data: {
          correos: emails,
        },
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          setEmails([]);
        },
      },
    );
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
            disabled={emails.length === 0}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
            onClick={() => {
              handleSendEmail(id);
            }}
          >
            Enviar
          </button>
        </div>
      </div>
    </SimpleModal>
  );
};
