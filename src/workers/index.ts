import type { Worker } from "bullmq";
import { createEmailWorker } from "./email.worker";

let activeWorkers: Worker[] = [];

export function startWorkers(): Worker[] {
  if (activeWorkers.length > 0) {
    return activeWorkers;
  }

  const emailWorker = createEmailWorker();
  activeWorkers = [emailWorker];

  return activeWorkers;
}

export function getActiveWorkers(): Worker[] {
  return [...activeWorkers];
}

export async function stopWorkers(): Promise<void> {
  const workersToClose = [...activeWorkers];
  activeWorkers = [];

  await Promise.all(workersToClose.map((w) => w.close()));
}

export * from "./email.worker";
