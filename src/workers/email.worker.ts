import { Worker, type Job, type WorkerOptions } from "bullmq";
import { getRedisConnection } from "../config/redis";
import { env } from "../config/env";
import { EMAIL_QUEUE_NAME } from "../queues/email.queue";
import type { EmailJobData, EmailJobResult } from "../shared/types";

export type { EmailJobData, EmailJobResult };

export async function emailProcessor(job: Job<EmailJobData, EmailJobResult>): Promise<EmailJobResult> {
  await job.log(`[Worker] Started processing email job ${job.id}`);
  await job.updateProgress(25);

  if (job.data?.shouldFail) {
    await job.log(`[Worker] Job ${job.id} failed intentionally`);
    throw new Error(`Failed to process email for ${job.data.to || "unknown"}`);
  }

  await job.updateProgress(75);
  await job.log(`[Worker] Email sent successfully to ${job.data.to}`);
  await job.updateProgress(100);

  return {
    sent: true,
    recipient: job.data.to,
    sentAt: new Date().toISOString(),
  };
}

export function createEmailWorker(options?: Partial<WorkerOptions>): Worker<EmailJobData, EmailJobResult> {
  const isTest = process.env.NODE_ENV === "test";
  return new Worker<EmailJobData, EmailJobResult>(
    EMAIL_QUEUE_NAME,
    emailProcessor,
    {
      connection: getRedisConnection() as any,
      concurrency: env.DEFAULT_WORKER_CONCURRENCY,
      autorun: isTest ? false : true,
      ...options,
    }
  );
}
