import { createServer, type Server, type RequestListener } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, expect, it, vi } from "vitest";
import { get, post } from "../src/client.js";

const servers: Server[] = [];
const fakeKey = "fixture-not-a-real-key";
async function listen(handler: RequestListener) {
  const server = createServer(handler);
  servers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}
afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
          server.closeAllConnections();
        }),
    ),
  );
});

const redirects = [301, 302, 303, 307, 308].flatMap((status) =>
  ["GET", "POST"].flatMap((method) =>
    ["same-origin", "cross-origin"].map((target) => ({
      status,
      method,
      target,
    })),
  ),
);
it.each(redirects)(
  "rejects $status $method $target before sending the redirected request",
  async ({ status, method, target }) => {
    let destinationRequests = 0;
    let originalRequests = 0;
    const destination = await listen((_req, res) => {
      destinationRequests++;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ status: "success" }));
    });
    const origin = await listen((req, res) => {
      if (req.url === "/destination") {
        destinationRequests++;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ status: "success" }));
        return;
      }
      originalRequests++;
      expect(req.headers["x-api-key"]).toBe(fakeKey);
      res.writeHead(status, {
        Location:
          target === "same-origin"
            ? "/destination"
            : `${destination}/destination`,
      });
      res.end();
    });
    vi.stubEnv("RECOUP_API_KEY", fakeKey);
    vi.stubEnv("RECOUP_API_URL", origin);
    const result = await (
      method === "GET"
        ? get("/redirect")
        : post("/redirect", { example: "synthetic" })
    ).then(
      (value) => ({ value, error: undefined }),
      (error) => ({ value: undefined, error }),
    );
    expect(originalRequests).toBe(1);
    expect(destinationRequests).toBe(0);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe(
      "API redirect rejected. Use a trusted API URL that does not redirect.",
    );
    expect(result.value).toBeUndefined();
  },
);

it.each(["GET", "POST"])(
  "preserves a successful direct %s request",
  async (method) => {
    const requests: {
      method: string | undefined;
      url: string | undefined;
      key: string | string[] | undefined;
      body: string;
    }[] = [];
    const origin = await listen(async (req, res) => {
      let body = "";
      for await (const chunk of req) body += chunk.toString();
      requests.push({
        method: req.method,
        url: req.url,
        key: req.headers["x-api-key"],
        body,
      });
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ status: "success", result: "synthetic" }));
    });
    vi.stubEnv("RECOUP_API_KEY", fakeKey);
    vi.stubEnv("RECOUP_API_URL", origin);
    const result =
      method === "GET"
        ? await get("/direct", { q: "a b", empty: "" })
        : await post("/direct", { example: "synthetic" });
    expect(result).toEqual({ status: "success", result: "synthetic" });
    expect(requests).toEqual([
      {
        method,
        url: method === "GET" ? "/direct?q=a+b" : "/direct",
        key: fakeKey,
        body: method === "POST" ? JSON.stringify({ example: "synthetic" }) : "",
      },
    ]);
  },
);
