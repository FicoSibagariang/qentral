import { Queue, type QueueOptions } from "bullmq";
import { getRedisConnection, getDefaultRetentionOptions } from "../config/redis";

const queueRegistry = new Map<string, Queue>();

export function registerQueue(queue: Queue): Queue {
  queueRegistry.set(queue.name, queue);
  return queue;
}

export function getQueueByName(name: string): Queue | undefined {
  return queueRegistry.get(name);
}

export function getAllQueues(): Queue[] {
  return Array.from(queueRegistry.values());
}

export function unregisterQueue(name: string): boolean {
  return queueRegistry.delete(name);
}

export function createQueue(name: string, options?: Partial<QueueOptions>): Queue {
  const defaultOptions: QueueOptions = {
    connection: getRedisConnection() as any,
    defaultJobOptions: getDefaultRetentionOptions(),
  };

  const mergedOptions: QueueOptions = {
    ...defaultOptions,
    ...options,
    defaultJobOptions: {
      ...defaultOptions.defaultJobOptions,
      ...options?.defaultJobOptions,
    },
  };

  const queue = new Queue(name, mergedOptions);
  return registerQueue(queue);
}

export function clearRegistry(): void {
  queueRegistry.clear();
}
