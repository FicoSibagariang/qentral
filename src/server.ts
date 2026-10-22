import { Hono } from "hono";
import api from "./api";

const app = new Hono();

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Mount API routes under /api/v1
app.route("/api/v1", api);

export default app;
