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

export type JobProgress = number | object | string | boolean;

export interface JobStatusResponse<TResult = unknown> {
  id: string;
  name?: string;
  state: string;
  progress: JobProgress;
  result: TResult | null;
  failedReason: string | null;
}
