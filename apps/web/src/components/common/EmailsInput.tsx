import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

interface EmailsInputProps {
  emails: string[];
  setEmails: (emails: string[]) => void;
  placeholder?: string;
}

export const EmailsInput = ({
  emails,
  setEmails,
  placeholder = "Ingrese un correo y presione Enter",
}: EmailsInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addEmail();
    }
  };

  const addEmail = () => {
    const email = inputValue.trim();

    if (!email) {
      return;
    }

    if (!validateEmail(email)) {
      setError("Ingrese un correo electrónico válido");
      return;
    }

    if (emails.includes(email)) {
      setError("Este correo ya fue agregado");
      return;
    }

    setEmails([...emails, email]);
    setInputValue("");
    setError("");
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter((email) => email !== emailToRemove));
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex gap-2">
        <input
          type="email"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={addEmail}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
        >
          Agregar
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {emails.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {emails.map((email) => (
            <div
              key={email}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-sm text-blue-700"
            >
              <span>{email}</span>
              <button
                type="button"
                onClick={() => removeEmail(email)}
                className="rounded-full transition-colors hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                aria-label={`Eliminar ${email}`}
              >
                <X size={14} className="text-blue-700" />
              </button>
            </div>
          ))}
        </div>
      )}

      {emails.length === 0 && (
        <p className="text-sm text-gray-500">
          No hay correos agregados. Ingrese un correo y presione Enter o haga
          clic en Agregar.
        </p>
      )}
    </div>
  );
};
