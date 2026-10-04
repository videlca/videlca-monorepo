import {
  amber,
  blue,
  green,
  grey,
  orange,
  purple,
  red,
} from "@mui/material/colors";

// Colores semánticos compartidos por botones de texto, menús y etiquetas de estado
export type Tone =
  "gray" | "blue" | "green" | "red" | "yellow" | "amber" | "orange" | "purple";

export const tones: Record<Tone, { main: string; bg: string }> = {
  gray: { main: grey[700], bg: grey[100] },
  blue: { main: blue[700], bg: blue[50] },
  green: { main: green[700], bg: green[50] },
  red: { main: red[700], bg: red[50] },
  yellow: { main: amber[800], bg: amber[50] },
  amber: { main: amber[900], bg: amber[50] },
  orange: { main: orange[800], bg: orange[50] },
  purple: { main: purple[600], bg: purple[50] },
};
