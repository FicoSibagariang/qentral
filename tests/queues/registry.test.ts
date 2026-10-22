import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { Queue } from "bullmq";
import RedisMock from "ioredis-mock";
import {
  registerQueue,
  getQueueByName,
  getAllQueues,
  unregisterQueue,
  createQueue,
  clearRegistry,
} from "../../src/queues/registry";
import { redisConnectionOptions, getDefaultRetentionOptions } from "../../src/config/redis";
import { emailQueue } from "../../src/queues/email.queue";

describe("Queue Registry & Redis Configuration", () => {
  beforeEach(() => {
    clearRegistry();
  });

  afterEach(async () => {
    for (const q of getAllQueues()) {
      await q.close();
    }
    clearRegistry();
  });

  describe("Redis Configuration", () => {
    it("should export redis connection options with null maxRetriesPerRequest", () => {
      expect(redisConnectionOptions).toBeDefined();
      expect(redisConnectionOptions.host).toBeDefined();
      expect(redisConnectionOptions.port).toBeDefined();
      expect(redisConnectionOptions.maxRetriesPerRequest).toBeNull();
    });

    it("should export default retention options matching env config", () => {
      const retention = getDefaultRetentionOptions();
      expect(retention).toBeDefined();
      expect(retention.removeOnComplete).toEqual({ count: 1000 });
      expect(retention.removeOnFail).toEqual({ count: 5000 });
    });
  });

  describe("Queue Registry", () => {
    it("Case 1: should return Queue instance when queue is registered", () => {
      const mockRedis = new RedisMock();
      const testQueue = new Queue("test-registered", {
        connection: mockRedis as any,
      });

      registerQueue(testQueue);

      const retrieved = getQueueByName("test-registered");
      expect(retrieved).toBeDefined();
      expect(retrieved).toBe(testQueue);
      expect(retrieved?.name).toBe("test-registered");
    });

    it("Case 2: should return undefined when queue is not registered", () => {
      const retrieved = getQueueByName("nama-acak");
      expect(retrieved).toBeUndefined();
    });

    it("Case 3: should return an array of all registered queues", () => {
      const mockRedis = new RedisMock();
      const queue1 = new Queue("queue-1", { connection: mockRedis as any });
      const queue2 = new Queue("queue-2", { connection: mockRedis as any });

      registerQueue(queue1);
      registerQueue(queue2);

      const all = getAllQueues();
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBe(2);
      expect(all).toContain(queue1);
      expect(all).toContain(queue2);
    });

    it("should unregister a queue by name", () => {
      const mockRedis = new RedisMock();
      const queue = new Queue("queue-temp", { connection: mockRedis as any });
      registerQueue(queue);
      expect(getQueueByName("queue-temp")).toBe(queue);

      const removed = unregisterQueue("queue-temp");
      expect(removed).toBe(true);
      expect(getQueueByName("queue-temp")).toBeUndefined();
    });

    it("should apply default retention options when creating a queue via createQueue", () => {
      const mockRedis = new RedisMock();
      const queue = createQueue("retention-test", {
        connection: mockRedis as any,
      });

      expect(queue).toBeDefined();
      expect(queue.name).toBe("retention-test");
      expect(queue.defaultJobOptions?.removeOnComplete).toEqual({ count: 1000 });
      expect(queue.defaultJobOptions?.removeOnFail).toEqual({ count: 5000 });

      const retrieved = getQueueByName("retention-test");
      expect(retrieved).toBe(queue);
    });

    it("should provide an initial example queue (email-queue)", () => {
      registerQueue(emailQueue);
      expect(emailQueue).toBeDefined();
      expect(emailQueue.name).toBe("email-queue");
      expect(getQueueByName("email-queue")).toBe(emailQueue);
      expect(emailQueue.defaultJobOptions?.removeOnComplete).toEqual({ count: 1000 });
      expect(emailQueue.defaultJobOptions?.removeOnFail).toEqual({ count: 5000 });
    });
  });
});
