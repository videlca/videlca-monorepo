import * as yup from "yup";

/**
 * Yup validation schema for CreateClienteDto.
 * Mirrors the backend class-validator rules from create-cliente.dto.ts
 */
export const createClienteSchema = yup.object({
  idTipoIdentificacion: yup
    .number()
    .typeError("El valor del campo Tipo de identificación no puede estar vacío")
    .min(1, "El valor del campo Tipo de identificación no puede estar vacío")
    .required("El valor del campo Tipo de identificación no puede estar vacío"),

  numeroIdentificacion: yup
    .string()
    .required("El campo número de identificación no puede estar vacío")
    .max(50, "El campo número de identificación no puede exceder los 50 caracteres")
    .matches(/^\d+$/, "Solo números permitidos"),

  nombre: yup
    .string()
    .required("El campo nombre no puede estar vacío")
    .max(50, "El campo nombre no puede exceder los 50 caracteres"),

  idTipoCliente: yup
    .number()
    .typeError("El valor del campo Tipo de Cliente no puede estar vacío")
    .min(1, "El valor del campo Tipo de Cliente no puede estar vacío")
    .required("El valor del campo Tipo de Cliente no puede estar vacío"),

  // Used only locally in the form, not sent to the backend
  idSegmentacion: yup.number().optional().default(0),

  idSubSegmentacion: yup
    .number()
    .optional()
    .transform((value) => (isNaN(value) ? undefined : value)),
});

/**
 * Yup validation schema for UpdateClienteDto.
 * Extends CreateClienteDto (all fields optional via PartialType) + estado boolean.
 */
export const updateClienteSchema = yup.object({
  idTipoIdentificacion: yup
    .number()
    .typeError("El valor del campo Tipo de identificación no puede estar vacío")
    .min(1, "El valor del campo Tipo de identificación no puede estar vacío")
    .required("El valor del campo Tipo de identificación no puede estar vacío"),

  numeroIdentificacion: yup
    .string()
    .required("El campo número de identificación no puede estar vacío")
    .max(50, "El campo número de identificación no puede exceder los 50 caracteres")
    .matches(/^\d+$/, "Solo números permitidos"),

  nombre: yup
    .string()
    .required("El campo nombre no puede estar vacío")
    .max(50, "El campo nombre no puede exceder los 50 caracteres"),

  idTipoCliente: yup
    .number()
    .typeError("El valor del campo Tipo de Cliente no puede estar vacío")
    .min(1, "El valor del campo Tipo de Cliente no puede estar vacío")
    .required("El valor del campo Tipo de Cliente no puede estar vacío"),

  // Used only locally in the form, not sent to the backend
  idSegmentacion: yup.number().optional().default(0),

  idSubSegmentacion: yup
    .number()
    .optional()
    .transform((value) => (isNaN(value) ? undefined : value)),

  estado: yup
    .boolean()
    .typeError("El campo estado debe ser boolean")
    .optional(),
});

export type CreateClienteFormData = yup.InferType<typeof createClienteSchema> & {
  idSegmentacion: number;
};

export type UpdateClienteFormData = yup.InferType<typeof updateClienteSchema> & {
  idSegmentacion: number;
};
