import { Schema, ValidationError, ValidationOptions } from "joi";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { NextHandler, RequestHandler } from "next-connect";

export type ValidableRequestFields = Pick<NextApiRequest, "body" | "headers" | "query">;

export type ValidationSchemas = {
  [K in keyof ValidableRequestFields]?: Schema;
};

export type ValidationFunction = (
  schemas: ValidationSchemas,
  handler?: NextApiHandler
) => NextApiHandler | RequestHandler<NextApiRequest, NextApiResponse>;

export type OnValidationError = (
  req: NextApiRequest,
  res: NextApiResponse,
  error: ValidationError
) => void | Promise<void>;

export type Configuration = {
  onValidationError?: OnValidationError,
  validationOptions?: ValidationOptions,
};

const defaultConfig = {
  onValidationError: ((_, res) => res.status(400).end()) as OnValidationError,
}

export default function withJoi(userConfig: Configuration = {}): ValidationFunction {
  const config = { ...defaultConfig, ...userConfig };
  const onValidationError: OnValidationError = config.onValidationError;

  return (schemas, handler) => {
    return (req: NextApiRequest, res: NextApiResponse, next?: NextHandler) => {
      const fields: (keyof ValidableRequestFields)[] = ["body", "headers", "query"];

      const validationError = fields.reduce<ValidationError | undefined>((error, field) => {
        if (undefined !== error) {
          return error;
        }

        const schema = schemas[field];

        return schema && schema.required().validate(req[field], config.validationOptions).error;
      }, undefined);

      if (undefined !== validationError) {
        return onValidationError(req, res, validationError);
      }

      if (undefined !== next) {
        return next();
      }

      if (undefined !== handler) {
        return handler(req, res);
      }

      res.status(404).end();
    };
  };
}
