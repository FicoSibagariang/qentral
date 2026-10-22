import type { MiddlewareHandler } from "hono";
import { env } from "../../config/env";

export const apiKeyAuth: MiddlewareHandler = async (c, next) => {
  const apiKey = c.req.header("x-api-key");

  if (!apiKey || apiKey !== env.API_KEY) {
    return c.json(
      {
        error: "Unauthorized",
        message: "Header 'x-api-key' tidak valid atau tidak disertakan.",
      },
      401
    );
  }

  await next();
};

export default apiKeyAuth;
