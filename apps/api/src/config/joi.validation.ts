import * as Joi from 'joi';

export const JoiValidationSchema = Joi.object({
    ENV: Joi.string().default('dev'),
    TOKEN_VIDELCA: Joi.required(),
    JWT_SECRET: Joi.required(),
    AUTH_TOKEN: Joi.required(),
    DEFAULT_LIMIT: Joi.number().default(10),
    HOST_PUBLIC: Joi.required(),
    HOST_API: Joi.required(),
    HOST_FRONTEND: Joi.required(),
    PORT: Joi.number().default(3000),
    DB_NAME: Joi.required(),
    DB_HOST: Joi.required(),
    DB_PORT: Joi.required(),
    DB_USERNAME: Joi.required(),
    DB_PASSWORD: Joi.required(),
    MAILER_SERVICE: Joi.required(),
    MAILER_EMAIL: Joi.required(),
    MAILER_SECRET_KEY: Joi.required(),
});