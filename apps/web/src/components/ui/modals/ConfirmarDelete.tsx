import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Typography from "@mui/material/Typography";

export const ConfirmarDelete = ({
  isOpenDelete,
  text,
  onDelete,
  onClose,
  actionLabel = "Eliminar",
  cancelLabel = "Cerrar",
}: {
  isOpenDelete: boolean;
  text: string;
  onDelete: () => void;
  onClose: () => void;
  actionLabel?: string;
  cancelLabel?: string;
}) => (
  <Dialog open={isOpenDelete} onClose={onClose} fullWidth maxWidth="xs">
    <DialogContent sx={{ pt: 3 }}>
      <Typography variant="h4" component="p" sx={{ textAlign: "center" }}>
        {text}
      </Typography>
    </DialogContent>
    <DialogActions sx={{ justifyContent: "center", pb: 3, gap: 1 }}>
      <Button variant="outlined" color="secondary" onClick={onClose}>
        {cancelLabel}
      </Button>
      <Button variant="contained" color="error" onClick={onDelete}>
        {actionLabel}
      </Button>
    </DialogActions>
  </Dialog>
);
