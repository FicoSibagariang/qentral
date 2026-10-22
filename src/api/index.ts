import { Hono } from "hono";
import { apiKeyAuth } from "./middlewares/apiKeyAuth";
import jobsRoute from "./routes/jobs";

const api = new Hono();

api.use("/jobs/*", apiKeyAuth);
api.route("/jobs", jobsRoute);

export default api;
