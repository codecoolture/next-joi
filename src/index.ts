import { Schema } from "joi";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { NextHandler, RequestHandler } from "next-connect";

export type ValidableRequestFields = Pick<NextApiRequest, "query" | "body">;

export type ValidationSchemas = {
  [K in keyof ValidableRequestFields]?: Schema;
};

export type ValidationFunction = (
  schemas: ValidationSchemas,
  handler?: NextApiHandler
) => NextApiHandler | RequestHandler<NextApiRequest, NextApiResponse>;

export type OnValidationError = (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>;

export type Configuration = { onValidationError: OnValidationError };

export default function withJoi(config?: Configuration): ValidationFunction {
  const onValidationError: OnValidationError = config ? config.onValidationError : (_, res) => res.status(400).end();

  return (schemas, handler) => {
    return (req: NextApiRequest, res: NextApiResponse, next?: NextHandler) => {
      const fields: (keyof ValidableRequestFields)[] = ["body", "query"];

      const hasValidationErrors = fields.some((field) => {
        const schema = schemas[field];

        return schema && schema.required().validate(req[field]).error;
      });

      if (hasValidationErrors) {
        return onValidationError(req, res);
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
