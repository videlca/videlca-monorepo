import { createTheme } from "@mui/material/styles";
import { esES as materialEsES } from "@mui/material/locale";
import { esES as pickersEsES } from "@mui/x-date-pickers/locales";

const gray = {
  50: "#f9fafb",
  100: "#f3f4f6",
  200: "#e5e7eb",
  300: "#d1d5db",
  500: "#6b7280",
  600: "#4b5563",
  700: "#374151",
  900: "#111827",
};

export const theme = createTheme(
  {
    palette: {
      primary: { main: "#2563eb", dark: "#1d4ed8", light: "#3b82f6" },
      secondary: { main: gray[600], dark: gray[700], light: gray[500] },
      error: { main: "#dc2626" },
      warning: { main: "#d97706" },
      success: { main: "#16a34a" },
      info: { main: "#0284c7" },
      background: { default: gray[50], paper: "#ffffff" },
      text: { primary: gray[900], secondary: gray[500] },
      divider: gray[200],
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: '"Inter Variable", "Inter", system-ui, sans-serif',
      fontSize: 14,
      h1: { fontSize: "1.875rem", fontWeight: 700 },
      h2: { fontSize: "1.5rem", fontWeight: 700 },
      h3: { fontSize: "1.25rem", fontWeight: 600 },
      h4: { fontSize: "1.125rem", fontWeight: 600 },
      h5: { fontSize: "1rem", fontWeight: 600 },
      h6: { fontSize: "0.875rem", fontWeight: 600 },
      body1: { fontSize: "0.875rem" },
      button: { textTransform: "none", fontWeight: 500 },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { whiteSpace: "nowrap" } },
      },
      MuiIconButton: { defaultProps: { size: "small" } },
      MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
      MuiFormControl: { defaultProps: { size: "small" } },
      MuiAutocomplete: { defaultProps: { size: "small" } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { backgroundColor: "#ffffff" },
          notchedOutline: { borderColor: gray[300] },
        },
      },
      MuiInputLabel: { styleOverrides: { root: { fontWeight: 500 } } },
      MuiFormControlLabel: {
        styleOverrides: { label: { fontSize: "0.875rem", fontWeight: 500 } },
      },
      MuiCard: { defaultProps: { variant: "outlined" } },
      MuiDialog: {
        styleOverrides: { paper: { borderRadius: 12 } },
      },
      MuiDialogTitle: {
        styleOverrides: { root: { fontSize: "1.125rem", fontWeight: 600 } },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { borderColor: gray[200] },
          head: {
            backgroundColor: gray[50],
            color: gray[500],
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          },
        },
      },
      MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
      MuiTab: {
        styleOverrides: { root: { textTransform: "none", fontWeight: 600 } },
      },
      MuiMenuItem: { styleOverrides: { root: { fontSize: "0.875rem" } } },
      MuiTooltip: { defaultProps: { arrow: true } },
    },
  },
  materialEsES,
  pickersEsES,
);
