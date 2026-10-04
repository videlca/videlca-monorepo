import * as yup from "yup";

/**
 * Yup validation schema for UpdatePuestoDto.
 * Mirrors the backend class-validator rules from create-locacion.dto.ts / update-locacion.dto.ts
 */
export const updatePuestoSchema = yup.object({
  nombre: yup
    .string()
    .required("El nombre no puede estar vacío")
    .min(1, "El nombre debe tener entre 1 y 100 caracteres")
    .max(100, "El nombre debe tener entre 1 y 100 caracteres"),

  idCiudad: yup
    .number()
    .typeError("El valor del campo Ciudad no puede estar vacío")
    .min(1, "El valor del campo Ciudad no puede estar vacío")
    .required("El valor del campo Ciudad no puede estar vacío"),

  direccion: yup
    .string()
    .required("La dirección no puede estar vacía")
    .min(1, "La dirección debe tener entre 1 y 100 caracteres")
    .max(100, "La dirección debe tener entre 1 y 100 caracteres"),

  latitud: yup
    .string()
    .optional()
    .transform((value) => (!value || value.trim() === "" ? "0" : value))
    .test(
      "max-digits-latitud",
      "La latitud debe tener máximo 13 dígitos",
      (value) => {
        if (!value) return true;
        const digits = value.replace(/[^0-9]/g, "");
        return digits.length <= 13;
      }
    ),

  longitud: yup
    .string()
    .optional()
    .transform((value) => (!value || value.trim() === "" ? "0" : value))
    .test(
      "max-digits-longitud",
      "La longitud debe tener máximo 13 dígitos",
      (value) => {
        if (!value) return true;
        const digits = value.replace(/[^0-9]/g, "");
        return digits.length <= 13;
      }
    ),

  primerNombreResponsable: yup
    .string()
    .required("El primer nombre del responsable no puede estar vacío")
    .min(1, "El primer nombre del responsable debe tener entre 1 y 50 caracteres")
    .max(50, "El primer nombre del responsable debe tener entre 1 y 50 caracteres"),

  primerApellidoResponsable: yup
    .string()
    .required("El primer apellido del responsable no puede estar vacío")
    .min(1, "El primer apellido del responsable debe tener entre 1 y 50 caracteres")
    .max(50, "El primer apellido del responsable debe tener entre 1 y 50 caracteres"),

  telefono: yup
    .string()
    .required("El teléfono es requerido")
    .matches(/^\d+$/, "El valor del campo teléfono debe ser un número")
    .length(10, "El campo teléfono debe tener exactamente 10 caracteres"),

  segundoTelefono: yup
    .string()
    .optional()
    .nullable()
    .transform((value) => (value === "" || value === undefined ? null : value))
    .test(
      "segundo-telefono-format",
      "El valor del campo segundo teléfono debe ser un número de 10 dígitos",
      (value) => {
        if (!value) return true;
        return /^\d{10}$/.test(value);
      }
    ),

  diasAnticipaticionNotificacion: yup
    .number()
    .typeError("El valor del campo días de anticipación debe ser un número")
    .min(1, "El valor del campo días de anticipación debe ser mínimo 1")
    .max(10, "El valor del campo días de anticipación debe ser máximo 10")
    .required("El campo días de anticipación es requerido"),

  idCliente: yup
    .number()
    .typeError("El valor del campo Cliente no puede estar vacío")
    .min(1, "El valor del campo Cliente no puede estar vacío")
    .required("El valor del campo Cliente no puede estar vacío"),

  idClienteFacturacion: yup
    .number()
    .optional()
    .nullable()
    .transform((value) => (isNaN(value) ? null : value)),

  estado: yup
    .boolean()
    .typeError("El campo estado debe ser boolean")
    .optional(),

  correos: yup.array().optional(),
});

/**
 * Yup validation schema for CreatePuestoDto.
 * Same fields as update but all required.
 */
export const createPuestoSchema = yup.object({
  nombre: yup
    .string()
    .required("El nombre no puede estar vacío")
    .min(1, "El nombre debe tener entre 1 y 100 caracteres")
    .max(100, "El nombre debe tener entre 1 y 100 caracteres"),

  idCiudad: yup
    .number()
    .typeError("El valor del campo Ciudad no puede estar vacío")
    .min(1, "El valor del campo Ciudad no puede estar vacío")
    .required("El valor del campo Ciudad no puede estar vacío"),

  direccion: yup
    .string()
    .required("La dirección no puede estar vacía")
    .min(1, "La dirección debe tener entre 1 y 100 caracteres")
    .max(100, "La dirección debe tener entre 1 y 100 caracteres"),

  latitud: yup
    .string()
    .optional()
    .transform((value) => (!value || value.trim() === "" ? "0" : value))
    .test(
      "max-digits-latitud",
      "La latitud debe tener máximo 13 dígitos",
      (value) => {
        if (!value) return true;
        const digits = value.replace(/[^0-9]/g, "");
        return digits.length <= 13;
      }
    ),

  longitud: yup
    .string()
    .optional()
    .transform((value) => (!value || value.trim() === "" ? "0" : value))
    .test(
      "max-digits-longitud",
      "La longitud debe tener máximo 13 dígitos",
      (value) => {
        if (!value) return true;
        const digits = value.replace(/[^0-9]/g, "");
        return digits.length <= 13;
      }
    ),

  primerNombreResponsable: yup
    .string()
    .required("El primer nombre del responsable no puede estar vacío")
    .min(1, "El primer nombre del responsable debe tener entre 1 y 50 caracteres")
    .max(50, "El primer nombre del responsable debe tener entre 1 y 50 caracteres"),

  primerApellidoResponsable: yup
    .string()
    .required("El primer apellido del responsable no puede estar vacío")
    .min(1, "El primer apellido del responsable debe tener entre 1 y 50 caracteres")
    .max(50, "El primer apellido del responsable debe tener entre 1 y 50 caracteres"),

  telefono: yup
    .string()
    .required("El teléfono es requerido")
    .matches(/^\d+$/, "El valor del campo teléfono debe ser un número")
    .length(10, "El campo teléfono debe tener exactamente 10 caracteres"),

  segundoTelefono: yup
    .string()
    .optional()
    .nullable()
    .transform((value) => (value === "" || value === undefined ? null : value))
    .test(
      "segundo-telefono-format",
      "El valor del campo segundo teléfono debe ser un número de 10 dígitos",
      (value) => {
        if (!value) return true;
        return /^\d{10}$/.test(value);
      }
    ),

  diasAnticipaticionNotificacion: yup
    .number()
    .typeError("El valor del campo días de anticipación debe ser un número")
    .min(1, "El valor del campo días de anticipación debe ser mínimo 1")
    .max(10, "El valor del campo días de anticipación debe ser máximo 10")
    .required("El campo días de anticipación es requerido"),

  idCliente: yup
    .number()
    .typeError("El valor del campo Cliente no puede estar vacío")
    .min(1, "El valor del campo Cliente no puede estar vacío")
    .required("El valor del campo Cliente no puede estar vacío"),

  idClienteFacturacion: yup
    .number()
    .optional()
    .nullable()
    .transform((value) => (isNaN(value) ? null : value)),

  correos: yup.array().optional(),
});
