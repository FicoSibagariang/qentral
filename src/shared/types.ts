import type { JobsOptions } from "bullmq";

export interface BaseJobPayload<T = unknown> {
  traceId?: string;
  requestedBy?: string;
  timestamp?: string;
  data: T;
}

export interface PublishJobRequest<T = unknown> {
  jobName: string;
  data?: T;
  options?: JobsOptions;
}

export interface PublishJobResponse {
  success: boolean;
  message: string;
  queue: string;
  jobId: string;
}
