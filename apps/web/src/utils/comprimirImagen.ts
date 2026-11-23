// REDUCE UNA IMAGEN EN EL NAVEGADOR ANTES DE ADJUNTARLA AL CORREO: lado mayor de maximo `ladoMaximo` px y JPEG con
// la calidad indicada. El servicio de correo no acepta mensajes de mas de ~4 MB, y una foto de celular pesa varios MB.
// Si la imagen ya es pequeña o no se puede procesar, se devuelve tal cual (el backend valida el tamaño final)
export const comprimirImagen = async (
  archivo: File,
  ladoMaximo = 1600,
  calidad = 0.8,
): Promise<File> => {
  // Los GIF pueden ser animados: al pasarlos por canvas se perderia la animacion
  if (archivo.type === "image/gif") return archivo;

  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);

    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext("2d");
    if (!ctx) return archivo;
    // Fondo blanco: las PNG con transparencia quedarian negras en JPEG
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(bitmap, 0, 0, ancho, alto);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", calidad),
    );
    if (!blob || blob.size >= archivo.size) return archivo;

    const nombre = archivo.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], nombre, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return archivo;
  }
};
