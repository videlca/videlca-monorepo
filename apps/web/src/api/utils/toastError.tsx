import { toast } from "sonner";
import React from "react";

/**
 * Displays an error toast that handles both single string and array error messages.
 * When the message is an array (e.g. validation errors from the API),
 * it shows them as a bullet-point list inside a single toast.
 *
 * @param message - A string, an array of strings, or undefined/null
 * @param fallback - Fallback message if message is empty/undefined
 */
export const showErrorToast = (
  message: string | string[] | undefined | null,
  fallback: string = "Ha ocurrido un error"
): void => {
  if (!message || (Array.isArray(message) && message.length === 0)) {
    toast.error(fallback);
    return;
  }

  if (Array.isArray(message)) {
    if (message.length === 1) {
      toast.error(message[0]);
      return;
    }

    toast.error("Se encontraron los siguientes errores:", {
      description: React.createElement(
        "ul",
        { style: { margin: 0, paddingLeft: "1.2em", listStyleType: "disc" } },
        message.map((msg, i) =>
          React.createElement("li", { key: i, style: { marginBottom: i < message.length - 1 ? "2px" : 0 } }, msg)
        )
      ),
      duration: 6000,
    });
  } else {
    toast.error(message);
  }
};
