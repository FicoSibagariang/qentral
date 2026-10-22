import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import app from "../../src/server";
import { env } from "../../src/config/env";
import { registerQueue } from "../../src/queues/registry";
import { emailQueue } from "../../src/queues/email.queue";
import type { JobStatusResponse } from "../../src/shared/types";

describe("Job Status & Result API (GET /api/v1/jobs/:queueName/:jobId)", () => {
  const mockJobs = new Map<string, any>();

  beforeEach(() => {
    registerQueue(emailQueue);
    mockJobs.clear();

    // Mock emailQueue.getJob
    spyOn(emailQueue, "getJob").mockImplementation(async (jobId: string) => {
      return mockJobs.get(jobId) || null;
    });
  });

  it("should reject request without API Key with 401", async () => {
    const res = await app.request("/api/v1/jobs/email-queue/job-123", {
      method: "GET",
    });

    expect(res.status).toBe(401);
    const json = (await res.json()) as any;
    expect(json).toHaveProperty("error");
  });

  it("should return 404 when queue is not registered", async () => {
    const res = await app.request("/api/v1/jobs/unknown-queue/job-123", {
      method: "GET",
      headers: {
        "x-api-key": env.API_KEY,
      },
    });

    expect(res.status).toBe(404);
    const json = (await res.json()) as any;
    expect(json).toHaveProperty("error");
    expect(json.message).toContain("unknown-queue");
  });

  it("Case 1 (Unhappy Path): should return 404 when jobId does not exist", async () => {
    const res = await app.request("/api/v1/jobs/email-queue/non-existent-id", {
      method: "GET",
      headers: {
        "x-api-key": env.API_KEY,
      },
    });

    expect(res.status).toBe(404);
    const json = (await res.json()) as any;
    expect(json).toHaveProperty("error");
    expect(json.message).toContain("non-existent-id");
  });

  it("Case 2 (Happy Path - Waiting): should return state 'waiting' for a newly queued job", async () => {
    mockJobs.set("job-waiting-1", {
      id: "job-waiting-1",
      name: "send-welcome-email",
      getState: async () => "waiting",
      progress: 0,
      returnvalue: null,
      failedReason: null,
    });

    const res = await app.request("/api/v1/jobs/email-queue/job-waiting-1", {
      method: "GET",
      headers: {
        "x-api-key": env.API_KEY,
      },
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as JobStatusResponse;
    expect(json.id).toBe("job-waiting-1");
    expect(json.state).toBe("waiting");
    expect(json.progress).toBe(0);
    expect(json.result).toBeNull();
    expect(json.failedReason).toBeNull();
  });

  it("Case 3 (Happy Path - Completed): should return state 'completed', progress 100, and result", async () => {
    mockJobs.set("job-completed-2", {
      id: "job-completed-2",
      name: "send-welcome-email",
      getState: async () => "completed",
      progress: 100,
      returnvalue: { sent: true, messageId: "msg_999" },
      failedReason: null,
    });

    const res = await app.request("/api/v1/jobs/email-queue/job-completed-2", {
      method: "GET",
      headers: {
        "x-api-key": env.API_KEY,
      },
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as JobStatusResponse<{ sent: boolean; messageId: string }>;
    expect(json.id).toBe("job-completed-2");
    expect(json.state).toBe("completed");
    expect(json.progress).toBe(100);
    expect(json.result).toEqual({ sent: true, messageId: "msg_999" });
    expect(json.failedReason).toBeNull();
  });

  it("Case 4 (Happy Path - Failed): should return state 'failed' and failedReason", async () => {
    mockJobs.set("job-failed-3", {
      id: "job-failed-3",
      name: "send-welcome-email",
      getState: async () => "failed",
      progress: 50,
      returnvalue: null,
      failedReason: "SMTP server timeout after 3 attempts",
    });

    const res = await app.request("/api/v1/jobs/email-queue/job-failed-3", {
      method: "GET",
      headers: {
        "x-api-key": env.API_KEY,
      },
    });

    expect(res.status).toBe(200);
    const json = (await res.json()) as JobStatusResponse;
    expect(json.id).toBe("job-failed-3");
    expect(json.state).toBe("failed");
    expect(json.failedReason).toBe("SMTP server timeout after 3 attempts");
  });
});
