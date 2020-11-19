import { Schema } from "joi";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { RequestHandler, NextHandler } from "next-connect";

export type ValidableRequestFields = Pick<NextApiRequest, "query" | "body">;

export type ValidationSchemas = {
  [K in keyof ValidableRequestFields]?: Schema;
};

export type ValidationFunction = (
  schemas: ValidationSchemas,
  handler?: NextApiHandler
) => NextApiHandler | RequestHandler<NextApiRequest, NextApiResponse>;

export type Configuration = { onFailAction: (req: NextApiRequest, res: NextApiResponse) => void | Promise<void> };

export default function withJoi(config?: Configuration): ValidationFunction {
  return (schemas, handler) => {
    return (req: NextApiRequest, res: NextApiResponse, next?: NextHandler) => {
      const fields: (keyof ValidableRequestFields)[] = ["body", "query"];

      const hasValidationErrors = fields.some((field) => {
        const schema = schemas[field];

        return schema && schema.required().validate(req[field]).error;
      });

      if (hasValidationErrors) {
        if (config) {
          return config.onFailAction(req, res);
        }

        return res.status(400).end();
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
