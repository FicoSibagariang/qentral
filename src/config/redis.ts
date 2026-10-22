import type { DefaultJobOptions } from "bullmq";
import type { RedisOptions } from "ioredis";
import Redis from "ioredis";
import RedisMock from "ioredis-mock";
import { env } from "./env";

export const redisConnectionOptions: RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  db: env.REDIS_DB,
  maxRetriesPerRequest: null,
};

export function getDefaultRetentionOptions(): DefaultJobOptions {
  return {
    removeOnComplete: {
      count: env.JOB_RETENTION_COMPLETED_COUNT,
    },
    removeOnFail: {
      count: env.JOB_RETENTION_FAILED_COUNT,
    },
  };
}

export function getRedisConnection(): RedisOptions | Redis {
  if (process.env.NODE_ENV === "test" && !process.env.USE_REAL_REDIS) {
    return new RedisMock() as unknown as Redis;
  }
  return redisConnectionOptions;
}

export function createRedisClient(overrides?: Partial<RedisOptions>): Redis {
  if (process.env.NODE_ENV === "test" && !process.env.USE_REAL_REDIS) {
    return new RedisMock() as unknown as Redis;
  }
  return new Redis({
    ...redisConnectionOptions,
    ...overrides,
    maxRetriesPerRequest: null,
  });
}
