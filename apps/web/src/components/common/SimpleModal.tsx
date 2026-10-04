import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import type { ReactNode } from "react";

interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  clickOutsideClose?: boolean;
}

const widths = {
  sm: 384,
  md: 448,
  lg: 512,
  xl: 672,
  "2xl": 768,
  "3xl": 896,
  "4xl": 1024,
};

// keepMounted conserva el estado de los hijos al cerrar, como el modal anterior (oculto con CSS)
export const SimpleModal = ({
  isOpen,
  onClose,
  children,
  title,
  size = "md",
  clickOutsideClose = false,
}: SimpleModalProps) => (
  <Dialog
    open={isOpen}
    onClose={clickOutsideClose ? onClose : undefined}
    keepMounted
    fullWidth
    maxWidth={false}
    slotProps={{ paper: { sx: { maxWidth: widths[size], maxHeight: "85vh" } } }}
  >
    {title && (
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        {title}
        <IconButton aria-label="Cerrar" onClick={onClose} edge="end">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
    )}
    <DialogContent dividers={!!title} sx={{ p: 3 }}>
      {children}
    </DialogContent>
  </Dialog>
);
