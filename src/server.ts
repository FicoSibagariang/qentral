import { Hono } from "hono";
import api from "./api";
import { basicAuth } from "./api/middlewares/basicAuth";
import { serverAdapter, syncDashboardQueues } from "./dashboard";

const app = new Hono();

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Protect /ui and /ui/* with Basic Auth
app.use("/ui", basicAuth);
app.use("/ui/*", basicAuth);

// Handle trailing slash redirect for /ui/
app.get("/ui/", (c) => c.redirect("/ui"));

// Sync queues from Queue Registry on dashboard access
app.use("/ui", async (_c, next) => {
  syncDashboardQueues();
  await next();
});
app.use("/ui/*", async (_c, next) => {
  syncDashboardQueues();
  await next();
});

// Mount Bull-Board UI dashboard
app.route("/ui", serverAdapter.registerPlugin());

// Mount API routes under /api/v1
app.route("/api/v1", api);

export default app;
