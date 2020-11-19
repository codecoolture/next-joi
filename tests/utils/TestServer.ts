import { createServer, Server } from "http";
import fetch from "isomorphic-unfetch";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { NextConnect, RequestHandler } from "next-connect";
import { apiResolver } from "next/dist/next-server/server/api-utils";
import listen from "test-listen";

type InjectOptions = {
  body?: string;
  headers?: Record<string, string>;
  method?: string;
  query?: Record<string, string>;
};

export class TestServer {
  private instance?: Server;

  public async inject(
    handler:
      | NextApiHandler
      | NextConnect<NextApiRequest, NextApiResponse>
      | RequestHandler<NextApiRequest, NextApiResponse>,
    options: InjectOptions = {}
  ): Promise<Response> {
    this.instance = createServer((req, res) =>
      apiResolver(
        req,
        res,
        options.query,
        handler,
        {
          previewModeEncryptionKey: "",
          previewModeId: "",
          previewModeSigningKey: "",
        },
        true
      )
    );

    const url = await listen(this.instance);

    return fetch(url, options);
  }

  public close(): Promise<void> {
    return new Promise((res, rej) => {
      if (undefined === this.instance) {
        return res();
      }

      this.instance.close((err) => {
        if (err) {
          return rej(err);
        }

        return res();
      });
    });
  }
}

export function createTestServer(): TestServer {
  return new TestServer();
}
