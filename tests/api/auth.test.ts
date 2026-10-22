import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { apiKeyAuth } from "../../src/api/middlewares/apiKeyAuth";
import { basicAuth } from "../../src/api/middlewares/basicAuth";
import { env } from "../../src/config/env";

describe("Authentication & Security Middlewares", () => {
  const app = new Hono();

  // Protect /api/v1/jobs/* with apiKeyAuth
  app.use("/api/v1/jobs/*", apiKeyAuth);
  app.post("/api/v1/jobs/email-queue", (c) => {
    return c.json({ success: true, message: "Authorized" });
  });

  // Protect /ui and /ui/* with basicAuth
  app.use("/ui", basicAuth);
  app.use("/ui/*", basicAuth);
  app.get("/ui", (c) => {
    return c.text("Dashboard OK");
  });
  app.get("/ui/queues", (c) => {
    return c.text("Queues OK");
  });

  describe("API Key Middleware (/api/v1/jobs/*)", () => {
    it("Case 1 (Unhappy Path): should reject request without x-api-key header with 401", async () => {
      const res = await app.request("/api/v1/jobs/email-queue", {
        method: "POST",
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json).toHaveProperty("error");
    });

    it("Case 2 (Unhappy Path): should reject request with wrong x-api-key with 401", async () => {
      const res = await app.request("/api/v1/jobs/email-queue", {
        method: "POST",
        headers: {
          "x-api-key": "invalid-wrong-api-key",
        },
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json).toHaveProperty("error");
    });

    it("Case 3 (Happy Path): should allow request with valid x-api-key to next handler", async () => {
      const res = await app.request("/api/v1/jobs/email-queue", {
        method: "POST",
        headers: {
          "x-api-key": env.API_KEY,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ success: true, message: "Authorized" });
    });
  });

  describe("Dashboard Basic Auth Middleware (/ui)", () => {
    it("Case 4 (UI Auth): should reject access to /ui without Basic Auth header with 401 and WWW-Authenticate header", async () => {
      const res = await app.request("/ui");

      expect(res.status).toBe(401);
      expect(res.headers.get("WWW-Authenticate")).toBeDefined();
      expect(res.headers.get("WWW-Authenticate")).toContain("Basic");
    });

    it("Case 4b (UI Auth): should reject access with invalid credentials with 401", async () => {
      const credentials = Buffer.from("wronguser:wrongpass").toString("base64");
      const res = await app.request("/ui", {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });

      expect(res.status).toBe(401);
      expect(res.headers.get("WWW-Authenticate")).toBeDefined();
    });

    it("Case 5 (UI Auth): should allow access to /ui with valid credentials", async () => {
      const credentials = Buffer.from(`${env.DASHBOARD_USERNAME}:${env.DASHBOARD_PASSWORD}`).toString("base64");
      const res = await app.request("/ui", {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe("Dashboard OK");
    });

    it("Case 5b (UI Auth): should allow access to subroutes /ui/* with valid credentials", async () => {
      const credentials = Buffer.from(`${env.DASHBOARD_USERNAME}:${env.DASHBOARD_PASSWORD}`).toString("base64");
      const res = await app.request("/ui/queues", {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toBe("Queues OK");
    });
  });
});
