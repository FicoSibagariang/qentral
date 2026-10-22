import { Hono } from "hono";
import { getQueueByName } from "../../queues/registry";
import type { PublishJobRequest, PublishJobResponse, JobStatusResponse } from "../../shared/types";

const jobsRoute = new Hono();

// POST /api/v1/jobs/:queueName
jobsRoute.post("/:queueName", async (c) => {
  const queueName = c.req.param("queueName");
  const queue = getQueueByName(queueName);

  if (!queue) {
    return c.json(
      {
        error: "Not Found",
        message: `Antrean '${queueName}' tidak ditemukan atau belum terdaftar.`,
      },
      404
    );
  }

  let body: Partial<PublishJobRequest>;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        error: "Bad Request",
        message: "Body JSON tidak valid atau kosong.",
      },
      400
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    typeof body.jobName !== "string" ||
    body.jobName.trim() === ""
  ) {
    return c.json(
      {
        error: "Bad Request",
        message: "Field 'jobName' wajib diisi berupa string non-kosong.",
      },
      400
    );
  }

  const jobName = body.jobName.trim();
  const data = body.data ?? {};
  const options = body.options ?? {};

  try {
    const job = await queue.add(jobName, data, options);
    const response: PublishJobResponse = {
      success: true,
      message: "Job berhasil dimasukkan ke antrean",
      queue: queueName,
      jobId: String(job.id),
    };
    return c.json(response, 202);
  } catch (err: any) {
    return c.json(
      {
        error: "Internal Server Error",
        message: err?.message || "Gagal memasukkan job ke antrean.",
      },
      500
    );
  }
});

// GET /api/v1/jobs/:queueName/:jobId
jobsRoute.get("/:queueName/:jobId", async (c) => {
  const queueName = c.req.param("queueName");
  const jobId = c.req.param("jobId");

  const queue = getQueueByName(queueName);
  if (!queue) {
    return c.json(
      {
        error: "Not Found",
        message: `Antrean '${queueName}' tidak ditemukan atau belum terdaftar.`,
      },
      404
    );
  }

  const job = await queue.getJob(jobId);
  if (!job) {
    return c.json(
      {
        error: "Not Found",
        message: `Job dengan ID '${jobId}' tidak ditemukan pada antrean '${queueName}'.`,
      },
      404
    );
  }

  const state = await job.getState();
  const response: JobStatusResponse = {
    id: String(job.id),
    name: job.name,
    state,
    progress: job.progress ?? 0,
    result: job.returnvalue ?? null,
    failedReason: job.failedReason ?? null,
  };

  return c.json(response, 200);
});

export default jobsRoute;
