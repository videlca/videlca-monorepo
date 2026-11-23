import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  DestinatarioCreacion,
  DestinatariosCreacionOrden,
} from "../../../api/types/orden-servicio";
import { comprimirImagen } from "../../../utils/comprimirImagen";

export const MAX_IMAGENES_CORREO = 5;
// Igual que el backend: el servicio de correo no acepta mensajes de mas de ~4 MB (se deja margen para el PDF)
export const MAX_BYTES_IMAGENES_CORREO = 3 * 1024 * 1024;
export const MAX_CARACTERES_MENSAJE = 5000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizarEmail = (email: string) => email.trim().toLowerCase();

const formatoMB = (bytes: number) =>
  `${(bytes / (1024 * 1024)).toLocaleString("es-CO", { maximumFractionDigits: 1 })} MB`;

// Todos los correos de los grupos (para marcarlos todos al cargar)
export const emailsDestinatarios = (d: DestinatariosCreacionOrden | undefined) =>
  [...(d?.puesto ?? []), ...(d?.cliente ?? []), ...(d?.aplicacion ?? [])].map((x) =>
    normalizarEmail(x.email),
  );

// Miniatura de una imagen adjunta (la URL temporal se libera al quitarla)
const MiniaturaImagen = ({ archivo, onQuitar }: { archivo: File; onQuitar: () => void }) => {
  // La URL temporal se crea y se libera en el mismo efecto (con useMemo, el doble montaje de React en desarrollo
  // la liberaba antes de mostrarla y la miniatura salia rota)
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const nueva = URL.createObjectURL(archivo);
    setUrl(nueva);
    return () => URL.revokeObjectURL(nueva);
  }, [archivo]);
  if (!url) return null;
  return (
    <div className="relative">
      <img
        src={url}
        alt={archivo.name}
        className="h-28 w-28 rounded-md border border-gray-200 object-cover"
      />
      <IconButton
        size="small"
        aria-label={`Quitar ${archivo.name}`}
        onClick={onQuitar}
        sx={{
          position: "absolute",
          top: 4,
          right: 4,
          bgcolor: "rgba(255,255,255,0.9)",
          "&:hover": { bgcolor: "#fff" },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      <Typography variant="caption" color="text.secondary" component="div" sx={{ width: 112 }} noWrap>
        {formatoMB(archivo.size)}
      </Typography>
    </div>
  );
};

// Grupo de destinatarios con casillas
const GrupoDestinatarios = ({
  titulo,
  vacio,
  destinatarios,
  seleccionados,
  onToggle,
}: {
  titulo: string;
  vacio: string;
  destinatarios: DestinatarioCreacion[];
  seleccionados: string[];
  onToggle: (email: string) => void;
}) => (
  <div>
    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
      {titulo}
    </Typography>
    {destinatarios.length === 0 ? (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
        {vacio}
      </Typography>
    ) : (
      <div className="flex flex-col">
        {destinatarios.map((d) => (
          <FormControlLabel
            key={d.email}
            control={
              <Checkbox
                size="small"
                checked={seleccionados.includes(normalizarEmail(d.email))}
                onChange={() => onToggle(normalizarEmail(d.email))}
              />
            }
            label={
              <Typography variant="body2">
                {d.email}
                {d.nombre && (
                  <Typography component="span" variant="body2" color="text.secondary">
                    {" "}
                    · {d.nombre}
                  </Typography>
                )}
              </Typography>
            }
          />
        ))}
      </div>
    )}
  </div>
);

// PASO FINAL DE CREAR UNA ORDEN: mensaje adicional, imagenes y destinatarios del correo de creacion. Nada de esto se
// guarda: solo viaja en el correo. El correo es obligatorio (al menos un destinatario) y se envia antes de confirmar
// la orden, asi que si falla la orden no queda creada
export const MensajeCorreoOrden = ({
  destinatarios,
  isLoading,
  isError,
  esPuesto,
  mensaje,
  setMensaje,
  imagenes,
  setImagenes,
  seleccionados,
  setSeleccionados,
  extras,
  setExtras,
}: {
  destinatarios: DestinatariosCreacionOrden | undefined;
  isLoading: boolean;
  isError: boolean;
  esPuesto: boolean;
  mensaje: string;
  setMensaje: (mensaje: string) => void;
  imagenes: File[];
  setImagenes: (imagenes: File[]) => void;
  seleccionados: string[];
  setSeleccionados: (emails: string[]) => void;
  extras: string[];
  setExtras: (emails: string[]) => void;
}) => {
  const inputImagenesRef = useRef<HTMLInputElement>(null);
  const [procesandoImagenes, setProcesandoImagenes] = useState(false);
  const [nuevoCorreo, setNuevoCorreo] = useState("");

  const bytesImagenes = imagenes.reduce((acc, img) => acc + img.size, 0);
  const totalSeleccionados = seleccionados.length;

  const toggle = (email: string) =>
    setSeleccionados(
      seleccionados.includes(email)
        ? seleccionados.filter((e) => e !== email)
        : [...seleccionados, email],
    );

  const agregarImagenes = async (archivos: FileList | null) => {
    if (!archivos?.length) return;
    const lista = Array.from(archivos);
    const noImagenes = lista.filter((a) => !a.type.startsWith("image/"));
    if (noImagenes.length) {
      toast.error("Solo se pueden adjuntar imágenes");
    }
    const imagenesNuevas = lista.filter((a) => a.type.startsWith("image/"));
    const espacio = MAX_IMAGENES_CORREO - imagenes.length;
    if (imagenesNuevas.length > espacio) {
      toast.error(`Se pueden adjuntar máximo ${MAX_IMAGENES_CORREO} imágenes`);
    }
    const aProcesar = imagenesNuevas.slice(0, Math.max(0, espacio));
    if (!aProcesar.length) return;

    setProcesandoImagenes(true);
    try {
      const comprimidas = await Promise.all(aProcesar.map((a) => comprimirImagen(a)));
      const resultado = [...imagenes];
      let total = bytesImagenes;
      for (const img of comprimidas) {
        if (total + img.size > MAX_BYTES_IMAGENES_CORREO) {
          toast.error(
            `"${img.name}" no se agregó: las imágenes superarían los ${formatoMB(MAX_BYTES_IMAGENES_CORREO)} que admite el correo`,
          );
          continue;
        }
        resultado.push(img);
        total += img.size;
      }
      setImagenes(resultado);
    } finally {
      setProcesandoImagenes(false);
    }
  };

  const agregarCorreo = () => {
    const email = normalizarEmail(nuevoCorreo);
    if (!email) return;
    if (!EMAIL_REGEX.test(email)) {
      toast.error("Escriba un correo válido");
      return;
    }
    const yaExiste = [...emailsDestinatarios(destinatarios), ...extras].includes(email);
    if (yaExiste) {
      // Si ya esta en la lista, solo se marca
      if (!seleccionados.includes(email)) setSeleccionados([...seleccionados, email]);
      toast.info("Ese correo ya está en la lista; quedó marcado");
      setNuevoCorreo("");
      return;
    }
    setExtras([...extras, email]);
    setSeleccionados([...seleccionados, email]);
    setNuevoCorreo("");
  };

  const quitarExtra = (email: string) => {
    setExtras(extras.filter((e) => e !== email));
    setSeleccionados(seleccionados.filter((e) => e !== email));
  };

  return (
    <div className="flex flex-col gap-5">
      <Alert severity="info">
        Al crear la orden se envía un correo con el PDF de la orden, el mensaje y
        las imágenes. El envío es obligatorio: si el correo no se puede enviar,
        la orden <b>no</b> se crea. El mensaje y las imágenes no se guardan.
      </Alert>

      {/* MENSAJE ADICIONAL */}
      <Paper variant="outlined" className="flex flex-col gap-2 p-4">
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Mensaje adicional
        </Typography>
        <TextField
          id="mensajeCorreoOrden"
          multiline
          minRows={4}
          placeholder="Ej: Se envía al vigilante Juan Pérez, llegará a las 6:00 a. m. y se retira a las 6:00 p. m."
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value.slice(0, MAX_CARACTERES_MENSAJE))}
          helperText={`Opcional · ${mensaje.length} de ${MAX_CARACTERES_MENSAJE} caracteres`}
        />
      </Paper>

      {/* IMAGENES */}
      <Paper variant="outlined" className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Imágenes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Opcional · {imagenes.length} de {MAX_IMAGENES_CORREO} ·{" "}
              {formatoMB(bytesImagenes)} de {formatoMB(MAX_BYTES_IMAGENES_CORREO)}. Se
              reducen automáticamente para el correo.
            </Typography>
          </div>
          <Button
            variant="outlined"
            startIcon={
              procesandoImagenes ? <CircularProgress size={16} /> : <AddPhotoAlternateOutlinedIcon />
            }
            disabled={procesandoImagenes || imagenes.length >= MAX_IMAGENES_CORREO}
            onClick={() => inputImagenesRef.current?.click()}
          >
            {procesandoImagenes ? "Procesando..." : "Adjuntar imágenes"}
          </Button>
          <input
            ref={inputImagenesRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              void agregarImagenes(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
        {imagenes.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {imagenes.map((img, i) => (
              <MiniaturaImagen
                key={`${img.name}-${img.lastModified}-${i}`}
                archivo={img}
                onQuitar={() => setImagenes(imagenes.filter((_, j) => j !== i))}
              />
            ))}
          </div>
        )}
      </Paper>

      {/* DESTINATARIOS */}
      <Paper variant="outlined" className="flex flex-col gap-4 p-4">
        <div>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Destinatarios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Desmarque a quien no deba recibir el correo o agregue otros correos.
          </Typography>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2">
            <CircularProgress size={18} />
            <Typography variant="body2">Cargando correos...</Typography>
          </div>
        ) : isError ? (
          <Alert severity="error">
            No se pudieron cargar los correos asociados. Puede agregar los correos
            manualmente.
          </Alert>
        ) : (
          <>
            {esPuesto && (
              <GrupoDestinatarios
                titulo="Correos del puesto"
                vacio="El puesto no tiene correos asociados"
                destinatarios={destinatarios?.puesto ?? []}
                seleccionados={seleccionados}
                onToggle={toggle}
              />
            )}
            <GrupoDestinatarios
              titulo="Correos del cliente"
              vacio={
                esPuesto
                  ? "El cliente no tiene otros correos además de los del puesto"
                  : "El cliente no tiene correos asociados"
              }
              destinatarios={destinatarios?.cliente ?? []}
              seleccionados={seleccionados}
              onToggle={toggle}
            />
            <GrupoDestinatarios
              titulo='Correos de aplicación ("creación orden de servicio")'
              vacio='No hay correos de aplicación con el estado "creación orden de servicio"'
              destinatarios={destinatarios?.aplicacion ?? []}
              seleccionados={seleccionados}
              onToggle={toggle}
            />
          </>
        )}

        {extras.length > 0 && (
          <GrupoDestinatarios
            titulo="Correos agregados"
            vacio=""
            destinatarios={extras.map((email) => ({ email, nombre: null }))}
            seleccionados={seleccionados}
            onToggle={quitarExtra}
          />
        )}

        <div className="flex flex-wrap items-start gap-2">
          <TextField
            id="nuevoCorreoOrden"
            size="small"
            type="email"
            placeholder="otro@correo.com"
            value={nuevoCorreo}
            onChange={(e) => setNuevoCorreo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                agregarCorreo();
              }
            }}
            sx={{ minWidth: 280, flex: 1 }}
          />
          <Button
            variant="outlined"
            startIcon={<PersonAddAlt1OutlinedIcon />}
            onClick={agregarCorreo}
          >
            Agregar correo
          </Button>
        </div>

        {totalSeleccionados === 0 ? (
          <Alert severity="warning">
            Seleccione o agregue al menos un correo: la orden solo se crea si se
            envía el correo de creación.
          </Alert>
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            El correo se enviará a {totalSeleccionados}{" "}
            {totalSeleccionados === 1 ? "correo" : "correos"}.
          </Typography>
        )}
      </Paper>
    </div>
  );
};
