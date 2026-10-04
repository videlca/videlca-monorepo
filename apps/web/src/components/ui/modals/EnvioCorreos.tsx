import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import Button from "@mui/material/Button";
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
  const correos = correosDefault?.data?.data?.map((correo) => correo.email) || [];

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
      <div className="flex flex-col gap-6">
        <EmailsInput
          defaultEmails={correos}
          emails={emails.map((email) => email.email)}
          setEmails={(emails) =>
            setEmails(emails.map((email) => ({ email: email })))
          }
          placeholder="Ingrese un correo electrónico"
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => {
              setIsOpen(false);
              setEmails([]);
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<SendOutlinedIcon />}
            disabled={emails.length === 0}
            loading={envioCorreoPending}
            onClick={() => {
              handleSendEmail();
            }}
          >
            Enviar
          </Button>
        </div>
      </div>
    </SimpleModal>
  );
};
