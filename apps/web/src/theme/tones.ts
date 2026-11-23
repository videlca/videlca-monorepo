import {
  amber,
  blue,
  blueGrey,
  brown,
  green,
  grey,
  orange,
  purple,
  red,
  teal,
} from "@mui/material/colors";

// Colores semánticos compartidos por botones de texto, menús y etiquetas de estado
export type Tone =
  | "gray"
  | "blueGray"
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "amber"
  | "orange"
  | "purple"
  | "teal"
  | "brown";

export const tones: Record<Tone, { main: string; bg: string }> = {
  gray: { main: grey[700], bg: grey[100] },
  blueGray: { main: blueGrey[700], bg: blueGrey[50] },
  blue: { main: blue[700], bg: blue[50] },
  green: { main: green[700], bg: green[50] },
  red: { main: red[700], bg: red[50] },
  yellow: { main: amber[800], bg: amber[50] },
  amber: { main: amber[900], bg: amber[50] },
  orange: { main: orange[800], bg: orange[50] },
  purple: { main: purple[600], bg: purple[50] },
  teal: { main: teal[700], bg: teal[50] },
  brown: { main: brown[600], bg: brown[50] },
};
