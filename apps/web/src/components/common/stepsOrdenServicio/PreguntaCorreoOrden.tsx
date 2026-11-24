import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ForwardToInboxOutlinedIcon from "@mui/icons-material/ForwardToInboxOutlined";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";

interface Props {
  /** Pasa a la pantalla de observaciones, fotos y destinatarios */
  onPersonalizar: () => void;
  /** Crea la orden con el correo automatico */
  onCrear: () => void;
  creando: boolean;
}

// PASO FINAL DE CREAR UNA ORDEN: pregunta si se quieren anadir observaciones y fotos al correo de creacion. Si no,
// la orden se crea y el correo va a los destinatarios automaticos (como antes del paso de correo)
export const PreguntaCorreoOrden = ({ onPersonalizar, onCrear, creando }: Props) => (
  <div className="mx-auto flex max-w-xl flex-col items-center gap-6 py-6 text-center">
    <ForwardToInboxOutlinedIcon color="primary" sx={{ fontSize: 56 }} />
    <div className="flex flex-col gap-2">
      <Typography variant="h6" sx={{ fontWeight: 600 }}>
        ¿Desea añadir observaciones y fotos al correo de creación?
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Si no las necesita, la orden se crea y el correo se envía como siempre: a los contactos del
        puesto o del cliente que reciben avisos del estado de la orden y a los correos de aplicación
        con el estado "creación orden de servicio".
      </Typography>
    </div>

    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
      <Paper variant="outlined" className="flex flex-col items-center gap-3 p-5">
        <AddPhotoAlternateOutlinedIcon color="primary" />
        <Typography variant="body2" color="text.secondary">
          Escribir observaciones, adjuntar hasta 5 fotos y elegir los destinatarios
        </Typography>
        <Button variant="outlined" onClick={onPersonalizar} disabled={creando} fullWidth>
          Sí, continuar
        </Button>
      </Paper>
      <Paper variant="outlined" className="flex flex-col items-center gap-3 p-5">
        <CheckCircleOutlinedIcon color="success" />
        <Typography variant="body2" color="text.secondary">
          Crear la orden y enviar el correo automático con el PDF
        </Typography>
        <Button
          variant="contained"
          color="success"
          onClick={onCrear}
          loading={creando}
          loadingPosition="start"
          fullWidth
        >
          {creando ? "Creando..." : "No, crear orden"}
        </Button>
      </Paper>
    </div>
  </div>
);
