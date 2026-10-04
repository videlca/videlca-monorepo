import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, type KeyboardEvent } from "react";
import { toast } from "sonner";

interface EmailsInputProps {
  emails: string[];
  defaultEmails: string[];
  setEmails: (emails: string[]) => void;
  placeholder?: string;
}

const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const EmailsInput = ({
  emails,
  defaultEmails,
  setEmails,
  placeholder = "Ingrese un correo y presione Enter",
}: EmailsInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addEmail();
    }
  };

  const addEmail = (email?: string) => {
    const emailToAdd = email || inputValue.trim();

    if (!emailToAdd) {
      toast.error("Ingrese un correo electrónico");
      return;
    }

    if (!validateEmail(emailToAdd)) {
      toast.error("Ingrese un correo electrónico válido");
      return;
    }

    if (emails.includes(emailToAdd)) {
      toast.info("Este correo ya fue agregado");
      return;
    }

    setEmails([...emails, emailToAdd]);
    setInputValue("");
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex gap-2">
        <TextField
          type="email"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <Button variant="contained" onClick={() => addEmail(inputValue.trim())}>
          Agregar
        </Button>
      </div>

      <Typography variant="body2" color="text.secondary">
        Seleccione alguno de los correos configurados en la sección de
        configuración de correos predeterminados. Correos disponibles:
      </Typography>
      <div className="flex flex-wrap gap-2">
        {defaultEmails.map((email) => (
          <Chip
            key={email}
            label={email}
            color="primary"
            variant="outlined"
            onClick={() => addEmail(email.trim())}
          />
        ))}
      </div>
      <Divider sx={{ my: 1 }} />

      {emails.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {emails.map((email) => (
            <Chip
              key={email}
              label={email}
              color="primary"
              onDelete={() => setEmails(emails.filter((e) => e !== email))}
            />
          ))}
        </div>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No hay correos agregados. Ingrese un correo y presione Enter o haga
          clic en Agregar.
        </Typography>
      )}
    </div>
  );
};
