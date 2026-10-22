import { describe, it, expect } from "bun:test";
import { env, loadEnv } from "../src/config/env";

describe("Setup & Environment Config", () => {
  it("should have Bun test runner functioning properly", () => {
    const sum = (a: number, b: number) => a + b;
    expect(sum(1, 2)).toBe(3);
  });

  it("should provide default configuration matching .env.example", () => {
    const config = loadEnv({});
    expect(config.NODE_ENV).toBe("development");
    expect(config.PORT).toBe(3000);
    expect(config.REDIS_HOST).toBe("127.0.0.1");
    expect(config.REDIS_PORT).toBe(6379);
    expect(config.REDIS_PASSWORD).toBe("");
    expect(config.REDIS_DB).toBe(0);
    expect(config.API_KEY).toBe("ganti-dengan-kunci-rahasia-anda");
    expect(config.DASHBOARD_USERNAME).toBe("admin");
    expect(config.DASHBOARD_PASSWORD).toBe("adminpassword");
    expect(config.DEFAULT_WORKER_CONCURRENCY).toBe(5);
    expect(config.JOB_RETENTION_COMPLETED_COUNT).toBe(1000);
    expect(config.JOB_RETENTION_FAILED_COUNT).toBe(5000);
  });

  it("should read custom environment variables and parse numbers correctly", () => {
    const custom = loadEnv({
      NODE_ENV: "production",
      PORT: "8080",
      REDIS_HOST: "redis.internal",
      REDIS_PORT: "6380",
      REDIS_PASSWORD: "secretpassword",
      REDIS_DB: "2",
      API_KEY: "my-super-secret-key",
      DASHBOARD_USERNAME: "superadmin",
      DASHBOARD_PASSWORD: "superpassword",
      DEFAULT_WORKER_CONCURRENCY: "10",
      JOB_RETENTION_COMPLETED_COUNT: "500",
      JOB_RETENTION_FAILED_COUNT: "2000",
    });

    expect(custom.NODE_ENV).toBe("production");
    expect(custom.PORT).toBe(8080);
    expect(custom.REDIS_HOST).toBe("redis.internal");
    expect(custom.REDIS_PORT).toBe(6380);
    expect(custom.REDIS_PASSWORD).toBe("secretpassword");
    expect(custom.REDIS_DB).toBe(2);
    expect(custom.API_KEY).toBe("my-super-secret-key");
    expect(custom.DASHBOARD_USERNAME).toBe("superadmin");
    expect(custom.DASHBOARD_PASSWORD).toBe("superpassword");
    expect(custom.DEFAULT_WORKER_CONCURRENCY).toBe(10);
    expect(custom.JOB_RETENTION_COMPLETED_COUNT).toBe(500);
    expect(custom.JOB_RETENTION_FAILED_COUNT).toBe(2000);
  });

  it("should handle 0 correctly for numeric values and fallback invalid numbers", () => {
    const config = loadEnv({
      REDIS_DB: "0",
      PORT: "not-a-number",
    });
    expect(config.REDIS_DB).toBe(0);
    expect(config.PORT).toBe(3000);
  });

  it("should export a singleton env object", () => {
    expect(env).toBeDefined();
    expect(typeof env.PORT).toBe("number");
    expect(typeof env.REDIS_HOST).toBe("string");
  });
});
