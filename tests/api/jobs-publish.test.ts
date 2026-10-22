import { describe, it, expect, beforeEach, spyOn } from "bun:test";
import app from "../../src/server";
import { env } from "../../src/config/env";
import { getQueueByName, registerQueue } from "../../src/queues/registry";
import { emailQueue } from "../../src/queues/email.queue";
import type { PublishJobResponse } from "../../src/shared/types";

describe("Job Ingestion API (POST /api/v1/jobs/:queueName)", () => {
  const existingJobs = new Map<string, any>();

  beforeEach(() => {
    registerQueue(emailQueue);
    existingJobs.clear();

    // Mock emailQueue.add
    spyOn(emailQueue, "add").mockImplementation(async (name: string, data: any, opts?: any) => {
      const jobId = opts?.jobId || `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      if (existingJobs.has(jobId)) {
        return existingJobs.get(jobId);
      }

      const createdJob = {
        id: jobId,
        name,
        data,
        opts: { ...opts },
      };
      existingJobs.set(jobId, createdJob);
      return createdJob as any;
    });
  });

  it("should reject request without API Key with 401", async () => {
    const res = await app.request("/api/v1/jobs/email-queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobName: "test", data: {} }),
    });

    expect(res.status).toBe(401);
    const json = (await res.json()) as any;
    expect(json).toHaveProperty("error");
  });

  it("Case 1 (Unhappy Path): should return 404 when publishing to unregistered queue", async () => {
    const res = await app.request("/api/v1/jobs/unknown-queue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.API_KEY,
      },
      body: JSON.stringify({ jobName: "test", data: {} }),
    });

    expect(res.status).toBe(404);
    const json = (await res.json()) as any;
    expect(json).toHaveProperty("error");
    expect(json.message).toContain("unknown-queue");
  });

  it("Case 2 (Unhappy Path): should return 400 when body is empty or missing jobName", async () => {
    // Empty JSON
    const resEmpty = await app.request("/api/v1/jobs/email-queue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.API_KEY,
      },
      body: JSON.stringify({}),
    });

    expect(resEmpty.status).toBe(400);
    const jsonEmpty = (await resEmpty.json()) as any;
    expect(jsonEmpty).toHaveProperty("error");

    // Missing jobName (only data)
    const resMissing = await app.request("/api/v1/jobs/email-queue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.API_KEY,
      },
      body: JSON.stringify({ data: { foo: "bar" } }),
    });

    expect(resMissing.status).toBe(400);
    const jsonMissing = (await resMissing.json()) as any;
    expect(jsonMissing).toHaveProperty("error");

    // Blank jobName
    const resBlank = await app.request("/api/v1/jobs/email-queue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.API_KEY,
      },
      body: JSON.stringify({ jobName: "   " }),
    });

    expect(resBlank.status).toBe(400);
  });

  it("Case 3 (Happy Path): should return 202 Accepted when payload is valid", async () => {
    const res = await app.request("/api/v1/jobs/email-queue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.API_KEY,
      },
      body: JSON.stringify({
        jobName: "send-welcome-email",
        data: { to: "user@example.com", subject: "Welcome" },
      }),
    });

    expect(res.status).toBe(202);
    const json = (await res.json()) as PublishJobResponse;
    expect(json.success).toBe(true);
    expect(json.queue).toBe("email-queue");
    expect(json.jobId).toBeDefined();
    expect(typeof json.jobId).toBe("string");
  });

  it("Case 4 (Opsi Lanjutan): should pass delay option to queue", async () => {
    let capturedOpts: any = null;
    const q = getQueueByName("email-queue")!;
    spyOn(q, "add").mockImplementation(async (name: string, data: any, opts?: any) => {
      capturedOpts = opts;
      return { id: "job-delayed-1", name, data, opts } as any;
    });

    const res = await app.request("/api/v1/jobs/email-queue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.API_KEY,
      },
      body: JSON.stringify({
        jobName: "scheduled-email",
        data: { to: "user@example.com" },
        options: { delay: 5000, attempts: 3 },
      }),
    });

    expect(res.status).toBe(202);
    expect(capturedOpts).toBeDefined();
    expect(capturedOpts.delay).toBe(5000);
    expect(capturedOpts.attempts).toBe(3);
  });

  it("Case 5 (Idempotensi): should support custom jobId and prevent duplicates", async () => {
    const payload = {
      jobName: "idempotent-email",
      data: { orderId: "ord-123" },
      options: { jobId: "custom-unique-id" },
    };

    // First request
    const res1 = await app.request("/api/v1/jobs/email-queue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.API_KEY,
      },
      body: JSON.stringify(payload),
    });

    expect(res1.status).toBe(202);
    const json1 = (await res1.json()) as PublishJobResponse;
    expect(json1.jobId).toBe("custom-unique-id");

    // Second request with same jobId
    const res2 = await app.request("/api/v1/jobs/email-queue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.API_KEY,
      },
      body: JSON.stringify(payload),
    });

    expect(res2.status).toBe(202);
    const json2 = (await res2.json()) as PublishJobResponse;
    expect(json2.jobId).toBe("custom-unique-id");
    expect(existingJobs.size).toBe(1);
  });
});
