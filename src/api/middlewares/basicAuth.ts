import type { MiddlewareHandler } from "hono";
import { basicAuth as honoBasicAuth } from "hono/basic-auth";
import { env } from "../../config/env";

export const basicAuth: MiddlewareHandler = (c, next) => {
  const handler = honoBasicAuth({
    username: env.DASHBOARD_USERNAME,
    password: env.DASHBOARD_PASSWORD,
    realm: "Qentral Dashboard",
  });
  return handler(c, next);
};

export default basicAuth;
