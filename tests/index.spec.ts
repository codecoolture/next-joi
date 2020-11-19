import Joi from "joi";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import connect, { NextConnect, RequestHandler } from "next-connect";
import validate, { ValidationSchemas } from "../src";
import { createTestServer, TestServer } from "./utils/TestServer";

// This function simulates a NEXT.js API Route definition
function postANewUser(_: NextApiRequest, res: NextApiResponse) {
  return res.json({ message: "Everything is okay!" });
}

type Handler =
  | NextApiHandler
  | NextConnect<NextApiRequest, NextApiResponse>
  | RequestHandler<NextApiRequest, NextApiResponse>;

type BuildSuiteOptions = {
  handlerBuilder: (schemas: ValidationSchemas, fn: NextApiHandler) => Handler;
  title: string;
};

function buildSuite({ handlerBuilder, title }: BuildSuiteOptions): void {
  let server: TestServer;

  beforeEach(() => {
    server = createTestServer();
  });

  afterEach(async () => {
    await server.close();
  });

  describe(title, () => {
    it("returns a 404 if there is no handler after validation", async () => {
      const handler = handlerBuilder({}, (undefined as unknown) as any);

      const response = await server.inject(handler, { method: "post" });

      expect(response.status).toBe(404);
    });

    it("returns a 200 response if there is no validation ", async () => {
      const handler = handlerBuilder({}, postANewUser);

      const response = await server.inject(handler, { method: "post" });

      expect(response.status).toBe(200);
    });

    it("treats schemas as mandatory by default", async () => {
      // Although the 'query' schema is not required (notice that it doesn't have .required() attached to the outer
      // Object schema), defined schemas are always treated as mandatory.
      const query = Joi.object({ slug: Joi.string().alphanum().length(10).required() });

      const handler = handlerBuilder({ query }, postANewUser);

      const response = await server.inject(handler, { method: "post" });

      expect(response.status).toBe(400);
    });

    describe("handling query params validation", () => {
      const schema = Joi.object({ email: Joi.string().email().required() });

      it("returns a 200 response if the validation passes", async () => {
        const handler = handlerBuilder({ query: schema }, postANewUser);

        const response = await server.inject(handler, { query: { email: "jon.snow@thewall.org" }, method: "post" });

        expect(response.status).toBe(200);
      });

      it("returns a 400 response if the validation doesn't pass", async () => {
        const handler = handlerBuilder({ query: schema }, postANewUser);

        const response = await server.inject(handler, {
          query: { email: "something.that.is.not.an.email" },
          method: "post",
        });

        expect(response.status).toBe(400);
      });
    });

    describe("handling body validation", () => {
      const schema = Joi.object({
        age: Joi.number().min(18),
        name: Joi.string().required(),
      });

      it("returns a 200 response if the validation passes", async () => {
        const handler = handlerBuilder({ body: schema }, postANewUser);

        const response = await server.inject(handler, {
          body: JSON.stringify({ age: 23, name: "Jon Snow" }),
          headers: { "content-type": "application/json" },
          method: "post",
        });

        expect(response.status).toBe(200);
      });

      it("returns a 400 response if the validation doesn't pass", async () => {
        const handler = handlerBuilder({ body: schema }, postANewUser);

        const response = await server.inject(handler, {
          body: JSON.stringify({ age: 4, name: "Jon Snow" }),
          headers: { "content-type": "application/json" },
          method: "post",
        });

        expect(response.status).toBe(400);
      });
    });
  });
}

describe("next-joi", () => {
  buildSuite({
    handlerBuilder: (schemas, fn) => validate()(schemas, fn),
    title: "working as a simple NEXT middleware",
  });

  buildSuite({
    handlerBuilder: (schemas, fn) => {
      if (undefined === fn) {
        // next-connect throws an error if passing an undefined handler
        return connect().post(validate()(schemas));
      }

      return connect().post(validate()(schemas), fn);
    },
    title: "working as a connect-like middleware",
  });
});
