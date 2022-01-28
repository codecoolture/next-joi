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

const supportedFields: (keyof ValidableRequestFields)[] = ["body", "headers", "query"];

export default function withJoi(userConfig: Configuration = {}): ValidationFunction {
  const config = { ...defaultConfig, ...userConfig };
  const onValidationError: OnValidationError = config.onValidationError;

  return (schemas, handler) => {
    const keys = Object.keys(schemas) as (keyof ValidableRequestFields)[];
    const fieldsToValidate = keys.filter(field => supportedFields.includes(field));

    return (req: NextApiRequest, res: NextApiResponse, next?: NextHandler) => {
      try {
        const values = fieldsToValidate.map((field) => {
          const schema = schemas[field] as Schema;

          const result = schema.required().validate(req[field], config.validationOptions);

          if (result.error) {
            throw result.error;
          }

          return [field, result.value] as [keyof ValidableRequestFields, any];
        });

        if (config.validationOptions?.convert !== false) {
          values.forEach(([field, value]) => req[field] = value);
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          return onValidationError(req, res, error);
        }

        throw error;
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
